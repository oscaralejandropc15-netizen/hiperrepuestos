import { supabase } from './supabaseClient';

/**
 * Caché en memoria + deduplicación de peticiones concurrentes para minimizar
 * el consumo de Egress, Log Ingestion y queries en el Plan Gratuito de Supabase.
 */

const cacheStore = new Map();
const inFlightStore = new Map();

export const PRODUCTOS_LIST_COLUMNS =
  'id, codigo_corto, referencia, descripcion, linea, sublinea, marca, marca_producto, modelo_vehiculo, unidad, medidas, imagen_url, costo_usd, precio_detal_usd, aplica_iva, stock, ubicacion_fisica, updated_at';

export const GUIAS_HISTORIAL_COLUMNS =
  '*, items:items_guia(id, cantidad, descripcion, precio_unitario_usd)';

const CATALOGO_CACHE_KEY = 'catalogo:productos';
const CORRELATIVO_CACHE_KEY = 'correlativo:siguiente';
const HISTORIAL_CACHE_KEY = 'historial:guias';
const CXC_CACHE_KEY = 'cxc:lista';

const DEFAULT_CATALOGO_LIMIT = 1000;
const CATALOGO_TTL_MS = 10 * 60 * 1000;
const CORRELATIVO_TTL_MS = 3 * 60 * 1000;
const SESSION_CACHE_PREFIX = 'hr_sb_cache_v1:';
const SESSION_PERSISTED_KEYS = new Set([CATALOGO_CACHE_KEY, CORRELATIVO_CACHE_KEY]);

function readSessionEntry(key) {
  if (!SESSION_PERSISTED_KEYS.has(key) || typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionEntry(key, entry) {
  if (!SESSION_PERSISTED_KEYS.has(key) || typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  try {
    const serialized = JSON.stringify(entry);
    if (serialized.length < 3_000_000) {
      window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${key}`, serialized);
    }
  } catch {
    // Cuota de sessionStorage llena o bloqueada: se mantiene solo en memoria RAM
  }
}

function removeSessionEntries(prefixOrKey) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const storageKey = window.sessionStorage.key(i);
      if (!storageKey || !storageKey.startsWith(SESSION_CACHE_PREFIX)) continue;
      const cacheKey = storageKey.slice(SESSION_CACHE_PREFIX.length);
      if (!prefixOrKey || cacheKey === prefixOrKey || cacheKey.startsWith(prefixOrKey)) {
        keysToRemove.push(storageKey);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Ignorar en entornos restringidos
  }
}

export async function fetchWithCache(key, fetcher, { ttlMs = 5 * 60 * 1000, force = false } = {}) {
  const now = Date.now();
  if (!force) {
    const cached = cacheStore.get(key);
    if (cached && now - cached.timestamp < ttlMs) {
      return cached.data;
    }
    const persisted = readSessionEntry(key);
    if (persisted && now - persisted.timestamp < ttlMs) {
      cacheStore.set(key, persisted);
      return persisted.data;
    }
  }

  if (inFlightStore.has(key)) {
    return inFlightStore.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      const entry = { data, timestamp: Date.now() };
      cacheStore.set(key, entry);
      writeSessionEntry(key, entry);
      return data;
    } finally {
      inFlightStore.delete(key);
    }
  })();

  inFlightStore.set(key, promise);
  return promise;
}

export function invalidateCache(prefixOrKey) {
  if (!prefixOrKey) {
    cacheStore.clear();
    removeSessionEntries(null);
    return;
  }
  for (const k of cacheStore.keys()) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) {
      cacheStore.delete(k);
    }
  }
  removeSessionEntries(prefixOrKey);
}

export function getCachedCatalogoSync() {
  const now = Date.now();
  const entry = cacheStore.get(CATALOGO_CACHE_KEY);
  if (entry && now - entry.timestamp < CATALOGO_TTL_MS) {
    return entry.data || null;
  }
  const persisted = readSessionEntry(CATALOGO_CACHE_KEY);
  if (persisted && now - persisted.timestamp < CATALOGO_TTL_MS) {
    cacheStore.set(CATALOGO_CACHE_KEY, persisted);
    return persisted.data || null;
  }
  return entry?.data || null;
}

/**
 * Carga única compartida del catálogo de repuestos entre POS, Inventario y Recepción.
 * Evita descargas repetidas al cambiar de pestaña y permite búsqueda instantánea local.
 */
export async function getCatalogoCached({ force = false } = {}) {
  return fetchWithCache(
    CATALOGO_CACHE_KEY,
    async () => {
      const { data, error } = await supabase
        .from('productos')
        .select(PRODUCTOS_LIST_COLUMNS)
        .order('stock', { ascending: false })
        .order('descripcion', { ascending: true })
        .limit(DEFAULT_CATALOGO_LIMIT);

      if (error) throw error;
      const items = data || [];
      return {
        items,
        isTruncated: items.length >= DEFAULT_CATALOGO_LIMIT,
      };
    },
    { ttlMs: CATALOGO_TTL_MS, force }
  );
}

export function invalidateCatalogoCache() {
  invalidateCache(CATALOGO_CACHE_KEY);
}

/**
 * Próximo correlativo cacheado para no escanear guias_despacho en cada cambio de vista.
 */
export async function getCorrelativoCached({ force = false } = {}) {
  return fetchWithCache(
    CORRELATIVO_CACHE_KEY,
    async () => {
      const { data, error } = await supabase
        .from('guias_despacho')
        .select('numero_guia')
        .order('numero_guia', { ascending: true })
        .limit(1000);

      if (error) throw error;
      if (!data || data.length === 0) return 1;

      const numeros = data.map((d) => d.numero_guia).filter((n) => typeof n === 'number' && n > 0);
      if (numeros.length === 0) return 1;

      const setNumeros = new Set(numeros);
      let candidato = 1;
      while (setNumeros.has(candidato)) {
        candidato++;
      }
      return candidato;
    },
    { ttlMs: CORRELATIVO_TTL_MS, force }
  );
}

export function invalidateCorrelativoCache() {
  invalidateCache(CORRELATIVO_CACHE_KEY);
}

/**
 * Historial reciente acotado por defecto (100 registros) para ahorrar Egress en Plan Gratis.
 */
export async function getHistorialCached({ force = false, limit = 100 } = {}) {
  const key = `${HISTORIAL_CACHE_KEY}:${limit}`;
  return fetchWithCache(
    key,
    async () => {
      const { data, error } = await supabase
        .from('guias_despacho')
        .select(GUIAS_HISTORIAL_COLUMNS)
        .order('fecha', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    { ttlMs: CORRELATIVO_TTL_MS, force }
  );
}

export function invalidateHistorialCache() {
  invalidateCache(HISTORIAL_CACHE_KEY);
}

/**
 * Cuentas por cobrar acotadas y cacheadas.
 */
export async function getCuentasCobrarCached({ force = false } = {}) {
  return fetchWithCache(
    CXC_CACHE_KEY,
    async () => {
      const [cxcRes, ventasRes] = await Promise.all([
        supabase
          .from('cuentas_cobrar')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('ventas')
          .select(
            'id, numero_control, cliente_nombre, cliente_cedula_rif, cliente_telefono, total_usd, estado, created_at, metodo_pago'
          )
          .or('metodo_pago.ilike.%Crédito%,metodo_pago.ilike.%credito%')
          .order('created_at', { ascending: false })
          .limit(150),
      ]);

      const cxcData = cxcRes.data || [];
      const ventasCredito = ventasRes.data || [];
      const ventasPorId = new Map(ventasCredito.map((v) => [v.id, v]));

      const listaFinal = cxcData.map((c) => {
        const ventaRel = c.venta_id ? ventasPorId.get(c.venta_id) : null;
        return {
          ...c,
          cliente_nombre: c.cliente_nombre || ventaRel?.cliente_nombre || 'Cliente registrado',
          cliente_cedula_rif: c.cliente_cedula_rif || ventaRel?.cliente_cedula_rif || '—',
          cliente_telefono: c.cliente_telefono || ventaRel?.cliente_telefono || '',
          fecha_emision: c.fecha_emision || ventaRel?.created_at || c.created_at,
        };
      });

      ventasCredito.forEach((v) => {
        if (!listaFinal.some((c) => c.venta_id === v.id || c.guia_id === v.id)) {
          listaFinal.push({
            id: `v_${v.id}`,
            venta_id: v.id,
            cliente_nombre: v.cliente_nombre,
            cliente_cedula_rif: v.cliente_cedula_rif,
            cliente_telefono: v.cliente_telefono,
            monto_total_usd: v.total_usd,
            monto_abonado_usd: 0,
            saldo_pendiente_usd: v.total_usd,
            estado: v.estado === 'pagada' ? 'pagado' : 'pendiente',
            fecha_emision: v.created_at,
            notas: `Venta Nº ${v.numero_control || 'S/N'}`,
          });
        }
      });

      return listaFinal;
    },
    { ttlMs: CORRELATIVO_TTL_MS, force }
  );
}

export function invalidateCuentasCobrarCache() {
  invalidateCache(CXC_CACHE_KEY);
}

/**
 * Búsqueda de clientes cacheada en sesión para evitar queries repetidas al tipear.
 */
const CLIENTE_COLUMNS = 'id, cedula_rif, nombre, telefono, direccion';

export async function buscarClientesCached(tipo, valor, { variantesCedula = [] } = {}) {
  const normVal = String(valor || '').trim().toLowerCase();
  const key = `cliente:${tipo}:${normVal}`;

  return fetchWithCache(
    key,
    async () => {
      if (tipo === 'doc') {
        const soloDigitos = normVal.replace(/\D/g, '');
        if (variantesCedula.length > 0) {
          const orVariantes = variantesCedula.map((v) => `cedula_rif.eq.${v}`).join(',');
          const { data: exacto } = await supabase
            .from('clientes')
            .select(CLIENTE_COLUMNS)
            .or(orVariantes)
            .limit(1)
            .maybeSingle();

          if (exacto && exacto.nombre) {
            return { exacto, matches: [] };
          }
        }

        const { data: sugeridos } = await supabase
          .from('clientes')
          .select(CLIENTE_COLUMNS)
          .ilike('cedula_rif', `%${soloDigitos}%`)
          .limit(6);

        let matches = sugeridos ? [...sugeridos] : [];
        if (matches.length === 0 && soloDigitos.length >= 5) {
          const { data: guias } = await supabase
            .from('guias_despacho')
            .select('cliente_documento, cliente_nombre, cliente_telefono, cliente_direccion')
            .ilike('cliente_documento', `%${soloDigitos}%`)
            .order('created_at', { ascending: false })
            .limit(4);

          if (guias) {
            const existentes = new Set();
            guias.forEach((g) => {
              const gDig = (g.cliente_documento || '').replace(/\D/g, '');
              if (gDig && !existentes.has(gDig) && g.cliente_nombre) {
                existentes.add(gDig);
                matches.push({
                  id: null,
                  cedula_rif: g.cliente_documento,
                  nombre: g.cliente_nombre,
                  telefono: g.cliente_telefono || '',
                  direccion: g.cliente_direccion || '',
                });
              }
            });
          }
        }
        return { exacto: null, matches };
      }

      // Búsqueda por nombre
      const { data: sugeridos } = await supabase
        .from('clientes')
        .select(CLIENTE_COLUMNS)
        .ilike('nombre', `%${valor.trim()}%`)
        .limit(6);

      let matches = sugeridos ? [...sugeridos] : [];
      if (matches.length === 0 && valor.trim().length >= 3) {
        const { data: guias } = await supabase
          .from('guias_despacho')
          .select('cliente_documento, cliente_nombre, cliente_telefono, cliente_direccion')
          .ilike('cliente_nombre', `%${valor.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(4);

        if (guias) {
          const existentes = new Set();
          guias.forEach((g) => {
            const gDig = (g.cliente_documento || '').replace(/\D/g, '');
            if (gDig && !existentes.has(gDig) && g.cliente_nombre) {
              existentes.add(gDig);
              matches.push({
                id: null,
                cedula_rif: g.cliente_documento,
                nombre: g.cliente_nombre,
                telefono: g.cliente_telefono || '',
                direccion: g.cliente_direccion || '',
              });
            }
          });
        }
      }
      return { exacto: null, matches };
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export function invalidateClientesCache() {
  invalidateCache('cliente:');
}

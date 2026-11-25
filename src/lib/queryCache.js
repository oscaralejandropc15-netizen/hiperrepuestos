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

export async function fetchWithCache(key, fetcher, { ttlMs = 5 * 60 * 1000, force = false } = {}) {
  const now = Date.now();
  if (!force) {
    const cached = cacheStore.get(key);
    if (cached && now - cached.timestamp < ttlMs) {
      return cached.data;
    }
  }

  if (inFlightStore.has(key)) {
    return inFlightStore.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cacheStore.set(key, { data, timestamp: Date.now() });
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
    return;
  }
  for (const k of cacheStore.keys()) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) {
      cacheStore.delete(k);
    }
  }
}

export function getCachedCatalogoSync() {
  const entry = cacheStore.get(CATALOGO_CACHE_KEY);
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
    { ttlMs: 10 * 60 * 1000, force }
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
    { ttlMs: 3 * 60 * 1000, force }
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
    { ttlMs: 3 * 60 * 1000, force }
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
    { ttlMs: 3 * 60 * 1000, force }
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

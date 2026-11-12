// =========================================================================
// CATÁLOGO DE CLASIFICACIÓN JERÁRQUICA TIPO AUTOZONE / PORTAL B2B
// Permite filtrado en cascada: Línea -> Sublínea -> Marca -> Vehículo
// =========================================================================

export const LINEAS_CATALOGO = [
  'Tren Delantero y Dirección',
  'Suspensión',
  'Motor',
  'Frenos',
  'Eléctrico y Encendido',
  'Tracción y Transmisión',
  'Refrigeración',
  'Carrocería',
  'Accesorios',
  'General'
];

export const SUBLINEAS_POR_LINEA = {
  'Tren Delantero y Dirección': [
    'Muñones',
    'Terminales de Dirección',
    'Rótulas Axiales',
    'Brazos de Dirección',
    'Brazos Pitman',
    'Brazos Locos',
    'Bujes de Meseta',
    'Barras Estabilizadoras',
    'Gomas de Dirección',
    'Mesetas Delanteras'
  ],
  'Suspensión': [
    'Amortiguadores Delanteros',
    'Amortiguadores Traseros',
    'Amortiguadores de Dirección',
    'Amortiguadores',
    'Bases de Amortiguador',
    'Espirales',
    'Componentes de Suspensión',
    'Ballestas y Hojas',
    'Bujes de Ballesta',
    'Topes y Guardapolvos Amortiguador'
  ],
  'Motor': [
    'Pistones y Anillos',
    'Gomas de Válvulas',
    'Componentes de Motor',
    'Bases de Motor',
    'Bujías de Encendido',
    'Filtros de Aceite',
    'Filtros de Aire',
    'Filtros de Combustible',
    'Bombas de Gasolina / Pilas',
    'Bombas de Aceite',
    'Correas Únicas / Micro-V',
    'Correas de Tiempo / Distribución',
    'Tensores y Poleas',
    'Empacaduras y Empaques',
    'Válvulas y Taquetes',
    'Inyectores'
  ],
  'Frenos': [
    'Pastillas de Freno Delanteras',
    'Pastillas de Freno Traseras',
    'Discos de Freno',
    'Tambores de Freno',
    'Bandas / Zapatas de Freno',
    'Bombas de Freno / Cilindro Maestro',
    'Cilindros de Rueda',
    'Calipers / Mordazas',
    'Líquidos de Freno DOT3 / DOT4'
  ],
  'Refrigeración': [
    'Bombas de Agua',
    'Termostatos',
    'Radiadores',
    'Mangueras de Radiador',
    'Depósitos de Refrigerante',
    'Tapas de Radiador',
    'Refrigerantes / Coolant',
    'Electroventiladores'
  ],
  'Tracción y Transmisión': [
    'Puntas de Tripoide',
    'Mozos y Cubos de Rueda',
    'Bases de Caja',
    'Kit de Embrague (Plato, Disco y Collarín)',
    'Discos de Embrague',
    'Platos de Presión',
    'Collarines de Embrague',
    'Trípodes y Tricetas',
    'Copas de Caja',
    'Valvulinas y Aceites de Caja'
  ],
  'Eléctrico y Encendido': [
    'Bobinas de Encendido',
    'Alternadores',
    'Sensores y Válvulas Eléctricas',
    'Motores de Arranque',
    'Bujías de Encendido',
    'Baterías',
    'Faros y Bombillos',
    'Cables de Bujía'
  ],
  'Carrocería': [
    'Manillas de Puerta',
    'Cerraduras y Cilindros',
    'Retrovisores',
    'Paragolpes / Bumpers',
    'Rejillas y Emblemas'
  ],
  'Accesorios': [
    'Aditivos para Gasolina y Aceite',
    'Limpiaparabrisas',
    'Herramientas y Accesorios de Tienda'
  ],
  'General': [
    'Repuestos Varios',
    'General'
  ]
};

/**
 * Limpia prefijos numéricos obsoletos tipo "0289-BASE MOTOR" -> "Base Motor"
 */
export function limpiarNombreSublinea(nombre = '') {
  if (!nombre) return '';
  return nombre.replace(/^\d+[-_ ]*/, '').trim();
}

/**
 * Obtiene la línea automática correspondiente para una sublínea (insensible a acentos)
 */
export function obtenerLineaParaSublinea(sublinea = '') {
  if (!sublinea) return '';
  const subNorm = String(sublinea).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  for (const [linea, subs] of Object.entries(SUBLINEAS_POR_LINEA)) {
    if (subs.some(s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === subNorm)) {
      return linea;
    }
  }
  return '';
}

/**
 * Obtiene la lista de sublíneas aplicables según la línea seleccionada.
 * Si se especifica una línea, devuelve solo las sublíneas de esa línea.
 * Si no se especifica línea, devuelve todas las sublíneas deduplicadas.
 * Además, incluye cualquier sublínea personalizada o existente en los productos.
 */
export function obtenerSublineasParaLinea(lineaSeleccionada = '', productos = [], customSublineas = []) {
  let resultado = [];

  const normalizarLinea = (l) => {
    const clean = (l || '').toLowerCase().trim();
    if (clean === 'tren delantero') return 'tren delantero y dirección';
    if (clean === 'eléctrico' || clean === 'electrico') return 'eléctrico y encendido';
    if (clean === 'transmisión' || clean === 'transmision') return 'tracción y transmisión';
    return clean;
  };
  const lineaNorm = normalizarLinea(lineaSeleccionada);

  // 1. Obtener de SUBLINEAS_POR_LINEA
  if (lineaNorm) {
    const matchKey = Object.keys(SUBLINEAS_POR_LINEA).find(k => normalizarLinea(k) === lineaNorm);
    if (matchKey && SUBLINEAS_POR_LINEA[matchKey]) {
      resultado = [...SUBLINEAS_POR_LINEA[matchKey]];
    }
  } else {
    // Si no hay línea, recopilar todas
    const all = [];
    Object.values(SUBLINEAS_POR_LINEA).forEach(list => {
      all.push(...list);
    });
    resultado = all;
  }

  // 2. Incorporar sublíneas existentes reales en la BD
  productos.forEach(p => {
    const pLineaNorm = normalizarLinea(p.linea);
    if (!lineaNorm || pLineaNorm === lineaNorm || pLineaNorm.includes(lineaNorm) || lineaNorm.includes(pLineaNorm)) {
      if (p.sublinea && p.sublinea !== 'General' && p.sublinea.trim()) {
        const val = limpiarNombreSublinea(p.sublinea.trim());
        if (val && !resultado.some(item => item.toLowerCase() === val.toLowerCase())) {
          resultado.push(val);
        }
      }
    }
  });

  // 3. Incorporar sublíneas personalizadas añadidas por el usuario
  customSublineas.forEach(cs => {
    let raw = '';
    let csLinea = '';
    if (typeof cs === 'string' && cs.trim()) {
      raw = cs.trim();
    } else if (cs && typeof cs === 'object' && cs.nombre) {
      raw = (cs.nombre || '').trim();
      csLinea = (cs.linea || '').trim();
    }

    const val = limpiarNombreSublinea(raw);
    if (val && (!lineaNorm || !csLinea || normalizarLinea(csLinea) === lineaNorm)) {
      if (!resultado.some(item => item.toLowerCase() === val.toLowerCase())) {
        resultado.push(val);
      }
    }
  });

  // Limpiar cualquier residuo de prefijo numérico "0286-" etc.
  const limpias = resultado.map(s => limpiarNombreSublinea(s)).filter(Boolean);

  // Ordenar alfabéticamente sin duplicados
  return Array.from(new Set(limpias)).sort((a, b) => a.localeCompare(b));
}

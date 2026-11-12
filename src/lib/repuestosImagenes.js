// =========================================================================
// GESTOR DE FOTOS E IMÁGENES DE REFERENCIA DE REPUESTOS TIPO AUTOZONE
// Mapea repuestos a fotos reales de catálogo para punto de venta y catálogo
// =========================================================================

export const FOTOS_CATALOGO = {
  pastillas_freno: '/repuestos/pastillas_freno.jpg',
  amortiguador: '/repuestos/amortiguador.jpg',
  bujia: '/repuestos/bujia.jpg',
  filtro_aceite: '/repuestos/filtro_aceite.jpg',
  bomba_agua: '/repuestos/bomba_agua.jpg',
  munon_rotula: '/repuestos/munon_rotula.jpg',
  bomba_gasolina: '/repuestos/bomba_gasolina.jpg',
  kit_embrague: '/repuestos/kit_embrague.jpg',
  aceite_motor: '/repuestos/aceite_motor.jpg'
};

/**
 * Determina la mejor foto de referencia para un repuesto.
 * Si el producto tiene 'imagen_url' personalizada en la BD, la prioriza.
 * De lo contrario, analiza la sublínea, descripción, código y línea para
 * asignar la foto de referencia automotriz exacta tipo AutoZone.
 */
export function obtenerFotoRepuesto(producto) {
  if (!producto) return null;

  // 1. Si el usuario especificó explícitamente "sin foto"
  if (producto.imagen_url === 'none' || producto.imagen_url === 'sin_foto') {
    return null;
  }

  // 2. Si tiene URL o imagen personalizada (HTTP, Base64 data:, Blob o ruta local /)
  if (producto.imagen_url && typeof producto.imagen_url === 'string') {
    const trimmed = producto.imagen_url.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
  }

  // 2. Análisis por palabras clave
  const texto = `${producto.codigo_corto || ''} ${producto.sublinea || ''} ${producto.descripcion || ''} ${producto.linea || ''}`.toLowerCase();

  // Pastillas y frenos
  if (texto.includes('pastilla') || texto.includes('freno') || texto.includes('disco') || texto.includes('caliper')) {
    return FOTOS_CATALOGO.pastillas_freno;
  }

  // Amortiguadores y suspensión
  if (texto.includes('amortiguador') || texto.includes('espiral') || texto.includes('ballesta') || texto.includes('suspensi')) {
    return FOTOS_CATALOGO.amortiguador;
  }

  // Bujías y encendido
  if (texto.includes('bujia') || texto.includes('bujía') || texto.includes('spark') || texto.includes('ngk') || texto.includes('bkr6e')) {
    return FOTOS_CATALOGO.bujia;
  }

  // Filtros de aceite
  if (texto.includes('filtro') && (texto.includes('aceite') || texto.includes('blindado') || texto.includes('bosch'))) {
    return FOTOS_CATALOGO.filtro_aceite;
  }

  // Bomba de agua
  if (texto.includes('bomba de agua') || (texto.includes('bomba') && (texto.includes('agua') || texto.includes('ats-cor')))) {
    return FOTOS_CATALOGO.bomba_agua;
  }

  // Bomba de gasolina / Pila eléctrica
  if (texto.includes('gasolina') || texto.includes('pila') || texto.includes('combustible')) {
    return FOTOS_CATALOGO.bomba_gasolina;
  }

  // Muñón, rótula, terminal de dirección, bujes, brazos
  if (
    texto.includes('muñon') || 
    texto.includes('muñón') || 
    texto.includes('terminal') || 
    texto.includes('rotula') || 
    texto.includes('rótula') || 
    texto.includes('brazo') || 
    texto.includes('barra') || 
    texto.includes('buje') || 
    texto.includes('goma') ||
    texto.includes('tren delantero')
  ) {
    return FOTOS_CATALOGO.munon_rotula;
  }

  // Kit de embrague, clutch
  if (texto.includes('embrague') || texto.includes('clutch') || texto.includes('plato') || texto.includes('collarin') || texto.includes('collarín')) {
    return FOTOS_CATALOGO.kit_embrague;
  }

  // Aceite de motor y lubricantes
  if (texto.includes('aceite') || texto.includes('lubricante') || texto.includes('20w-50') || texto.includes('15w-40') || texto.includes('mineral') || texto.includes('galon') || texto.includes('galón')) {
    return FOTOS_CATALOGO.aceite_motor;
  }

  // Correas
  if (texto.includes('correa') || texto.includes('micro-v') || texto.includes('5pk') || texto.includes('gates')) {
    return FOTOS_CATALOGO.kit_embrague;
  }

  // Fallbacks por línea principal
  if (producto.linea === 'Frenos') return FOTOS_CATALOGO.pastillas_freno;
  if (producto.linea === 'Suspensión') return FOTOS_CATALOGO.amortiguador;
  if (producto.linea === 'Tren Delantero y Dirección' || producto.linea === 'Tren Delantero') return FOTOS_CATALOGO.munon_rotula;
  if (producto.linea === 'Motor') return FOTOS_CATALOGO.bujia;
  if (producto.linea === 'Refrigeración') return FOTOS_CATALOGO.bomba_agua;
  if (producto.linea === 'Tracción y Transmisión' || producto.linea === 'Transmisión') return FOTOS_CATALOGO.kit_embrague;

  return null;
}

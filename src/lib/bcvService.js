/**
 * Servicio para consultar la Tasa Oficial del BCV en tiempo real
 * Utiliza la API pública de DolarApi con respaldo en localStorage
 */
const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const STORAGE_KEY = 'familycar_bcv_rate';

export async function fetchTasaBCV() {
  try {
    const response = await fetch(BCV_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout después de 6 segundos si no responde
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Error en API BCV: ${response.statusText}`);
    }

    const data = await response.json();
    const rate = parseFloat(data.promedio);

    if (rate && !isNaN(rate)) {
      const payload = {
        rate: rate.toFixed(4),
        fechaActualizacion: data.fechaActualizacion || new Date().toISOString(),
        timestamp: Date.now(),
        origen: 'BCV Oficial (En vivo)',
      };
      // Guardar en caché local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }

    throw new Error('Formato de tasa inválido devuelto por la API');
  } catch (error) {
    console.warn('No se pudo obtener la tasa en tiempo real, buscando en caché local...', error);
    
    // Intentar recuperar de caché local
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          origen: 'Caché (Sin conexión)',
        };
      } catch (e) {
        // Ignorar error de parsing
      }
    }

    // Si no hay caché previa, devolver un fallback seguro
    return {
      rate: '54.50',
      fechaActualizacion: new Date().toISOString(),
      timestamp: Date.now(),
      origen: 'Predeterminado (Manual)',
      isFallback: true,
    };
  }
}

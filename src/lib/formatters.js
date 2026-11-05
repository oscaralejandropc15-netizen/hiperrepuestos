/**
 * Formateo de cantidades monetarias en Dólares Americanos (USD)
 */
export function formatUSD(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formateo de cantidades monetarias en Bolívares (VES)
 */
export function formatVES(amount) {
  const num = Number(amount) || 0;
  return 'Bs. ' + new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parser matemático seguro para números en formato venezolano
 * Maneja puntos de miles (ej: "6.857,89" o "1.000.000") y coma decimal (",")
 */
export function parseVenezuelanNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // Si contiene coma, la coma es el separador decimal y los puntos son de miles
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }

  // Si no contiene comas pero tiene puntos
  if (str.includes('.')) {
    const parts = str.split('.');
    // Si tiene 1 o 2 decimales y un solo punto (ej: tasa BCV 894.8876 o 6857.89 antes de formatear)
    if (parts.length === 2 && parts[1].length !== 3) {
      return parseFloat(str) || 0;
    }
    // Es separador de miles sin decimales (ej: 6.857 o 27.431 o 1.000.000)
    return parseFloat(str.replace(/\./g, '')) || 0;
  }

  return parseFloat(str) || 0;
}

/**
 * Normaliza y formatea un valor numérico agregando puntos de miles automáticamente
 * Ejemplo: "6857" -> "6.857", "6857,89" -> "6.857,89", "6857,8" -> "6.857,8"
 */
export function formatMilesVES(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Si el usuario escribe o pega con coma decimal
  if (str.includes(',')) {
    const parts = str.split(',');
    const intDigits = parts[0].replace(/\D/g, '');
    const decDigits = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2);

    const formattedInt = intDigits 
      ? new Intl.NumberFormat('de-DE').format(Number(intDigits)) 
      : '0';

    return `${formattedInt},${decDigits}`;
  }

  // Si no tiene coma decimal, formatear parte entera con separador de miles
  const intDigits = str.replace(/\D/g, '');
  if (!intDigits) return '';
  return new Intl.NumberFormat('de-DE').format(Number(intDigits));
}

/**
 * Formateador de números con estándar oficial de Venezuela (coma decimal y punto para miles)
 */
export function formatNumber(num, decimals = 2) {
  const n = parseVenezuelanNumber(num);
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/**
 * Formateo de fecha y hora local
 */
export function formatDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Cálculos matemáticos de facturación con IVA del 16%
 * Soporta ingreso tanto en Bolívares (VES) como en Dólares (USD) con puntos de miles y comas
 */
export function calculateTotals(items = [], tasaBCV = 1, monedaIngreso = 'USD') {
  const rateClean = parseVenezuelanNumber(tasaBCV);
  const rate = rateClean > 0 ? rateClean : 1;

  let baseImponibleUSD = 0;
  let baseImponibleBs = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.cantidad) || 0;
    let priceUSD = 0;
    let priceBs = 0;

    if (monedaIngreso === 'VES') {
      // Priorizar precio en Bolívares introducido directamente (soporta puntos de miles y coma)
      if (item.precio_bs !== undefined && item.precio_bs !== '') {
        priceBs = parseVenezuelanNumber(item.precio_bs);
        priceUSD = rate > 0 ? priceBs / rate : 0;
      } else {
        priceUSD = parseVenezuelanNumber(item.precio);
        priceBs = priceUSD * rate;
      }
    } else {
      // Priorizar precio en Dólares ($)
      priceUSD = parseVenezuelanNumber(item.precio);
      priceBs = priceUSD * rate;
    }

    baseImponibleUSD += qty * priceUSD;
    baseImponibleBs += qty * priceBs;
  });

  const ivaUSD = baseImponibleUSD * 0.16;
  const ivaBs = baseImponibleBs * 0.16;

  const totalUSD = baseImponibleUSD + ivaUSD;
  const totalBs = baseImponibleBs + ivaBs;

  return {
    baseImponible: Math.round(baseImponibleUSD * 100) / 100,
    baseImponibleBs: Math.round(baseImponibleBs * 100) / 100,
    iva: Math.round(ivaUSD * 100) / 100,
    ivaBs: Math.round(ivaBs * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
    totalBs: Math.round(totalBs * 100) / 100,
  };
}

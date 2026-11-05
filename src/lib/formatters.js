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
 * Formateador de números decimales simples
 */
export function formatNumber(num, decimals = 2) {
  return Number(num || 0).toFixed(decimals);
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
 * Soporta ingreso tanto en Bolívares (VES) como en Dólares (USD)
 */
export function calculateTotals(items = [], tasaBCV = 1, monedaIngreso = 'USD') {
  const rate = parseFloat(tasaBCV) || 1;

  let baseImponibleUSD = 0;
  let baseImponibleBs = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.cantidad) || 0;
    let priceUSD = 0;
    let priceBs = 0;

    if (monedaIngreso === 'VES') {
      // Priorizar precio en Bolívares introducido directamente
      if (item.precio_bs !== undefined && item.precio_bs !== '') {
        priceBs = parseFloat(item.precio_bs) || 0;
        priceUSD = rate > 0 ? priceBs / rate : 0;
      } else {
        priceUSD = parseFloat(item.precio) || 0;
        priceBs = priceUSD * rate;
      }
    } else {
      // Priorizar precio en Dólares ($)
      priceUSD = parseFloat(item.precio) || 0;
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

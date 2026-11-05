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
 */
export function calculateTotals(items = [], tasaBCV = 1) {
  // Base Imponible: suma de (cantidad * precio_unitario)
  const baseImponible = items.reduce((acc, item) => {
    const qty = parseFloat(item.cantidad) || 0;
    const price = parseFloat(item.precio) || 0;
    return acc + (qty * price);
  }, 0);

  // IVA 16%
  const iva = baseImponible * 0.16;

  // Total USD
  const totalUSD = baseImponible + iva;

  // Total en Bolívares a tasa BCV
  const rate = parseFloat(tasaBCV) || 0;
  const totalBs = totalUSD * rate;

  return {
    baseImponible: Math.round(baseImponible * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
    totalBs: Math.round(totalBs * 100) / 100,
  };
}

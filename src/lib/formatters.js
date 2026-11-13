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
 * Cálculos matemáticos de cierre de venta:
 * 1. Efectivo: tipo_documento = 'nota_entrega', 0% IVA.
 * 2. Pago Móvil: tipo_documento = 'factura_fiscal', 16% IVA sobre subtotal.
 * 3. Cashea: 12% recargo sobre subtotal (monto_recargo_cashea_usd), 16% IVA sobre nuevo subtotal (subtotal + 12%).
 * 4. Crédito Tienda: tipo_documento = 'nota_entrega', 0% IVA.
 */
export function calculateTotals(items = [], tasaBCV = 1, monedaIngreso = 'USD', formaPago = 'EFECTIVO', tipoDocumento = 'nota_entrega') {
  const rateClean = Math.round((parseVenezuelanNumber(tasaBCV) || 1) * 100) / 100;
  const rate = rateClean > 0 ? rateClean : 1;

  let baseImponibleUSD = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.cantidad) || 0;
    if (qty <= 0) return;

    let priceUSD = 0;

    // Si el item viene de la selección de inventario con precio_divisa o precio_detal_usd
    if (item.precio_divisa !== undefined && item.precio_divisa !== null && item.precio_divisa !== '') {
      priceUSD = parseVenezuelanNumber(item.precio_divisa);
    } else if (monedaIngreso === 'VES') {
      if (item.precio_bs !== undefined && item.precio_bs !== '') {
        const priceBs = parseVenezuelanNumber(item.precio_bs);
        priceUSD = rate > 0 ? priceBs / rate : 0;
      } else {
        priceUSD = parseVenezuelanNumber(item.precio);
      }
    } else {
      priceUSD = parseVenezuelanNumber(item.precio ?? item.precio_detal_usd);
    }

    baseImponibleUSD += qty * priceUSD;
  });

  const subtotalNetoUSD = Math.round(baseImponibleUSD * 100) / 100;
  const subtotalNetoBs = Math.round(subtotalNetoUSD * rate * 100) / 100;

  const esEfectivo = formaPago === 'EFECTIVO';
  const esPagoMovil = formaPago === 'PAGO_MOVIL';
  const esCashea = formaPago === 'CASHEA';
  const esCreditoTienda = formaPago === 'CREDITO_TIENDA' || formaPago === 'CRÉDITO' || formaPago === 'CREDITO';

  // 1. IVA (16%):
  // Si es Efectivo con nota de entrega directa, IVA 0%.
  // Si es Pago Móvil, Cashea, Crédito o Factura Fiscal, 16% IVA sobre la base imponible.
  const tieneIva = !esEfectivo || tipoDocumento === 'factura_fiscal';
  const ivaUSD = tieneIva ? Math.round(subtotalNetoUSD * 0.16 * 100) / 100 : 0;
  const ivaBs = Math.round(ivaUSD * rate * 100) / 100;

  const totalBaseConIvaUSD = Math.round((subtotalNetoUSD + ivaUSD) * 100) / 100;
  const totalBaseConIvaBs = Math.round(totalBaseConIvaUSD * rate * 100) / 100;

  // 2. Recargo Cashea (12%):
  // Se aplica el 12% sobre el precio regular con IVA ($185.60 * 0.12 = $22.27)
  const recargoCasheaUSD = esCashea ? Math.round(totalBaseConIvaUSD * 0.12 * 100) / 100 : 0;
  const recargoCasheaBs = Math.round(recargoCasheaUSD * rate * 100) / 100;

  const totalUSD = Math.round((totalBaseConIvaUSD + recargoCasheaUSD) * 100) / 100;
  const totalBs = Math.round(totalUSD * rate * 100) / 100;

  return {
    subtotalUSD: subtotalNetoUSD,
    subtotalBs: subtotalNetoBs,
    subtotalNetoUSD,
    subtotalNetoBs,
    baseImponible: subtotalNetoUSD,
    baseImponibleBs: subtotalNetoBs,
    totalBaseConIvaUSD,
    totalBaseConIvaBs,
    recargoCashea: recargoCasheaUSD,
    recargoCasheaUSD,
    recargoCasheaBs,
    subtotalConCasheaUSD: totalUSD,
    subtotalConCasheaBs: totalBs,
    iva: ivaUSD,
    ivaUSD,
    ivaBs,
    montoIvaUSD: ivaUSD,
    totalUSD,
    totalBs,
  };
}

/**
 * Genera todas las variantes posibles de formato para una Cédula o RIF en Venezuela
 * Permite encontrar un cliente sin importar si se guardó con o sin puntos, con prefijo V/J/E/G o solo dígitos.
 * Ejemplos: "V-26.946.393", "V-26946393", "26946393", "26.946.393", "J-12345678-9", etc.
 */
export function generarVariantesCedula(doc) {
  if (!doc) return [];
  const raw = String(doc).trim().toUpperCase();
  const sinPuntos = raw.replace(/\./g, '');
  const digits = raw.replace(/\D/g, '');
  const variantes = new Set([raw, sinPuntos]);

  if (digits.length >= 4) {
    variantes.add(digits);
    const withDots = digits.slice(0, 8).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    variantes.add(withDots);
    for (const pref of ['V', 'J', 'E', 'G']) {
      variantes.add(`${pref}-${digits}`);
      variantes.add(`${pref}-${withDots}`);
      variantes.add(`${pref}${digits}`);
    }
  }
  return Array.from(variantes).filter(Boolean);
}


import React from 'react';
import { formatVES, formatUSD, formatNumber, parseVenezuelanNumber } from '../lib/formatters';

export default function GuiaImprimible({
  codigoGuia = 'GD-000001',
  fecha,
  cliente = {},
  items = [],
  tasaBCV = 1,
  totals = { baseImponible: 0, iva: 0, totalUSD: 0, totalBs: 0 },
  observaciones = '',
  condicionPago = 'CONTADO',
  formaPago = 'EFECTIVO',
  tipoDocumento = 'nota_entrega'
}) {
  const d = fecha ? new Date(fecha) : new Date();
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = String(d.getFullYear());

  // Extraer número correlativo (ej. GD-000001 -> 000001)
  const numFactura = (codigoGuia || '').replace(/^GD-/, '') || '000001';
  const nroControl = `00-${numFactura}`;

  // REGLAS ESTRICTAS DE NEGOCIO:
  // 1. Efectivo: tipo_documento = 'nota_entrega', sin IVA, sin formato fiscal SENIAT.
  // 2. Pago Móvil: tipo_documento = 'factura_fiscal', 16% IVA, formato SENIAT.
  // 3. Cashea: tipo_documento = 'factura_fiscal', IVA sobre nuevo subtotal, pero el 12% va SUMADO al precio unitario (oculto en PDF).
  // 4. Crédito Tienda: tipo_documento = 'nota_entrega', sin IVA, cliente registrado, pasa a cuentas_cobrar.
  const esNotaEntrega = tipoDocumento === 'nota_entrega' || formaPago === 'EFECTIVO' || formaPago === 'CREDITO_TIENDA';
  const esCashea = formaPago === 'CASHEA';
  const rateClean = parseVenezuelanNumber(tasaBCV) || 1;

  return (
    <div 
      id="guia-imprimible" 
      className="bg-white text-black p-5 font-sans w-full max-w-[800px] mx-auto border-2 border-slate-900 rounded-lg shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
      style={{ boxSizing: 'border-box', pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* 1. Encabezado Oficial Familycar */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-3">
        {/* Lado Izquierdo: Datos de la Empresa y Logo */}
        <div className="flex items-start gap-3.5 max-w-[480px]">
          <img
            src="/logo.png"
            alt="Logo Familycar"
            className="w-16 h-16 object-contain rounded-full border border-slate-300 flex-shrink-0"
          />
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
              HIPER REPUESTOS FAMILYCAR C.A.
            </h1>
            <p className="text-[11px] text-slate-700 leading-snug pt-1">
              Av. 3, Tosta García Entre Calle 12 y 13, Local Número 12-35, Zona Centro, Charallave, Miranda, Zona Postal 1210.
            </p>
            <div className="text-[11px] text-slate-700 flex flex-wrap gap-x-3 pt-0.5">
              <span><strong>Telfs:</strong> 0412-0189136 - 0412-3738597</span>
              <span><strong>E-mail:</strong> repuestosfamilycar@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: RIF, Lugar, Fecha y Título del Documento */}
        <div className="text-right flex flex-col items-end">
          <p className="text-sm font-black font-mono tracking-tight text-slate-900 mb-1">
            RIF: J412654489
          </p>

          {/* Tabla de Lugar y Fecha */}
          <div className="border border-slate-900 text-[10px] mb-2 text-center bg-slate-50">
            <div className="grid grid-cols-4 border-b border-slate-900 font-bold bg-slate-100">
              <span className="px-2 py-0.5 border-r border-slate-900 col-span-1">Lugar de Emisión</span>
              <span className="px-2 py-0.5 border-r border-slate-900">Día</span>
              <span className="px-2 py-0.5 border-r border-slate-900">Mes</span>
              <span className="px-2 py-0.5">Año</span>
            </div>
            <div className="grid grid-cols-4 font-mono font-bold">
              <span className="px-2 py-0.5 border-r border-slate-900 col-span-1">Charallave</span>
              <span className="px-2 py-0.5 border-r border-slate-900">{dia}</span>
              <span className="px-2 py-0.5 border-r border-slate-900">{mes}</span>
              <span className="px-2 py-0.5">{anio}</span>
            </div>
          </div>

          {/* Tipo de Documento: FACTURA FISCAL vs NOTA DE ENTREGA */}
          <div className="text-right">
            {!esNotaEntrega ? (
              <>
                <p className="text-base font-black tracking-tight text-slate-900">
                  FACTURA Nº <span className="font-mono text-red-600 tracking-wider">{numFactura}</span>
                </p>
                <p className="text-xs font-bold text-slate-700">
                  Nro. de Control <span className="font-mono">{nroControl}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  NOTA DE ENTREGA Nº <span className="font-mono text-red-600 tracking-wider">{numFactura}</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  GUÍA DE DESPACHO INTERNO
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Cajas Tabulares de Datos del Cliente */}
      <div className="border-2 border-slate-900 text-xs mb-3">
        <div className="border-b border-slate-900 py-2.5 px-3 bg-slate-50/50 min-h-[36px] flex items-center">
          <div className="flex items-center gap-2 w-full leading-normal">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">
              Nombre, Apellido o Razón Social:
            </span>
            <span className="font-black text-black uppercase text-sm tracking-wide">
              {cliente.nombre || 'CLIENTE MOSTRADOR'}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-900 py-2.5 px-3 min-h-[36px] flex items-center">
          <div className="flex items-center gap-2 w-full leading-normal">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">
              Domicilio Fiscal / Entrega:
            </span>
            <span className="font-bold text-black uppercase text-xs tracking-wide">
              {cliente.direccion || 'Charallave, Edo. Miranda'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 divide-x divide-slate-900">
          <div className="col-span-4 py-2 px-2.5 flex items-center gap-1.5 min-h-[34px]">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">R.I.F. / C.I.:</span>
            <span className="font-mono font-black text-black text-xs sm:text-sm tracking-wider whitespace-nowrap">
              {cliente.documento || 'V-00000000'}
            </span>
          </div>

          <div className="col-span-3 py-2 px-2.5 flex items-center gap-1.5 min-h-[34px]">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">Telf.:</span>
            <span className="font-bold text-black text-xs truncate">
              {cliente.telefono || 'N/A'}
            </span>
          </div>

          <div className="col-span-5 py-2 px-2.5 flex items-center justify-between text-xs min-h-[34px]">
            <span className="font-bold text-slate-900 text-[11px] whitespace-nowrap flex-shrink-0">
              Condiciones de Pago:
            </span>
            <div className="flex items-center gap-2.5 font-bold text-black text-[11px] flex-shrink-0">
              <label className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={condicionPago === 'CONTADO'} 
                  readOnly 
                  className="rounded border-slate-900 text-slate-900 w-3 h-3" 
                />
                <span>CONTADO</span>
              </label>
              <label className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={condicionPago === 'CRÉDITO' || formaPago === 'CREDITO_TIENDA'} 
                  readOnly 
                  className="rounded border-slate-900 text-slate-900 w-3 h-3" 
                />
                <span>CRÉDITO</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabla de Renglones / Repuestos */}
      <table className="w-full text-left border-collapse border-2 border-slate-900 text-xs mb-3">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-900 font-extrabold uppercase text-slate-900 tracking-wider text-center">
            <th className="py-2 px-2 border-r border-slate-900 w-14">CANT.</th>
            <th className="py-2 px-3 border-r border-slate-900 text-left">D E S C R I P C I Ó N</th>
            <th className="py-2 px-3 border-r border-slate-900 w-32 text-right">PRECIO UNIT.</th>
            <th className="py-2 px-3 w-32 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {items.map((item, idx) => {
            const qty = parseFloat(item.cantidad) || 0;

            let priceUSD = 0;
            if (item.precio_divisa !== undefined && item.precio_divisa !== null && item.precio_divisa !== '') {
              priceUSD = parseVenezuelanNumber(item.precio_divisa);
            } else if (item.precio_bs !== undefined && item.precio_bs !== '') {
              const rawBs = parseVenezuelanNumber(item.precio_bs);
              priceUSD = rateClean > 0 ? rawBs / rateClean : 0;
            } else {
              priceUSD = parseVenezuelanNumber(item.precio ?? item.precio_detal_usd);
            }

            // REGLA CASHEA: El recargo de Cashea del 12% no se muestra desglosado, sino sumado al precio unitario del producto
            const factorCashea = esCashea ? 1.12 : 1.00;
            const unitPriceUSDImpreso = priceUSD * factorCashea;
            const unitPriceBsImpreso = unitPriceUSDImpreso * rateClean;
            const subBsImpreso = qty * unitPriceBsImpreso;

            return (
              <tr key={idx} className="border-b border-slate-300">
                <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono font-bold">{qty}</td>
                <td className="py-2.5 px-3 border-r border-slate-900 uppercase font-medium">
                  {item.codigo_corto ? <strong className="font-mono text-black">[{item.codigo_corto}] </strong> : ''}
                  {item.descripcion || '-'}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono font-bold">
                  {formatVES(unitPriceBsImpreso)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black">
                  {formatVES(subBsImpreso)}
                </td>
              </tr>
            );
          })}

          {/* Renglones vacíos simulados para emular el talonario físico */}
          {items.length < 2 && Array.from({ length: 2 - items.length }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-slate-200 text-slate-200">
              <td className="py-2 border-r border-slate-900 text-center">-</td>
              <td className="py-2 border-r border-slate-900 px-3"></td>
              <td className="py-2 border-r border-slate-900 text-right px-3"></td>
              <td className="py-2 text-right px-3"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Bloque Inferior: Formas de Pago, Recibí Conforme y Totales */}
      <div className="grid grid-cols-12 gap-3 items-stretch text-xs">
        
        {/* Forma de Pago */}
        <div className="col-span-4 border-2 border-slate-900 rounded p-2.5 flex flex-col justify-between">
          <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            MODALIDAD DE PAGO
          </p>
          <div className="grid grid-cols-2 gap-y-2 text-[11px] font-bold">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'EFECTIVO'} readOnly className="rounded" />
              <span>EFECTIVO</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'PAGO_MOVIL'} readOnly className="rounded" />
              <span>P. MÓVIL</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'CASHEA'} readOnly className="rounded" />
              <span>CASHEA</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'CREDITO_TIENDA'} readOnly className="rounded" />
              <span>CRÉDITO</span>
            </label>
          </div>
          {observaciones && (
            <div className="mt-2 pt-1 border-t border-slate-300 text-[10px] text-slate-700">
              <strong>Nota:</strong> {observaciones}
            </div>
          )}
        </div>

        {/* Firma Recibí Conforme */}
        <div className="col-span-3 border-2 border-slate-900 rounded p-2.5 flex flex-col justify-end text-center">
          <div className="border-t border-slate-800 pt-1 text-[11px] font-bold text-slate-800">
            Recibí Conforme
          </div>
          <p className="text-[9px] text-slate-500">Firma y Cédula del Receptor</p>
        </div>

        {/* Desglose de Totales SENIAT o Despacho */}
        <div className="col-span-5 border-2 border-slate-900 rounded p-2.5 space-y-1 bg-slate-50">
          {!esNotaEntrega ? (
            /* FORMATO FISCAL SENIAT (Pago Móvil / Cashea) - SIN DESGLOSAR CASHEA */
            <>
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>Total Exento Bs.:</span>
                <span className="font-mono font-bold">0,00</span>
              </div>

              <div className="flex justify-between text-slate-800 text-[11px]">
                <span className="font-semibold">Base Imponible Bs.:</span>
                <span className="font-mono font-bold text-slate-950">
                  {formatVES(totals.baseImponibleBs ?? (totals.subtotalConCasheaBs || totals.subtotalBs))}
                </span>
              </div>

              <div className="flex justify-between text-slate-800 text-[11px]">
                <span className="font-semibold">I.V.A. (16.00%) Bs.:</span>
                <span className="font-mono font-bold text-slate-950">
                  {formatVES(totals.ivaBs)}
                </span>
              </div>

              <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-slate-950">
                <span className="font-black text-xs sm:text-sm">Monto Total Facturado Bs.:</span>
                <span className="font-mono font-black text-sm sm:text-base text-red-700">
                  {formatVES(totals.totalBs)}
                </span>
              </div>
            </>
          ) : (
            /* FORMATO NOTA DE ENTREGA (Efectivo / Crédito Tienda) - SIN IVA */
            <>
              <div className="flex justify-between text-slate-800 text-[11px]">
                <span className="font-semibold">Subtotal Mercancía Bs.:</span>
                <span className="font-mono font-bold text-slate-950">
                  {formatVES(totals.subtotalBs)}
                </span>
              </div>

              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>I.V.A. (No Sujeto):</span>
                <span className="font-mono font-bold">0,00</span>
              </div>

              <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-slate-950">
                <span className="font-black text-xs sm:text-sm">Total Liquidable Bs.:</span>
                <span className="font-mono font-black text-sm sm:text-base text-emerald-700">
                  {formatVES(totals.totalBs)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 text-[10px] pt-0.5">
                <span>Equivalente Divisa:</span>
                <span className="font-mono font-bold">{formatUSD(totals.totalUSD)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pie de Página: Imprenta SENIAT (solo en Factura Fiscal) o Pie de Despacho (en Nota de Entrega) */}
      <div className="mt-3 pt-2 border-t border-slate-400 text-center text-[9px] text-slate-600">
        {!esNotaEntrega ? (
          <p>
            TIP SANTA TERESA, C.A. RIF: J-30089877-0 · Providencia SENIAT/01/00756 de fecha 05/09/2011 ·
            Factura emitida conforme a las regulaciones del SENIAT.
          </p>
        ) : (
          <p>
            Documento de control interno y despacho de mercancía en mostrador. Válido para garantía con comprobante de recepción.
          </p>
        )}
      </div>
    </div>
  );
}

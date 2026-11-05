import React from 'react';
import { formatVES, formatNumber, parseVenezuelanNumber } from '../lib/formatters';

export default function GuiaImprimible({
  codigoGuia = 'GD-000001',
  fecha,
  cliente = {},
  items = [],
  tasaBCV = 1,
  totals = { baseImponible: 0, iva: 0, totalUSD: 0, totalBs: 0 },
  observaciones = '',
  condicionPago = 'CONTADO',
  formaPago = 'DIVISA'
}) {
  const d = fecha ? new Date(fecha) : new Date();
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = String(d.getFullYear());

  // Extraer número de 6 dígitos del código (ej. GD-000001 -> 000001)
  const numFactura = (codigoGuia || '').replace(/^GD-/, '') || '000001';
  const nroControl = `00-${numFactura}`;

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

        {/* Lado Derecho: RIF, Lugar, Fecha y Números Correlativos */}
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

          {/* Números Correlativos Oficiales */}
          <div className="text-right">
            <p className="text-base font-black tracking-tight text-slate-900">
              FACTURA Nº <span className="font-mono text-red-600 tracking-wider">{numFactura}</span>
            </p>
            <p className="text-xs font-bold text-slate-700">
              Nro. de Control <span className="font-mono">{nroControl}</span>
            </p>
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
              Domicilio Fiscal:
            </span>
            <span className="font-bold text-black uppercase text-xs tracking-wide">
              {cliente.direccion || 'Charallave, Edo. Miranda'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 divide-x divide-slate-900">
          <div className="col-span-4 py-2 px-3 flex items-center gap-2 min-h-[34px]">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">R.I.F. / C.I.:</span>
            <span className="font-mono font-black text-black text-sm tracking-wider">
              {cliente.documento || 'V-00000000'}
            </span>
          </div>

          <div className="col-span-4 py-2 px-3 flex items-center gap-2 min-h-[34px]">
            <span className="font-bold text-slate-900 text-xs whitespace-nowrap flex-shrink-0">Telf.:</span>
            <span className="font-bold text-black text-xs">
              {cliente.telefono || 'N/A'}
            </span>
          </div>

          <div className="col-span-4 py-2 px-3 flex items-center justify-between text-xs min-h-[34px]">
            <span className="font-bold text-slate-900 whitespace-nowrap">Condiciones de Pago:</span>
            <div className="flex items-center gap-3 font-bold text-black">
              <label className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={condicionPago === 'CONTADO'} 
                  readOnly 
                  className="rounded border-slate-900 text-slate-900" 
                />
                <span>CONTADO</span>
              </label>
              <label className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={condicionPago === 'CRÉDITO'} 
                  readOnly 
                  className="rounded border-slate-900 text-slate-900" 
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
            const rateClean = parseVenezuelanNumber(tasaBCV);
            const rate = rateClean > 0 ? rateClean : 1;

            let priceUSD = 0;
            let priceBs = 0;

            if (item.precio_bs !== undefined && item.precio_bs !== '') {
              priceBs = parseVenezuelanNumber(item.precio_bs);
              priceUSD = rate > 0 ? priceBs / rate : 0;
            } else {
              priceUSD = parseVenezuelanNumber(item.precio);
              priceBs = priceUSD * rate;
            }

            const subBs = qty * priceBs;

            return (
              <tr key={idx} className="border-b border-slate-300">
                <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono font-bold">{qty}</td>
                <td className="py-2.5 px-3 border-r border-slate-900 uppercase font-medium">
                  {item.descripcion || '-'}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono font-bold">
                  {formatVES(priceBs)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black">
                  {formatVES(subBs)}
                </td>
              </tr>
            );
          })}

          {/* Renglones vacíos simulados para emular el talonario oficial si hay pocos ítems */}
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

      {/* 4. Bloque Inferior: Formas de Pago, Recibí Conforme y Totales SENIAT (Estrictamente en Bolívares) */}
      <div className="grid grid-cols-12 gap-3 items-stretch text-xs">
        
        {/* Forma de Pago */}
        <div className="col-span-4 border-2 border-slate-900 rounded p-2.5 flex flex-col justify-between">
          <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            FORMA DE PAGO
          </p>
          <div className="grid grid-cols-2 gap-y-2 text-[11px] font-bold">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'EFECTIVO'} readOnly className="rounded" />
              <span>EFECTIVO</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'PUNTO'} readOnly className="rounded" />
              <span>DÉBITO</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'PAGO_MOVIL'} readOnly className="rounded" />
              <span>P. MÓVIL</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'TRANSFERENCIA'} readOnly className="rounded" />
              <span>TRANSF.</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={formaPago === 'BIOPAGO'} readOnly className="rounded" />
              <span>BIOPAGO</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                checked={['DIVISA', 'ZELLE', 'BINANCE'].includes(formaPago)} 
                readOnly 
                className="rounded" 
              />
              <span>DIVISA</span>
            </label>
          </div>
        </div>

        {/* Firma Recibí Conforme */}
        <div className="col-span-3 border-2 border-slate-900 rounded p-2.5 flex flex-col justify-end text-center">
          <div className="border-t border-slate-800 pt-1 text-[11px] font-bold text-slate-800">
            Recibí Conforme
          </div>
          <p className="text-[9px] text-slate-500">Firma y Cédula del Cliente</p>
        </div>

        {/* Desglose de Totales SENIAT (Exacto a la Factura Manual en Bolívares) */}
        <div className="col-span-5 border-2 border-slate-900 rounded p-2.5 space-y-1 bg-slate-50">
          <div className="flex justify-between text-slate-700 text-[11px]">
            <span>Total Exento Bs.:</span>
            <span className="font-mono font-bold">0,00</span>
          </div>

          <div className="flex justify-between text-slate-800 text-[11px]">
            <span className="font-semibold">Base Imponible Bs.:</span>
            <span className="font-mono font-bold text-slate-950">
              {formatVES(totals.baseImponibleBs ?? (totals.baseImponible * (parseVenezuelanNumber(tasaBCV) || 1)))}
            </span>
          </div>

          <div className="flex justify-between text-slate-800 text-[11px]">
            <span className="font-semibold">I.V.A. 16% Sobre Bs.:</span>
            <span className="font-mono font-bold text-slate-950">
              {formatVES(totals.ivaBs ?? (totals.iva * (parseVenezuelanNumber(tasaBCV) || 1)))}
            </span>
          </div>

          <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-slate-950">
            <span className="font-black text-xs sm:text-sm">Monto Total a Pagar Bs.:</span>
            <span className="font-mono font-black text-sm sm:text-base text-red-700">
              {formatVES(totals.totalBs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  RotateCcw, 
  Receipt, 
  User, 
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatUSD, formatVES, formatNumber } from '../lib/formatters';

export default function FacturadorForm({
  cliente,
  setCliente,
  items,
  setItems,
  tasaBCV,
  setTasaBCV,
  bcvInfo,
  onActualizarBCV,
  cargandoBCV,
  observaciones,
  setObservaciones,
  condicionPago = 'CONTADO',
  setCondicionPago,
  formaPago = 'PUNTO',
  setFormaPago,
  monedaIngreso = 'VES',
  setMonedaIngreso,
  proximoCorrelativo = '000475',
  totals,
  onGuardar,
  onImprimir,
  onLimpiar,
  loading,
  error
}) {

  const handleClienteChange = (field, value) => {
    setCliente(prev => ({ ...prev, [field]: value }));
  };

  // Manejador inteligente y ultra-rápido para Cédula o RIF (auto-agrega el guión al escribir V o J)
  const handleDocumentoChange = (raw) => {
    const prev = cliente.documento || '';
    let val = raw.toUpperCase().replace(/\s+/g, '');

    // Si estaba borrando y quedó solo la letra del prefijo (ej: borró el guión de V-), limpiar todo
    if (prev.endsWith('-') && ['V', 'J', 'E', 'G', 'P'].includes(val)) {
      handleClienteChange('documento', '');
      return;
    }

    if (!val) {
      handleClienteChange('documento', '');
      return;
    }

    // 1. Si escribe una letra de prefijo (V, J, E, G, P), pone automáticamente el guión '-'
    if (['V', 'J', 'E', 'G', 'P'].includes(val)) {
      val = `${val}-`;
    } 
    // 2. Si escribe la letra y números pegados (ej: V18456789 o J30123456), agrega el guión
    else if (/^[VJEGP]\d/.test(val)) {
      val = `${val[0]}-${val.slice(1)}`;
    } 
    // 3. Si escribe directamente números sin prefijo (ej: 18456789), asume V- por defecto
    else if (/^\d/.test(val)) {
      val = `V-${val}`;
    }

    handleClienteChange('documento', val);
  };

  // Selector rápido para cambiar entre V, J, E o G con un solo clic conservando los números
  const seleccionarPrefijo = (prefijo) => {
    const numPart = (cliente.documento || '').replace(/^[^0-9]*/, '');
    handleClienteChange('documento', `${prefijo}-${numPart}`);
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Manejador de precios reactivo según la moneda activa (Bs. o $)
  const handlePrecioChange = (index, value) => {
    const rate = parseFloat(tasaBCV) || 1;
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      if (monedaIngreso === 'VES') {
        item.precio_bs = value;
        item.precio = value && rate > 0 ? (parseFloat(value) / rate).toFixed(4) : '';
      } else {
        item.precio = value;
        item.precio_bs = value && rate > 0 ? (parseFloat(value) * rate).toFixed(2) : '';
      }
      next[index] = item;
      return next;
    });
  };

  // Cambiar forma de pago y auto-sincronizar la moneda de cobro
  const seleccionarFormaPago = (fId, monedaDefault) => {
    if (setFormaPago) setFormaPago(fId);
    if (setMonedaIngreso && monedaDefault) setMonedaIngreso(monedaDefault);
  };

  const agregarItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), cantidad: 1, descripcion: '', precio: '' }
    ]);
  };

  const eliminarItem = (index) => {
    if (items.length === 1) {
      setItems([{ id: Date.now(), cantidad: 1, descripcion: '', precio: '' }]);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const ajustarCantidad = (index, delta) => {
    const actual = parseInt(items[index].cantidad) || 0;
    const nueva = Math.max(1, actual + delta);
    handleItemChange(index, 'cantidad', nueva);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' && index === items.length - 1) {
      e.preventDefault();
      agregarItem();
    }
  };

  // Validación estricta para activar el botón de emitir factura
  const tieneItemsValidos = items.some(it => {
    const hasDesc = it.descripcion && it.descripcion.trim().length > 0;
    const hasQty = parseFloat(it.cantidad) > 0;
    const hasPrice = monedaIngreso === 'VES' 
      ? parseFloat(it.precio_bs) > 0 
      : parseFloat(it.precio) > 0;
    return hasDesc && hasQty && hasPrice;
  });

  const formularioValido = Boolean(
    cliente.nombre?.trim() &&
    cliente.documento?.trim() &&
    tieneItemsValidos
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10">
      {/* Alerta de Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* 1. Barra de Tasa BCV Oficial - Totalmente Adaptativa */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-emerald-400 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">Tasa Oficial BCV</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Al día
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Factor oficial para cálculo en Bolívares
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-slate-950/60 p-2 md:p-0 rounded-xl border md:border-none border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">1 USD =</span>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.0001"
                min="0.01"
                value={tasaBCV}
                onChange={(e) => setTasaBCV(e.target.value)}
                placeholder="0.00"
                className="w-28 sm:w-36 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-white text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-right shadow-inner"
              />
              <span className="text-sm font-bold text-slate-300">Bs.</span>

              <button
                type="button"
                onClick={onActualizarBCV}
                disabled={cargandoBCV}
                title="Actualizar tasa BCV"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all disabled:opacity-50 active:scale-95"
              >
                <RotateCcw className={`w-4 h-4 ${cargandoBCV ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Datos del Cliente / Receptor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Datos del Cliente / Receptor
            </h2>
          </div>

          {/* Indicador del Correlativo y Nro de Control según talonario SENIAT */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl">
            <Receipt className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold text-slate-400">Próxima Factura:</span>
            <span className="text-xs font-mono font-black text-red-500 tracking-wider">
              Nº {proximoCorrelativo}
            </span>
            <span className="hidden xs:inline text-[10px] font-mono text-slate-400">
              (Control: 00-{proximoCorrelativo})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Cédula / RIF <span className="text-red-400">*</span>
              </label>

              {/* Botones de Selección Rápida de Prefijo */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['V', 'J', 'E', 'G'].map((tipo) => {
                  const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => seleccionarPrefijo(tipo)}
                      title={`Seleccionar prefijo ${tipo}-`}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                        activo
                          ? 'bg-red-600 text-white shadow-sm scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tipo}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              value={cliente.documento}
              onChange={(e) => handleDocumentoChange(e.target.value)}
              placeholder="Ej: V-18456789 o J-30123456"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-inner min-h-[44px]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nombre o Razón Social <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={cliente.nombre}
              onChange={(e) => handleClienteChange('nombre', e.target.value)}
              placeholder="Ej: Taller Mecánico Los Andes C.A. o Juan Pérez"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-inner min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={cliente.telefono}
              onChange={(e) => handleClienteChange('telefono', e.target.value)}
              placeholder="Ej: 0414-1234567"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-inner min-h-[44px]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Dirección de Entrega / Despacho
            </label>
            <input
              type="text"
              value={cliente.direccion}
              onChange={(e) => handleClienteChange('direccion', e.target.value)}
              placeholder="Ej: Av. Principal, Local Nro 4, Charallave"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-inner min-h-[44px]"
            />
          </div>

          {/* Opciones de Factura: Condiciones y Forma de Pago (Talonario Oficial) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Condición de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CONTADO', label: 'Contado' },
                { id: 'CRÉDITO', label: 'Crédito' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondicionPago && setCondicionPago(c.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border min-h-[42px] ${
                    condicionPago === c.id
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Forma de Pago
              </label>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                monedaIngreso === 'VES' 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>
                Cobro en {monedaIngreso === 'VES' ? 'Bolívares (Bs.)' : 'Dólares ($)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'PUNTO', label: 'Débito', moneda: 'VES' },
                { id: 'PAGO_MOVIL', label: 'P. Móvil', moneda: 'VES' },
                { id: 'EFECTIVO', label: 'Efectivo Bs', moneda: 'VES' },
                { id: 'TRANSFERENCIA', label: 'Transf. Bs', moneda: 'VES' },
                { id: 'BIOPAGO', label: 'Biopago', moneda: 'VES' },
                { id: 'DIVISA', label: '$ Divisas', moneda: 'USD' },
                { id: 'ZELLE', label: 'Zelle ($)', moneda: 'USD' },
                { id: 'BINANCE', label: 'Binance ($)', moneda: 'USD' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => seleccionarFormaPago(f.id, f.moneda)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border min-h-[42px] truncate ${
                    formaPago === f.id
                      ? f.moneda === 'VES'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                        : 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detalle de Repuestos / Renglones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Renglones de la Guía ({items.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Selector de Moneda de Ingreso */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Precios en:</span>
              <button
                type="button"
                onClick={() => setMonedaIngreso && setMonedaIngreso('VES')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  monedaIngreso === 'VES'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bs. Bolívares
              </button>
              <button
                type="button"
                onClick={() => setMonedaIngreso && setMonedaIngreso('USD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  monedaIngreso === 'USD'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                $ Dólares
              </button>
            </div>

            <button
              type="button"
              onClick={agregarItem}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-95 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Renglón</span>
            </button>
          </div>
        </div>

        {/* VISTA 1: TABLA PARA TABLETS Y COMPUTADORAS (md en adelante) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center rounded-l-lg">#</th>
                <th className="py-2.5 px-2 w-28 text-center">Cant.</th>
                <th className="py-2.5 px-4">Descripción del Repuesto</th>
                <th className="py-2.5 px-3 w-44 text-right">
                  {monedaIngreso === 'VES' ? (
                    <span className="text-emerald-400 font-black">P. Unit (Bs.)</span>
                  ) : (
                    <span className="text-red-400 font-black">P. Unit ($)</span>
                  )}
                </th>
                <th className="py-2.5 px-4 w-44 text-right">
                  {monedaIngreso === 'VES' ? (
                    <span className="text-emerald-400 font-black">Subtotal (Bs.)</span>
                  ) : (
                    <span className="text-red-400 font-black">Subtotal ($)</span>
                  )}
                </th>
                <th className="py-2.5 px-3 w-12 text-center rounded-r-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item, index) => {
                const qty = parseFloat(item.cantidad) || 0;
                const rate = parseFloat(tasaBCV) || 1;

                let unitPriceUSD = 0;
                let unitPriceBs = 0;

                if (monedaIngreso === 'VES') {
                  unitPriceBs = parseFloat(item.precio_bs) || 0;
                  unitPriceUSD = rate > 0 ? unitPriceBs / rate : 0;
                } else {
                  unitPriceUSD = parseFloat(item.precio) || 0;
                  unitPriceBs = unitPriceUSD * rate;
                }

                const subtotalUSD = qty * unitPriceUSD;
                const subtotalBs = qty * unitPriceBs;

                return (
                  <tr key={item.id || index} className="group hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-center text-xs font-mono font-bold text-slate-500">
                      {index + 1}
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-2 text-sm text-center font-mono font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
                        placeholder="1"
                      />
                    </td>

                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="Ej: Pastillas de Freno Delanteras Toyota Corolla 2012"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                          {monedaIngreso === 'VES' ? 'Bs.' : '$'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={monedaIngreso === 'VES' ? (item.precio_bs ?? '') : (item.precio ?? '')}
                          onChange={(e) => handlePrecioChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-right font-mono font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
                        />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 text-right pr-1 pt-0.5">
                        {monedaIngreso === 'VES'
                          ? `≈ ${formatUSD(unitPriceUSD)}`
                          : `≈ ${formatVES(unitPriceBs)}`}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono">
                      <div className="text-sm font-black text-slate-100">
                        {monedaIngreso === 'VES' ? formatVES(subtotalBs) : formatUSD(subtotalUSD)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {monedaIngreso === 'VES' ? `≈ ${formatUSD(subtotalUSD)}` : `≈ ${formatVES(subtotalBs)}`}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        title="Eliminar renglón"
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VISTA 2: TARJETAS MÓVILES PARA CELULARES (Menos de 768px) */}
        <div className="md:hidden space-y-3">
          {items.map((item, index) => {
            const qty = parseFloat(item.cantidad) || 0;
            const rate = parseFloat(tasaBCV) || 1;

            let unitPriceUSD = 0;
            let unitPriceBs = 0;

            if (monedaIngreso === 'VES') {
              unitPriceBs = parseFloat(item.precio_bs) || 0;
              unitPriceUSD = rate > 0 ? unitPriceBs / rate : 0;
            } else {
              unitPriceUSD = parseFloat(item.precio) || 0;
              unitPriceBs = unitPriceUSD * rate;
            }

            const subtotalUSD = qty * unitPriceUSD;
            const subtotalBs = qty * unitPriceBs;

            return (
              <div 
                key={item.id || index}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-inner"
              >
                {/* Cabecera del Renglón Móvil */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                    Renglón #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => eliminarItem(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Eliminar renglón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Descripción del Repuesto
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                    placeholder="Ej: Pastillas de Freno Toyota Corolla"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Cantidad y Precio en 2 columnas */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Cantidad
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(index, -1)}
                        className="w-10 h-11 bg-slate-800 border border-slate-700 rounded-l-xl text-white font-bold hover:bg-slate-700 active:scale-95 flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        className="w-full h-11 bg-slate-900 border-y border-slate-700 text-center text-base font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(index, 1)}
                        className="w-10 h-11 bg-slate-800 border border-slate-700 rounded-r-xl text-white font-bold hover:bg-slate-700 active:scale-95 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {monedaIngreso === 'VES' ? 'Precio Unitario (Bs.)' : 'Precio Unitario ($)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        {monedaIngreso === 'VES' ? 'Bs.' : '$'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={monedaIngreso === 'VES' ? (item.precio_bs ?? '') : (item.precio ?? '')}
                        onChange={(e) => handlePrecioChange(index, e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 text-base text-right font-mono font-bold text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 text-right pr-1 pt-0.5">
                      {monedaIngreso === 'VES'
                        ? `≈ ${formatUSD(unitPriceUSD)}`
                        : `≈ ${formatVES(unitPriceBs)}`}
                    </div>
                  </div>
                </div>

                {/* Subtotal del Renglón */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Subtotal del ítem:</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-slate-100 block">
                      {monedaIngreso === 'VES' ? formatVES(subtotalBs) : formatUSD(subtotalUSD)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {monedaIngreso === 'VES' ? `≈ ${formatUSD(subtotalUSD)}` : `≈ ${formatVES(subtotalBs)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={agregarItem}
            className="w-full py-3 bg-slate-800/80 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>Agregar Otro Repuesto</span>
          </button>
        </div>

        {/* Observaciones */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Observaciones o Notas de Entrega (opcional)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Repuestos entregados en mostrador con 30 días de garantía."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 min-h-[44px]"
          />
        </div>
      </div>

      {/* 4. Resumen de Totales - Adaptativo para pantallas chicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Recuadro de Bolívares Oficial BCV */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Total a Pagar en Bolívares
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                Tasa: {formatNumber(tasaBCV, 2)} Bs/$
              </span>
            </div>
            
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-emerald-400 tracking-tight my-2 break-words">
              {formatVES(totals.totalBs)}
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-800">
            * Conforme a la tasa oficial del Banco Central de Venezuela.
          </p>
        </div>

        {/* Desglose Matemático USD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span>Base Imponible (Subtotal):</span>
            <span className="font-mono font-bold text-white text-sm sm:text-base">{formatUSD(totals.baseImponible)}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span>I.V.A. (16.00%):</span>
            <span className="font-mono font-bold text-white text-sm sm:text-base">{formatUSD(totals.iva)}</span>
          </div>

          <div className="pt-2 sm:pt-3 border-t-2 border-slate-800 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-white">TOTAL A PAGAR (USD):</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-white">{formatUSD(totals.totalUSD)}</span>
          </div>
        </div>
      </div>

      {/* Mensaje de guía si faltan datos para emitir */}
      {!formularioValido && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-xs text-slate-400">
          💡 Para habilitar la emisión de factura: indica la <strong className="text-slate-200">Cédula/RIF</strong>, <strong className="text-slate-200">Nombre</strong> del cliente y al menos un <strong className="text-slate-200">repuesto con precio mayor a 0</strong>.
        </div>
      )}

      {/* 5. Barra de Acciones del Mostrador (Táctil y Responsive) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-3 z-30 shadow-2xl">
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-colors active:scale-95 min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nueva Factura / Limpiar</span>
        </button>

        {/* Botón Único de Acción: Guarda automáticamente en base de datos y genera la factura PDF en 1 solo paso */}
        <button
          type="button"
          onClick={onImprimir}
          disabled={!formularioValido || loading}
          title={!formularioValido ? 'Rellena el formulario completo para emitir la factura' : 'Guarda la venta en el sistema y emite la factura en PDF'}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-2.5 rounded-xl text-sm font-extrabold shadow-lg transition-all min-h-[48px] ${
            formularioValido && !loading
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 hover:scale-[1.01] active:scale-95 cursor-pointer'
              : 'bg-slate-800 border border-slate-700/80 text-slate-500 opacity-40 cursor-not-allowed shadow-none'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{loading ? 'Guardando y Emitiendo...' : 'Emitir e Imprimir Factura (PDF)'}</span>
        </button>
      </div>
    </div>
  );
}

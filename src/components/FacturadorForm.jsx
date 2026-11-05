import React from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  Receipt, 
  User, 
  AlertCircle,
  FileText,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRightLeft,
  ShieldCheck,
  DollarSign,
  Coins,
  CheckCircle2,
  Sparkles,
  Phone,
  MapPin,
  Hash,
  Layers
} from 'lucide-react';
import { formatUSD, formatVES, formatNumber, formatMilesVES, parseVenezuelanNumber } from '../lib/formatters';

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

  // Manejador estricto para Teléfono: solo números y autoformato (ej: 0414-1234567)
  const handleTelefonoChange = (raw) => {
    let digits = raw.replace(/\D/g, '');
    
    // Si pegan formato internacional venezolano +58414... convertir a 0414...
    if (digits.startsWith('58') && digits.length >= 12) {
      digits = '0' + digits.slice(2);
    }
    
    digits = digits.slice(0, 11);
    
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    handleClienteChange('telefono', formatted);
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Manejador de precios reactivo según la moneda activa (Bs. o $)
  // Formatea automáticamente con puntos de miles y coma decimal estándar venezolano
  const handlePrecioChange = (index, rawValue) => {
    let input = rawValue;
    // Si el usuario presiona el punto en el teclado numérico, interpretarlo como coma decimal si no hay coma aún
    if (input.endsWith('.') && !input.slice(0, -1).includes(',')) {
      input = input.slice(0, -1) + ',';
    }

    // Permitir solo números, coma y punto
    input = input.replace(/[^0-9.,]/g, '');

    // Formatear automáticamente con puntos de miles y coma decimal
    const formatted = formatMilesVES(input);
    const numVal = parseVenezuelanNumber(formatted);

    const rateClean = parseVenezuelanNumber(tasaBCV);
    const rate = rateClean > 0 ? rateClean : 1;

    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };

      if (monedaIngreso === 'VES') {
        item.precio_bs = formatted;
        item.precio = formatted && numVal > 0 && rate > 0 ? (numVal / rate).toFixed(4) : '';
      } else {
        item.precio = formatted;
        item.precio_bs = formatted && numVal > 0 && rate > 0 ? formatNumber(numVal * rate, 2) : '';
      }
      next[index] = item;
      return next;
    });
  };

  // Al perder el foco (onBlur), asegurar que los decimales queden formalizados (ej: 6.857,00)
  const handlePrecioBlur = (index) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const currentVal = monedaIngreso === 'VES' ? item.precio_bs : item.precio;
      if (!currentVal) return prev;

      const numVal = parseVenezuelanNumber(currentVal);
      if (numVal > 0) {
        const withDecimals = formatNumber(numVal, 2);
        const rateClean = parseVenezuelanNumber(tasaBCV);
        const rate = rateClean > 0 ? rateClean : 1;

        if (monedaIngreso === 'VES') {
          item.precio_bs = withDecimals;
          item.precio = (numVal / rate).toFixed(4);
        } else {
          item.precio = withDecimals;
          item.precio_bs = formatNumber(numVal * rate, 2);
        }
        next[index] = item;
        return next;
      }
      return prev;
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
      { id: Date.now(), cantidad: 1, descripcion: '', precio: '', precio_bs: '' }
    ]);
  };

  const eliminarItem = (index) => {
    if (items.length === 1) {
      setItems([{ id: Date.now(), cantidad: 1, descripcion: '', precio: '', precio_bs: '' }]);
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

  // Validación estricta para activar el botón de emitir factura con parseVenezuelanNumber
  const tieneItemsValidos = items.some(it => {
    const hasDesc = it.descripcion && it.descripcion.trim().length > 0;
    const hasQty = parseFloat(it.cantidad) > 0;
    const priceVal = monedaIngreso === 'VES' 
      ? parseVenezuelanNumber(it.precio_bs)
      : parseVenezuelanNumber(it.precio);
    return hasDesc && hasQty && priceVal > 0;
  });

  const formularioValido = Boolean(
    cliente.nombre?.trim() &&
    cliente.documento?.trim() &&
    tieneItemsValidos
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-slide-up pb-12 font-sans">
      {/* Alerta de Error Elegante */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm shadow-xl shadow-rose-950/20">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <p className="font-medium tracking-wide">{error}</p>
        </div>
      )}

      {/* 1. Barra de Tasa BCV Oficial - Cockpit Telemetry Badge */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 relative overflow-hidden group">
        {/* Ambient glow sutil */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-full p-1 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border-2 border-emerald-500/50 flex-shrink-0 group-hover:scale-105 transition-all duration-200">
              <img
                src="/bcv_logo.svg"
                alt="Banco Central de Venezuela"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white tracking-wide font-heading">
                  TASA OFICIAL BCV
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Al Día
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide mt-0.5">
                Factor oficial para cálculo automático en Bolívares
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end bg-[#06080F]/80 p-2 sm:p-2.5 rounded-2xl border border-white/[0.06] shadow-inner">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 font-mono">
              1 USD =
            </span>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={tasaBCV}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setTasaBCV(val);
                }}
                placeholder="0,00"
                className="w-32 sm:w-36 bg-[#0B0F19] border border-white/[0.12] rounded-xl px-3 py-1.5 font-mono font-black text-white text-base focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-right shadow-inner transition-all duration-200"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 px-1">Bs.</span>

              <button
                type="button"
                onClick={onActualizarBCV}
                disabled={cargandoBCV}
                title="Actualizar tasa BCV en tiempo real"
                className="p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-emerald-500/40 rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${cargandoBCV ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Datos del Cliente / Receptor - Cockpit Glass Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-64 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-heading">
              Datos del Cliente / Receptor
            </h2>
          </div>

          {/* Indicador del Correlativo y Nro de Control según talonario SENIAT */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#06080F]/90 border border-white/[0.08] rounded-2xl shadow-inner">
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-bold text-slate-400 tracking-wide">Próxima Factura:</span>
            <span className="text-xs font-mono font-black text-rose-400 tracking-wider">
              Nº {proximoCorrelativo}
            </span>
            <span className="hidden xs:inline text-[10px] font-mono text-slate-400">
              (Control: 00-{proximoCorrelativo})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Cédula / RIF <span className="text-rose-400">*</span>
              </label>

              {/* Botones de Selección Rápida de Prefijo */}
              <div className="flex items-center gap-1 bg-[#06080F] p-1 rounded-xl border border-white/[0.08]">
                {['V', 'J', 'E', 'G'].map((tipo) => {
                  const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => seleccionarPrefijo(tipo)}
                      title={`Seleccionar prefijo ${tipo}-`}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-black transition-all duration-150 cursor-pointer ${
                        activo
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40 scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
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
              className="w-full input-cockpit rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white font-mono placeholder:text-slate-500 tracking-wider shadow-inner min-h-[46px]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nombre o Razón Social <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={cliente.nombre}
              onChange={(e) => handleClienteChange('nombre', e.target.value)}
              placeholder="Ej: Taller Mecánico Los Andes C.A. o Juan Pérez"
              className="w-full input-cockpit rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 shadow-inner min-h-[46px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Teléfono de Contacto</span>
              <span className="text-[10px] text-slate-500 font-normal">Solo números</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={12}
              value={cliente.telefono}
              onChange={(e) => handleTelefonoChange(e.target.value)}
              onKeyDown={(e) => {
                // Bloquear cualquier tecla que no sea dígito numérico, permitiendo teclas de control
                if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              placeholder="Ej: 0414-1234567"
              className="w-full input-cockpit rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white font-mono placeholder:text-slate-500 tracking-wider shadow-inner min-h-[46px]"
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
              className="w-full input-cockpit rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 shadow-inner min-h-[46px]"
            />
          </div>

          {/* Opciones de Factura: Condiciones y Forma de Pago */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Condición de Pago
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'CONTADO', label: 'Contado' },
                { id: 'CRÉDITO', label: 'Crédito' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondicionPago && setCondicionPago(c.id)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 border min-h-[44px] cursor-pointer ${
                    condicionPago === c.id
                      ? c.id === 'CONTADO'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-500/50 shadow-lg shadow-red-950/40 scale-[1.01]'
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500/50 shadow-lg shadow-amber-950/40 scale-[1.01]'
                      : 'bg-[#06080F]/80 text-slate-400 border-white/[0.07] hover:text-white hover:bg-white/[0.04]'
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
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                monedaIngreso === 'VES' 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                Cobro en {monedaIngreso === 'VES' ? 'Bolívares (Bs.)' : 'Dólares ($)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'PUNTO', label: 'Débito', moneda: 'VES', icon: CreditCard },
                { id: 'PAGO_MOVIL', label: 'P. Móvil', moneda: 'VES', icon: Smartphone },
                { id: 'EFECTIVO', label: 'Efectivo Bs', moneda: 'VES', icon: Banknote },
                { id: 'TRANSFERENCIA', label: 'Transf. Bs', moneda: 'VES', icon: ArrowRightLeft },
                { id: 'BIOPAGO', label: 'Biopago', moneda: 'VES', icon: ShieldCheck },
                { id: 'DIVISA', label: '$ Divisas', moneda: 'USD', icon: DollarSign },
                { id: 'ZELLE', label: 'Zelle ($)', moneda: 'USD', icon: Coins },
                { id: 'BINANCE', label: 'Binance ($)', moneda: 'USD', icon: Sparkles },
              ].map(f => {
                const IconComp = f.icon;
                const activo = formaPago === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => seleccionarFormaPago(f.id, f.moneda)}
                    className={`py-2 px-2 rounded-2xl text-[11px] font-bold transition-all duration-200 border min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                      activo
                        ? f.moneda === 'VES'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-400/40 shadow-lg shadow-red-950/50 scale-[1.02]'
                        : 'bg-[#06080F]/80 text-slate-400 border-white/[0.07] hover:text-white hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${activo ? 'text-white' : f.moneda === 'VES' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="truncate">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detalle de Repuestos / Renglones - Cockpit Glass Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-heading">
              Renglones de la Guía ({items.length})
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-between sm:justify-end">
            {/* Selector de Moneda de Ingreso */}
            <div className="flex items-center gap-1 bg-[#06080F]/90 p-1 rounded-2xl border border-white/[0.08] shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 px-2.5 uppercase font-mono tracking-wider">
                Precios en:
              </span>
              <button
                type="button"
                onClick={() => setMonedaIngreso && setMonedaIngreso('VES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  monedaIngreso === 'VES'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bs. Bolívares
              </button>
              <button
                type="button"
                onClick={() => setMonedaIngreso && setMonedaIngreso('USD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  monedaIngreso === 'USD'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40 scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                $ Dólares
              </button>
            </div>

            <button
              type="button"
              onClick={agregarItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient-red text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-95 min-h-[42px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Renglón</span>
            </button>
          </div>
        </div>

        {/* VISTA 1: TABLA PARA COMPUTADORAS Y TABLETS */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#06080F]/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0F19]/90 border-b border-white/[0.08] text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-heading">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3 w-28 text-center">Cant.</th>
                <th className="py-3 px-4">Descripción del Repuesto</th>
                <th className="py-3 px-4 w-48 text-right">
                  {monedaIngreso === 'VES' ? (
                    <span className="text-emerald-400 font-black">P. Unit (Bs.)</span>
                  ) : (
                    <span className="text-rose-400 font-black">P. Unit ($)</span>
                  )}
                </th>
                <th className="py-3 px-4 w-48 text-right">
                  {monedaIngreso === 'VES' ? (
                    <span className="text-emerald-400 font-black">Subtotal (Bs.)</span>
                  ) : (
                    <span className="text-rose-400 font-black">Subtotal ($)</span>
                  )}
                </th>
                <th className="py-3 px-3 w-14 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((item, index) => {
                const qty = parseFloat(item.cantidad) || 0;
                const rateClean = parseVenezuelanNumber(tasaBCV);
                const rate = rateClean > 0 ? rateClean : 1;

                let unitPriceUSD = 0;
                let unitPriceBs = 0;

                if (monedaIngreso === 'VES') {
                  unitPriceBs = parseVenezuelanNumber(item.precio_bs);
                  unitPriceUSD = rate > 0 ? unitPriceBs / rate : 0;
                } else {
                  unitPriceUSD = parseVenezuelanNumber(item.precio);
                  unitPriceBs = unitPriceUSD * rate;
                }

                const subtotalUSD = qty * unitPriceUSD;
                const subtotalBs = qty * unitPriceBs;

                return (
                  <tr key={item.id || index} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5 text-center text-xs font-mono font-bold text-slate-500">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-full input-cockpit rounded-xl px-2 py-2 text-sm text-center font-mono font-black text-white shadow-inner"
                        placeholder="1"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="Ej: Pastillas de Freno Delanteras Toyota Corolla 2012"
                        className="w-full input-cockpit rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 shadow-inner"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-black ${
                          monedaIngreso === 'VES' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {monedaIngreso === 'VES' ? 'Bs.' : '$'}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={monedaIngreso === 'VES' ? (item.precio_bs ?? '') : (item.precio ?? '')}
                          onChange={(e) => handlePrecioChange(index, e.target.value)}
                          onBlur={() => handlePrecioBlur(index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          placeholder={monedaIngreso === 'VES' ? '0,00' : '0.00'}
                          className="w-full input-cockpit rounded-xl pl-10 pr-3 py-2 text-sm text-right font-mono font-black text-white shadow-inner"
                        />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 text-right pr-1 pt-1">
                        {monedaIngreso === 'VES'
                          ? `≈ ${formatUSD(unitPriceUSD)}`
                          : `≈ ${formatVES(unitPriceBs)}`}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div className="text-sm font-black text-white">
                        {monedaIngreso === 'VES' ? formatVES(subtotalBs) : formatUSD(subtotalUSD)}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        {monedaIngreso === 'VES' ? `≈ ${formatUSD(subtotalUSD)}` : `≈ ${formatVES(subtotalBs)}`}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        title="Eliminar renglón"
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 cursor-pointer"
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

        {/* VISTA 2: TARJETAS MÓVILES PARA CELULARES */}
        <div className="md:hidden space-y-3">
          {items.map((item, index) => {
            const qty = parseFloat(item.cantidad) || 0;
            const rateClean = parseVenezuelanNumber(tasaBCV);
            const rate = rateClean > 0 ? rateClean : 1;

            let unitPriceUSD = 0;
            let unitPriceBs = 0;

            if (monedaIngreso === 'VES') {
              unitPriceBs = parseVenezuelanNumber(item.precio_bs);
              unitPriceUSD = rate > 0 ? unitPriceBs / rate : 0;
            } else {
              unitPriceUSD = parseVenezuelanNumber(item.precio);
              unitPriceBs = unitPriceUSD * rate;
            }

            const subtotalUSD = qty * unitPriceUSD;
            const subtotalBs = qty * unitPriceBs;

            return (
              <div 
                key={item.id || index}
                className="bg-[#06080F]/90 border border-white/[0.08] rounded-2xl p-4 space-y-3.5 shadow-inner"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                    Renglón #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => eliminarItem(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    title="Eliminar renglón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Descripción del Repuesto
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                    placeholder="Ej: Pastillas de Freno Toyota Corolla"
                    className="w-full input-cockpit rounded-xl px-3.5 py-2.5 text-base text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Cantidad
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(index, -1)}
                        className="w-10 h-11 bg-white/[0.05] border border-white/[0.1] rounded-l-xl text-white font-bold hover:bg-white/[0.1] active:scale-95 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        className="w-full h-11 bg-[#06080F] border-y border-white/[0.1] text-center text-base font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => ajustarCantidad(index, 1)}
                        className="w-10 h-11 bg-white/[0.05] border border-white/[0.1] rounded-r-xl text-white font-bold hover:bg-white/[0.1] active:scale-95 flex items-center justify-center cursor-pointer"
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
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold ${
                        monedaIngreso === 'VES' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {monedaIngreso === 'VES' ? 'Bs.' : '$'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={monedaIngreso === 'VES' ? (item.precio_bs ?? '') : (item.precio ?? '')}
                        onChange={(e) => handlePrecioChange(index, e.target.value)}
                        onBlur={() => handlePrecioBlur(index)}
                        placeholder={monedaIngreso === 'VES' ? '0,00' : '0.00'}
                        className="w-full h-11 input-cockpit rounded-xl pl-9 pr-3 text-base text-right font-mono font-bold text-white"
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 text-right pr-1 pt-1">
                      {monedaIngreso === 'VES'
                        ? `≈ ${formatUSD(unitPriceUSD)}`
                        : `≈ ${formatVES(unitPriceBs)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <span className="text-slate-400">Subtotal del ítem:</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-white block">
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
            className="w-full py-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/20 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Agregar Otro Repuesto</span>
          </button>
        </div>

        {/* Observaciones */}
        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Observaciones o Notas de Entrega (opcional)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Repuestos entregados en mostrador con 30 días de garantía."
            className="w-full input-cockpit rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 min-h-[46px]"
          />
        </div>
      </div>

      {/* 4. Resumen de Totales - Twin HUD Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Recuadro de Bolívares Oficial BCV con Desglose Completo de IVA */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-3 border-t-2 border-t-emerald-500/80 group">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-300"></div>

          <div className="relative flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-heading">
              Cálculo Oficial en Bolívares (BCV)
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#06080F] border border-emerald-500/30 text-emerald-300 rounded-xl shadow-inner">
              Tasa: {formatNumber(tasaBCV, 2)} Bs/$
            </span>
          </div>

          <div className="relative flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span className="font-medium">Base Imponible (Subtotal Bs.):</span>
            <span className="font-mono font-bold text-white text-sm sm:text-base">
              {formatVES(totals.baseImponibleBs)}
            </span>
          </div>

          <div className="relative flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span className="font-medium flex items-center gap-1.5">
              <span>I.V.A. (16.00% en Bs.):</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                SENIAT
              </span>
            </span>
            <span className="font-mono font-bold text-emerald-300 text-sm sm:text-base">
              {formatVES(totals.ivaBs)}
            </span>
          </div>

          <div className="relative pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div>
              <span className="text-xs font-extrabold text-slate-300 font-heading uppercase tracking-wider block">
                Total a Pagar (Bolívares)
              </span>
              <span className="text-[11px] text-emerald-400/80 font-mono font-medium">
                Monto oficial con I.V.A. (16%)
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-tight">
                {formatVES(totals.totalBs)}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose Matemático USD */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-3 border-t-2 border-t-rose-500/80 group">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/15 transition-all duration-300"></div>

          <div className="relative flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 font-heading">
              Desglose de Referencia (USD)
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#06080F] border border-rose-500/30 text-rose-300 rounded-xl shadow-inner">
              $ Dólares
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span className="font-medium">Base Imponible (Subtotal $):</span>
            <span className="font-mono font-bold text-white text-sm sm:text-base">{formatUSD(totals.baseImponible)}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span className="font-medium">I.V.A. (16.00% en $):</span>
            <span className="font-mono font-bold text-white text-sm sm:text-base">{formatUSD(totals.iva)}</span>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div>
              <span className="text-xs font-extrabold text-slate-300 font-heading uppercase tracking-wider block">
                Total a Pagar (USD)
              </span>
              <span className="text-[11px] text-rose-400/80 font-mono font-medium">
                Monto referencial en Divisas
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] tracking-tight">
                {formatUSD(totals.totalUSD)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de guía si faltan datos para emitir */}
      {!formularioValido && (
        <div className="bg-[#0B0F19]/90 border border-white/[0.08] rounded-2xl px-5 py-3 text-center text-xs text-slate-300 font-medium">
          💡 Para habilitar la emisión: indica la <strong className="text-rose-400 font-bold">Cédula/RIF</strong>, <strong className="text-rose-400 font-bold">Nombre</strong> del cliente y al menos un <strong className="text-emerald-400 font-bold">repuesto con precio mayor a 0</strong>.
        </div>
      )}

      {/* 5. Barra de Acciones Flotante del Mostrador (Fondo sólido para evitar transparencias molestas) */}
      <div className="bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-3.5 sm:p-4.5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-4 z-30 shadow-2xl shadow-black/90">
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nueva Factura / Limpiar</span>
        </button>

        {/* Botón Único de Acción: Guarda automáticamente en base de datos y genera la factura PDF en 1 solo paso */}
        <button
          type="button"
          onClick={onImprimir}
          disabled={!formularioValido || loading}
          title={!formularioValido ? 'Rellena el formulario completo para emitir la factura' : 'Guarda la venta en Supabase y emite la factura en PDF'}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-extrabold shadow-xl transition-all duration-200 min-h-[48px] ${
            formularioValido && !loading
              ? 'btn-gradient-red text-white cursor-pointer hover:scale-[1.01] active:scale-95'
              : 'bg-[#0B0F19] border border-white/[0.06] text-slate-500 opacity-40 cursor-not-allowed shadow-none'
          }`}
        >
          <Printer className={`w-4 h-4 ${formularioValido && !loading ? 'animate-bounce' : ''}`} />
          <span className="tracking-wide">{loading ? 'Guardando y Emitiendo...' : 'Emitir e Imprimir Factura (PDF)'}</span>
        </button>
      </div>
    </div>
  );
}

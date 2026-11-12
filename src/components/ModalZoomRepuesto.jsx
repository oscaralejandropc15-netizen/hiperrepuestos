import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, Car, Tag, Layers, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../lib/formatters';

export default function ModalZoomRepuesto({ producto, repuesto, onClose, onCerrar, onAgregarCarrito, tasaBCV }) {
  const item = producto || repuesto;
  const cerrar = onClose || onCerrar;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cerrar?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cerrar]);

  if (!item) return null;

  const fotoUrl = obtenerFotoRepuesto(item);
  const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
  const precioUSD = item.precio_detal_usd || 0;
  const precioVES = precioUSD * tasaNum;
  const agotado = (item.stock ?? 0) <= 0;

  const modalContent = (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar?.();
      }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/15 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 my-6 animate-scaleIn cursor-default"
      >
        
        {/* Cabecera superior con estilo AutoZone */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-red-600 text-white tracking-wider">
              {item.codigo_corto}
            </span>
            {item.linea && (
              <span className="font-mono font-bold text-[11px] px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 uppercase">
                {item.linea}
              </span>
            )}
            {item.sublinea && item.sublinea !== 'General' && (
              <span className="font-mono font-medium text-[11px] text-slate-500 dark:text-slate-400">
                / {item.sublinea}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={cerrar}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido: Foto grande + Detalles del repuesto */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Contenedor de la foto con efecto estudio profesional */}
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 dark:from-black/60 dark:to-black/30 border border-slate-200 dark:border-white/10 flex items-center justify-center p-4 group">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={item.descripcion}
                className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Package className="w-16 h-16 stroke-1 opacity-40" />
                <span className="font-mono text-xs uppercase font-bold tracking-wider">Sin Foto de Referencia Asignada</span>
              </div>
            )}
            
            {/* Badge de Foto de Referencia */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{fotoUrl ? 'Foto de Referencia Oficial' : 'Catálogo Familycar'}</span>
            </div>

            {/* Marca en la foto */}
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md font-mono font-black text-xs uppercase text-slate-900 dark:text-white border border-slate-200 dark:border-white/15">
              {item.marca_producto || item.marca || 'ATS'}
            </div>
          </div>

          {/* Ficha técnica del repuesto */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-snug">
                {item.descripcion}
              </h3>
              {item.referencia && (
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Referencia OEM: <span className="font-bold text-slate-700 dark:text-slate-300">{item.referencia}</span>
                </p>
              )}
            </div>

            {/* Grid de atributos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Vehículo</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.modelo_vehiculo || 'Universal'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Marca</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.marca_producto || item.marca || 'ATS'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Medidas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.medidas || 'Estándar'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Existencia</span>
                <span className={`font-black ${agotado ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {agotado ? 'Agotado (0)' : `${item.stock ?? 0} disponibles`}
                </span>
              </div>
            </div>

            {/* Tarjeta de precios & botón de acción */}
            <div className="p-4 rounded-2xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                  Precio de Mostrador
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatUSD(precioUSD)}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                    {formatVES(precioVES)}
                  </span>
                </div>
              </div>

              {onAgregarCarrito ? (
                <button
                  type="button"
                  onClick={() => {
                    onAgregarCarrito(item);
                    cerrar?.();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Agregar al Carrito</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cerrar}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, Sparkles } from 'lucide-react';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../lib/formatters';
import { getBackdropProps } from '../lib/modalBackdrop';

export default function ModalZoomRepuesto({
  producto,
  repuesto,
  onClose,
  onCerrar,
  onAgregarCarrito,
  tasaBCV,
}) {
  const item = producto || repuesto;
  const cerrar = onClose || onCerrar;

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') cerrar?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, cerrar]);

  if (!item || typeof document === 'undefined') return null;

  const fotoUrl = obtenerFotoRepuesto(item);
  const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
  const precioUSD = parseFloat(item.precio_detal_usd) || 0;
  const precioVES = precioUSD * tasaNum;
  const agotado = (item.stock ?? 0) <= 0;

  return createPortal(
    <div
      {...getBackdropProps(cerrar)}
      className="fixed inset-0 z-[9999] bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto animate-scale-in cursor-default"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white">
              {item.codigo_corto}
            </span>
            {item.linea && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                {item.linea}
              </span>
            )}
            {item.sublinea && item.sublinea !== 'General' && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                / {item.sublinea}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar vista previa"
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Imagen */}
          <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/70 dark:from-black/50 dark:to-[#090d16] border border-slate-200 dark:border-white/10 flex items-center justify-center p-4 group">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={item.descripcion}
                className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Package className="w-14 h-14 stroke-1 opacity-40" />
                <span className="text-xs font-medium">Sin fotografía asignada</span>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{fotoUrl ? 'Imagen de referencia' : 'Catálogo Familycar'}</span>
            </div>

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-[#0e1422]/90 backdrop-blur-md font-mono font-bold text-xs uppercase text-slate-900 dark:text-white border border-slate-200 dark:border-white/15">
              {item.marca_producto || item.marca || 'GENÉRICO'}
            </div>
          </div>

          {/* Ficha técnica */}
          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {item.descripcion}
              </h3>
              {item.referencia && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Referencia OEM:{' '}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    {item.referencia}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.08] text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Vehículo</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {item.modelo_vehiculo || 'Universal'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Marca</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {item.marca_producto || item.marca || 'GENÉRICO'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Medidas</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {item.medidas || 'Estándar'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Existencia</span>
                <span
                  className={`font-mono font-bold mt-0.5 block ${
                    agotado
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {agotado ? 'Agotado (0)' : `${item.stock ?? 0} disp.`}
                </span>
              </div>
            </div>

            {/* Precio y botón de acción */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Precio de Mostrador
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {formatUSD(precioUSD)}
                  </span>
                  <span className="text-sm font-mono font-semibold text-slate-600 dark:text-slate-300">
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
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 btn-gradient-emerald text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar al carrito</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cerrar}
                  className="w-full sm:w-auto min-h-[42px] px-5 py-2 btn-secondary text-xs"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

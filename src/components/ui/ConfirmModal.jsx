import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Modal de confirmación accesible (reemplaza window.confirm / window.alert nativos).
 */
export default function ConfirmModal({
  open,
  title,
  description,
  details = [],
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
      Icon: AlertTriangle,
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
      Icon: AlertTriangle,
    },
    primary: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-brand',
      Icon: CheckCircle2,
    },
  }[variant] || {
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
    Icon: Info,
  };

  const { iconBg, btn, Icon } = variantStyles;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.();
      }}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              {description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Cerrar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {details.length > 0 && (
          <div className="bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-3.5 space-y-1.5 text-xs">
            {details.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-right font-mono">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          {cancelLabel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="min-h-[42px] px-4 py-2 btn-secondary text-xs"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[42px] px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${btn}`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

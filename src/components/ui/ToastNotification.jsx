import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Notificación Toast flotante unificada con soporte claro/oscuro y posición segura en móvil.
 */
export default function ToastNotification({ notification, onClose }) {
  if (!notification || typeof document === 'undefined') return null;

  const isString = typeof notification === 'string';
  const message = isString ? notification : notification.mensaje;
  const tipo = isString ? 'success' : notification.tipo || 'success';

  const config = {
    success: {
      wrap: 'bg-white dark:bg-[#0e1b16] border-emerald-200 dark:border-emerald-500/40 text-slate-900 dark:text-emerald-100',
      iconWrap: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    error: {
      wrap: 'bg-white dark:bg-[#1c0e13] border-rose-200 dark:border-rose-500/40 text-slate-900 dark:text-rose-100',
      iconWrap: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
      Icon: AlertCircle,
    },
    warning: {
      wrap: 'bg-white dark:bg-[#1c160b] border-amber-200 dark:border-amber-500/40 text-slate-900 dark:text-amber-100',
      iconWrap: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
      Icon: AlertTriangle,
    },
    info: {
      wrap: 'bg-white dark:bg-[#0e1626] border-sky-200 dark:border-sky-500/40 text-slate-900 dark:text-sky-100',
      iconWrap: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400',
      Icon: Info,
    },
  }[tipo] || {
    wrap: 'bg-white dark:bg-[#0e1b16] border-emerald-200 dark:border-emerald-500/40 text-slate-900 dark:text-emerald-100',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    Icon: CheckCircle2,
  };

  const { wrap, iconWrap, Icon } = config;

  return createPortal(
    <div
      className="no-print fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[999999] max-w-sm w-[calc(100vw-2rem)] animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className={`px-4 py-3 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${wrap}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconWrap}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium leading-snug break-words">
            {message}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

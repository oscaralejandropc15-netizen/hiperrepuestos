import React from 'react';

export default function FamilycarLogo({ className = 'w-20 h-20', showText = true, lightText = false }) {
  return (
    <div className="flex flex-col items-center select-none">
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute -inset-1.5 rounded-full bg-red-600/20 blur-md pointer-events-none" />
        <img
          src="/logo.png"
          alt="Hiper Repuestos Familycar C.A."
          className="relative w-full h-full object-contain rounded-full border border-white/15 bg-black shadow-lg"
        />
      </div>

      {showText && (
        <div className="mt-3.5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">
            Hiper Repuestos
          </p>
          <h1
            className={`font-heading text-xl font-bold tracking-tight leading-tight mt-0.5 ${lightText ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
          >
            Familycar{' '}
            <span className={`text-xs font-semibold ${lightText ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
              C.A.
            </span>
          </h1>
          <p className={`text-xs font-mono mt-1 ${lightText ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            RIF: J-412654489 · Charallave
          </p>
        </div>
      )}
    </div>
  );
}

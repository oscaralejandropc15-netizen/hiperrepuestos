import React from 'react';

export default function FamilycarLogo({ className = "w-20 h-20", showText = true }) {
  return (
    <div className="flex flex-col items-center select-none">
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Imagen del Logo Oficial con borde sobrio */}
        <img
          src="/logo.png"
          alt="Hiper Repuestos Familycar C.A."
          className="relative w-full h-full object-contain rounded-full border border-slate-700/80 shadow-lg shadow-black/40 hover:scale-105 transition-transform duration-200"
        />
      </div>

      {showText && (
        <div className="mt-3.5 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-500">
            Hiper Repuestos
          </p>
          <h1 className="text-xl font-black text-white tracking-tight leading-tight">
            FAMILYCAR <span className="text-xs font-bold text-slate-400">C.A.</span>
          </h1>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            RIF: J-412654489 • Charallave
          </p>
        </div>
      )}
    </div>
  );
}

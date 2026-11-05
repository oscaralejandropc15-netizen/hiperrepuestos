import React from 'react';

/**
 * Animación moderna de autos deportivos corriendo en autopista nocturna
 * Optimizado con SVG vectorial y keyframes CSS acelerados por GPU (60fps)
 */
export default function RacingCarsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <style>{`
        /* Pista y líneas de velocidad en carretera */
        @keyframes roadMotion {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Autos de carreras corriendo a diferentes velocidades */
        @keyframes raceCarFast {
          0% {
            transform: translateX(-350px) translateY(0) scale(0.9);
            opacity: 0;
          }
          5% { opacity: 1; }
          45% {
            transform: translateX(calc(50vw - 100px)) translateY(-4px) scale(0.92);
          }
          95% { opacity: 1; }
          100% {
            transform: translateX(calc(100vw + 350px)) translateY(0) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes raceCarHyper {
          0% {
            transform: translateX(-400px) translateY(0) scale(1);
            opacity: 0;
          }
          4% { opacity: 1; }
          50% {
            transform: translateX(calc(55vw - 50px)) translateY(3px) scale(1.02);
          }
          96% { opacity: 1; }
          100% {
            transform: translateX(calc(100vw + 400px)) translateY(0) scale(1);
            opacity: 0;
          }
        }

        @keyframes raceCarChaser {
          0% {
            transform: translateX(-300px) translateY(0) scale(0.82);
            opacity: 0;
          }
          6% { opacity: 1; }
          50% {
            transform: translateX(calc(48vw - 120px)) translateY(-2px) scale(0.84);
          }
          94% { opacity: 1; }
          100% {
            transform: translateX(calc(100vw + 300px)) translateY(0) scale(0.82);
            opacity: 0;
          }
        }

        /* Destellos y estelas de luz de velocidad */
        @keyframes lightTrailStreak {
          0% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 0.95; transform: scaleX(1.3); }
          100% { opacity: 0.3; transform: scaleX(0.8); }
        }

        /* Ruedas girando */
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-road {
          animation: roadMotion 0.6s linear infinite;
        }

        .animate-car-fast {
          animation: raceCarFast 5.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }

        .animate-car-hyper {
          animation: raceCarHyper 4.2s cubic-bezier(0.15, 0.05, 0.2, 1) infinite;
          animation-delay: 1.8s;
        }

        .animate-car-chaser {
          animation: raceCarChaser 6.8s cubic-bezier(0.3, 0.1, 0.3, 1) infinite;
          animation-delay: 3.4s;
        }

        .animate-trail {
          animation: lightTrailStreak 1.2s ease-in-out infinite alternate;
        }
      `}</style>

      {/* 1. Malla de perspectiva en el fondo (Carretera y Cielo Nocturno) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-[#070b14]" />

      {/* Partículas de velocidad horizontales en el cielo */}
      <div className="absolute top-1/4 w-full h-32 opacity-25">
        <div className="w-[200%] h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent animate-road" style={{ animationDuration: '1.2s' }} />
        <div className="w-[200%] h-0.5 mt-8 bg-gradient-to-r from-transparent via-slate-400/30 to-transparent animate-road" style={{ animationDuration: '0.9s' }} />
        <div className="w-[200%] h-0.5 mt-12 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent animate-road" style={{ animationDuration: '1.5s' }} />
      </div>

      {/* 2. Pista de Asfalto en la Parte Inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-72 border-t-2 border-red-500/30 bg-gradient-to-b from-[#0a0f1d] via-[#070a14] to-black shadow-2xl">
        {/* Luz reflejada en el asfalto */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-600/20 via-rose-500/40 to-red-600/20" />

        {/* Carril Superior - Líneas discontinuas en movimiento rápido */}
        <div className="absolute top-16 inset-x-0 h-1 overflow-hidden opacity-40">
          <div className="flex w-[200%] animate-road">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={`l1-${i}`} className="inline-block w-12 h-1 bg-slate-400 mr-12 flex-shrink-0 rounded-full" />
            ))}
          </div>
        </div>

        {/* Carril Central - Línea doble discontinua amarilla/blanca */}
        <div className="absolute top-36 inset-x-0 h-1.5 overflow-hidden opacity-50">
          <div className="flex w-[200%] animate-road" style={{ animationDuration: '0.45s' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={`l2-${i}`} className="inline-block w-16 h-1.5 bg-amber-400 mr-14 flex-shrink-0 rounded-full" />
            ))}
          </div>
        </div>

        {/* Carril Inferior */}
        <div className="absolute top-56 inset-x-0 h-1 overflow-hidden opacity-30">
          <div className="flex w-[200%] animate-road" style={{ animationDuration: '0.5s' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={`l3-${i}`} className="inline-block w-14 h-1 bg-slate-400 mr-14 flex-shrink-0 rounded-full" />
            ))}
          </div>
        </div>

        {/* 3. Autos Deportivos Corriendo */}

        {/* AUTO 1: Carro Deportivo Rojo GT (Carril Superior) */}
        <div className="absolute top-6 left-0 animate-car-fast will-change-transform pointer-events-none">
          <div className="relative w-72 h-20 flex items-center">
            {/* Estela de luz roja trasera / rastro de velocidad */}
            <div className="absolute -left-48 top-6 w-52 h-4 bg-gradient-to-l from-red-600 via-red-500/40 to-transparent blur-sm rounded-full animate-trail" />
            <div className="absolute -left-64 top-8 w-68 h-2 bg-gradient-to-l from-rose-500 via-red-600/20 to-transparent blur-xs rounded-full" />

            {/* Silueta Vectorial del Superdeportivo Rojo */}
            <svg viewBox="0 0 240 70" className="w-60 h-16 drop-shadow-[0_4px_12px_rgba(239,68,68,0.4)]">
              <defs>
                <linearGradient id="bodyRed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7f1d1d" />
                  <stop offset="40%" stopColor="#dc2626" />
                  <stop offset="70%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="glassDark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
              </defs>

              {/* Sombra bajo el auto */}
              <ellipse cx="120" cy="62" rx="100" ry="6" fill="#000000" opacity="0.75" />

              {/* Chasis aerodinámico */}
              <path
                d="M 15 50 Q 25 48 45 48 L 70 38 Q 95 24 135 24 L 175 36 Q 205 38 225 45 Q 235 48 238 52 L 230 55 Q 215 56 195 56 L 50 56 Q 25 56 15 50 Z"
                fill="url(#bodyRed)"
              />

              {/* Techo y cabina deportiva con parabrisas tintado */}
              <path
                d="M 80 38 L 105 26 Q 130 25 155 26 L 172 38 Z"
                fill="url(#glassDark)"
                stroke="#475569"
                strokeWidth="1"
              />

              {/* Alerón trasero deportivo */}
              <path d="M 18 36 L 36 34 L 38 38 L 22 40 Z" fill="#b91c1c" />
              <line x1="26" y1="40" x2="26" y2="48" stroke="#1e293b" strokeWidth="2.5" />

              {/* Luz trasera roja brillante (LED) */}
              <rect x="15" y="46" width="8" height="5" rx="2" fill="#ff1744" filter="drop-shadow(0 0 6px #ff1744)" />

              {/* Faro delantero xenón/LED con haz de luz proyectado */}
              <polygon points="230,46 238,48 234,51" fill="#e2e8f0" filter="drop-shadow(0 0 8px #ffffff)" />

              {/* Ruedas deportivas con rines de aleación */}
              <g transform="translate(62, 54)">
                <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                <circle cx="0" cy="0" r="7" fill="#64748b" opacity="0.8" />
                <circle cx="0" cy="0" r="3" fill="#cbd5e1" />
              </g>

              <g transform="translate(182, 54)">
                <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                <circle cx="0" cy="0" r="7" fill="#64748b" opacity="0.8" />
                <circle cx="0" cy="0" r="3" fill="#cbd5e1" />
              </g>
            </svg>

            {/* Haz de luz de los faros hacia adelante */}
            <div className="absolute left-[236px] top-4 w-64 h-12 bg-gradient-to-r from-white/20 via-cyan-300/10 to-transparent blur-md pointer-events-none -rotate-2" />
          </div>
        </div>

        {/* AUTO 2: Hiperdeportivo Platino / Naranja Aerodinámico (Carril Central - El más rápido) */}
        <div className="absolute top-24 left-0 animate-car-hyper will-change-transform pointer-events-none">
          <div className="relative w-80 h-24 flex items-center">
            {/* Rastro de velocidad de alta potencia */}
            <div className="absolute -left-64 top-8 w-72 h-4 bg-gradient-to-l from-amber-500 via-amber-600/30 to-transparent blur-sm rounded-full animate-trail" />
            <div className="absolute -left-80 top-10 w-96 h-2 bg-gradient-to-l from-orange-600 via-rose-600/20 to-transparent blur-xs rounded-full" />

            {/* Silueta del Hipercar */}
            <svg viewBox="0 0 260 80" className="w-72 h-20 drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]">
              <defs>
                <linearGradient id="bodySilver" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="35%" stopColor="#475569" />
                  <stop offset="65%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
              </defs>

              {/* Sombra */}
              <ellipse cx="130" cy="70" rx="115" ry="6" fill="#000000" opacity="0.85" />

              {/* Carrocería Super Baja (Hypercar) */}
              <path
                d="M 12 56 Q 26 53 50 53 L 78 40 Q 106 23 150 23 L 195 38 Q 228 40 248 50 Q 256 54 258 58 L 250 63 Q 230 65 210 65 L 50 65 Q 22 65 12 56 Z"
                fill="url(#bodySilver)"
              />

              {/* Cabina cúpula estilo Le Mans / prototipo */}
              <path
                d="M 90 40 L 118 26 Q 145 25 170 27 L 192 40 Z"
                fill="#090d16"
                stroke="#f97316"
                strokeWidth="0.8"
              />

              {/* Luz trasera LED continua horizontal */}
              <rect x="12" y="52" width="10" height="5" rx="2" fill="#ff3d00" filter="drop-shadow(0 0 8px #ff3d00)" />

              {/* Ruedas de perfil ultrabajo */}
              <g transform="translate(68, 62)">
                <circle cx="0" cy="0" r="14" fill="#020617" stroke="#64748b" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="8" fill="#d97706" opacity="0.9" />
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
              </g>

              <g transform="translate(202, 62)">
                <circle cx="0" cy="0" r="14" fill="#020617" stroke="#64748b" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="8" fill="#d97706" opacity="0.9" />
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
              </g>

              {/* Faro láser delantero */}
              <polygon points="250,52 258,54 254,58" fill="#67e8f9" filter="drop-shadow(0 0 10px #67e8f9)" />
            </svg>

            {/* Haz de luz delantero intenso cortando la carretera */}
            <div className="absolute left-[258px] top-6 w-80 h-16 bg-gradient-to-r from-cyan-400/25 via-blue-400/10 to-transparent blur-md pointer-events-none" />
          </div>
        </div>

        {/* AUTO 3: Coupé Deportivo Muscular (Carril Inferior) */}
        <div className="absolute top-42 left-0 animate-car-chaser will-change-transform pointer-events-none">
          <div className="relative w-72 h-20 flex items-center">
            {/* Estela de luz */}
            <div className="absolute -left-44 top-6 w-48 h-3.5 bg-gradient-to-l from-rose-600 via-rose-500/30 to-transparent blur-xs rounded-full animate-trail" />

            {/* Auto Muscular */}
            <svg viewBox="0 0 230 70" className="w-56 h-16 drop-shadow-[0_4px_10px_rgba(225,29,72,0.3)]">
              <defs>
                <linearGradient id="bodyMuscle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="40%" stopColor="#334155" />
                  <stop offset="80%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
              </defs>

              <ellipse cx="115" cy="62" rx="95" ry="5" fill="#000000" opacity="0.75" />

              <path
                d="M 16 52 L 40 50 L 68 40 L 125 28 L 168 38 L 210 44 L 222 48 L 220 56 L 45 58 Z"
                fill="url(#bodyMuscle)"
              />

              <path
                d="M 75 40 L 100 30 L 140 30 L 162 40 Z"
                fill="#0b0f19"
                stroke="#64748b"
                strokeWidth="1"
              />

              <rect x="16" y="48" width="6" height="5" rx="1.5" fill="#f43f5e" filter="drop-shadow(0 0 6px #f43f5e)" />

              <g transform="translate(60, 56)">
                <circle cx="0" cy="0" r="11" fill="#020617" stroke="#475569" strokeWidth="2" />
                <circle cx="0" cy="0" r="6" fill="#94a3b8" />
              </g>

              <g transform="translate(178, 56)">
                <circle cx="0" cy="0" r="11" fill="#020617" stroke="#475569" strokeWidth="2" />
                <circle cx="0" cy="0" r="6" fill="#94a3b8" />
              </g>

              <polygon points="218,47 224,49 220,52" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
            </svg>

            {/* Haz de luz */}
            <div className="absolute left-[220px] top-6 w-56 h-12 bg-gradient-to-r from-white/20 to-transparent blur-sm pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

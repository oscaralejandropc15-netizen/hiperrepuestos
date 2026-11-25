import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import FamilycarLogo from './FamilycarLogo';
import {
  Mail,
  KeyRound,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Receipt,
  Package,
  TrendingUp,
} from 'lucide-react';

export default function AuthGate({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (onAuthSuccess) onAuthSuccess(data.session);
    } catch (err) {
      setErrorMsg(
        err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos. Verifica tus credenciales.'
          : err.message || 'Error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    {
      icon: Receipt,
      title: 'Facturación y Guías SENIAT',
      desc: 'Control correlativo automático, Factura Fiscal y Nota de Entrega listos para imprimir o exportar a PDF.',
    },
    {
      icon: TrendingUp,
      title: 'Tasa BCV en Tiempo Real',
      desc: 'Conversión multimoneda precisa entre Dólares (USD) y Bolívares (VES), con soporte para Pago Móvil y Cashea.',
    },
    {
      icon: Package,
      title: 'Inventario y Cuentas por Cobrar',
      desc: 'Catálogo estructurado por sistemas automotrices, ingreso masivo de mercancía y control de créditos.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden">
      {/* Fondo técnico sutil con brillo carmesí corporativo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(220, 38, 38, 0.18), transparent 42%), radial-gradient(circle at 82% 85%, rgba(220, 38, 38, 0.08), transparent 45%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        }}
      />

      {/* Panel izquierdo corporativo (Escritorio) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative z-10 flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo Familycar"
            className="w-11 h-11 rounded-full object-contain border border-white/15 bg-black p-0.5"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-tight text-white">
                Hiper Repuestos Familycar
              </span>
              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                POS Pro
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">RIF: J-412654489 · Charallave</p>
          </div>
        </div>

        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              Plataforma interna de mostrador y gestión
            </span>
            <h2 className="font-heading text-3xl xl:text-4xl font-bold text-white leading-tight">
              Control ágil de ventas, repuestos y facturación en un solo lugar.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Diseñado para atención rápida en mostrador, cálculo exacto en divisas y bolívares, y administración centralizada del inventario.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/25 text-red-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Hiper Repuestos Familycar C.A. · Acceso exclusivo para personal autorizado.
        </p>
      </div>

      {/* Panel derecho: Formulario de inicio de sesión */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 relative z-10 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-[#0e1422]/95 backdrop-blur-xl border border-white/[0.09] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in">
          {/* Cabecera del formulario */}
          <div className="text-center space-y-2">
            <div className="lg:hidden mb-4">
              <FamilycarLogo className="w-20 h-20 mx-auto" showText={true} lightText={true} />
            </div>
            <div className="hidden lg:flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/25 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-red-500" />
              </div>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
              Iniciar sesión
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Ingresa tus credenciales para acceder al mostrador
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendedor@familycar.com"
                  className="w-full min-h-[46px] bg-[#090d16] border border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] bg-[#090d16] border border-white/[0.12] rounded-xl pl-10 pr-11 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] mt-2 btn-gradient-red font-semibold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/[0.08] text-center">
            <p className="text-xs text-slate-500">
              Sistema de Facturación y Guías de Despacho · Charallave
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

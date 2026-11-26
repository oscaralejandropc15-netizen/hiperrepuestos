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
  Receipt,
  Package,
  TrendingUp,
  Lock,
  MapPin,
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
          ? 'Correo o contraseña incorrectos.'
          : err.message || 'Error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  };

  const quickTags = [
    { icon: Receipt, label: 'Facturación SENIAT' },
    { icon: TrendingUp, label: 'Tasa BCV' },
    { icon: Package, label: 'Inventario' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col lg:grid lg:grid-cols-12 bg-[#f1f5f9] dark:bg-[#070a11] text-slate-900 dark:text-slate-100">
      {/* Panel izquierdo limpio y sobrio (Laptop / Escritorio) */}
      <aside className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-[#0b1120] text-slate-100 flex-col justify-between p-10 xl:p-14 border-r border-slate-800">
        {/* Indicador superior discreto */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold tracking-wide text-slate-300 uppercase text-[11px]">
            Familycar · POS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            En línea
          </span>
        </div>

        {/* Centro visual despejado: Logo protagonista + título corto + 3 chips */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="inline-flex">
            <img
              src="/logo.png"
              alt="Logo Familycar"
              className="w-20 h-20 xl:w-24 xl:h-24 rounded-full object-contain border border-white/15 bg-black p-1 shadow-md"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
              Hiper Repuestos
            </p>
            <h1 className="font-heading text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Familycar C.A.
            </h1>
            <p className="text-sm xl:text-base text-slate-400 leading-relaxed">
              Sistema de facturación rápida e inventario automotriz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {quickTags.map((tag) => {
              const Icon = tag.icon;
              return (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-200"
                >
                  <Icon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{tag.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Pie compacto */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs text-slate-500 tabular-nums">
          <span>RIF: J-412654489</span>
          <span>Charallave, Edo. Miranda</span>
        </div>
      </aside>

      {/* Panel derecho: Formulario adaptable para Teléfono, Tablet y PC */}
      <main className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center px-4 py-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-[400px] space-y-5 animate-scale-in">
          {/* Logo en Teléfono y Tablet (< lg) */}
          <div className="lg:hidden">
            <FamilycarLogo className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" showText={true} lightText={false} />
          </div>

          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-white/[0.1] rounded-3xl p-5 sm:p-8 shadow-card-hover space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-[11px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  Acceso al sistema
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Charallave
                </span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight pt-1">
                Iniciar sesión
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
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
                    placeholder="usuario@familycar.com"
                    className="input-field h-12 pl-10 pr-4 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
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
                    className="input-field h-12 pl-10 pr-11 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] mt-1 btn-gradient-red font-semibold text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3.5 border-t border-slate-100 dark:border-white/[0.07] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Personal autorizado</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                J-412654489
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

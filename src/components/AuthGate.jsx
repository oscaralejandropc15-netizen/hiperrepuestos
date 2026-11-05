import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import FamilycarLogo from './FamilycarLogo';
import { 
  Mail, 
  Key, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck
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
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos. Verifica tus credenciales.' 
        : (err.message || 'Error al autenticar.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-950 font-sans">
      {/* Luces y Resplandor Neón de Fondo */}
      <div className="absolute top-1/4 -left-36 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-glow"></div>
      <div className="absolute bottom-1/4 -right-36 w-96 h-96 bg-rose-700/20 rounded-full blur-3xl pointer-events-none animate-glow" style={{ animationDelay: '3s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"></div>

      {/* Tarjeta Principal Glassmorphic */}
      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-red-950/30 z-10">
        
        {/* Logotipo Oficial */}
        <div className="mb-6">
          <FamilycarLogo className="w-28 h-28 mx-auto" showText={true} />
          
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              Acceso Seguro al Mostrador
            </span>
          </div>
        </div>

        {/* Mensaje de Alerta si los datos son incorrectos */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Formulario Estricto de Inicio de Sesión (Sin registro público) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendedor@familycar.com"
                className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-inner"
                style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-inner"
                style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-950/60 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Verificando credenciales...</span>
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Facturador</span>
              </>
            )}
          </button>
        </form>

        {/* Pie Limpio Sin Iconos Innecesarios */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Sistema de Facturación y Guías de Despacho
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  History, 
  LogOut, 
  Sun, 
  Moon, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function AppLayout({
  children,
  vista,
  setVista,
  tasaBCV,
  setTasaBCV,
  cargandoBCV,
  onActualizarBCV,
  proximoCorrelativo,
  itemsCarrito = [],
  session,
  onCerrarSesion,
  theme,
  setTheme,
  parseVenezuelanNumber
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [horaActual, setHoraActual] = useState('');

  // Reloj en tiempo real estilo Montano
  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      const opcionesHora = { hour: '2-digit', minute: '2-digit', hour12: true };
      const opcionesDia = { weekday: 'short', day: 'numeric', month: 'short' };
      const hora = ahora.toLocaleTimeString('es-VE', opcionesHora).toUpperCase();
      const dia = ahora.toLocaleDateString('es-VE', opcionesDia);
      setHoraActual(`${hora} • ${dia}`);
    };
    actualizarHora();
    const interval = setInterval(actualizarHora, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const totalItems = itemsCarrito.reduce((acc, it) => acc + (it.cantidad || 1), 0);

  const navItems = [
    {
      id: 'facturador',
      label: 'Punto de Venta',
      mobileLabel: 'Venta',
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : null,
      desc: 'Facturación y Guías'
    },
    {
      id: 'admin',
      label: 'Inventario',
      mobileLabel: 'Stock',
      icon: Package,
      desc: 'Catálogo de Repuestos'
    },
    {
      id: 'historial',
      label: 'Historial',
      mobileLabel: 'Ventas',
      icon: History,
      desc: 'Documentos Emitidos'
    }
  ];

  const handleNavClick = (id) => {
    setVista(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-dot-grid flex flex-col lg:flex-row font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-red-500 selection:text-white">

      {/* ========================================================================= */}
      {/* SIDEBAR PERSISTENTE EN COMPUTADORAS (ESTILO MONTANO SYSTEM PRO)          */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/[0.07] h-screen sticky top-0 z-40 p-5 justify-between shadow-sm">
        
        {/* Cabecera del Sidebar con Logotipo */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur-xs opacity-50"></div>
              <img
                src="/logo.png"
                alt="Logo Familycar"
                className="relative w-11 h-11 object-contain rounded-2xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-white/10 shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base text-slate-900 dark:text-white tracking-wider">
                  FAMILYCAR
                </span>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                SISTEMA POS & ERP
              </p>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="space-y-1.5 pt-2">
            <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400 px-3 pb-2">
              Módulos Principales
            </div>

            {navItems.map((item) => {
              const activo = vista === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                    activo
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs border-l-4 border-red-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      activo 
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-600 text-white shadow-xs">
                      {item.badge}
                    </span>
                  ) : activo ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar: Tarjeta del Vendedor y Cierre de Sesión */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
          
          {/* Identificación de la Tienda */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06080F]/60 border border-slate-200/60 dark:border-white/[0.05]">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
              Hiper Repuestos Familycar
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              RIF: J-412654489 • Charallave
            </p>
          </div>

          {/* Perfil del Usuario Vendedor */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#06080F] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                V
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    En línea
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {session?.user?.email?.split('@')[0] || 'Vendedor'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrarSesion}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* CONTENIDO PRINCIPAL + BARRA SUPERIOR EJECUTIVA (TOPBAR)                  */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">

        {/* TOPBAR ELEGANTE ESTILO MONTANO */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs">
          
          {/* Lado Izquierdo: Ruta actual / Logotipo en móvil */}
          <div className="flex items-center gap-3">
            
            {/* Logo en Móvil */}
            <div className="flex items-center gap-2 lg:hidden">
              <img
                src="/logo.png"
                alt="Familycar"
                className="w-8 h-8 rounded-xl object-contain border border-slate-200 dark:border-white/10"
              />
              <span className="font-heading font-black text-sm text-slate-900 dark:text-white">
                FAMILYCAR
              </span>
            </div>

            {/* Breadcrumb Ejecutivo en Desktop */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              <span className="text-red-600 font-extrabold">|</span>
              <span>PANEL DE ADMINISTRACIÓN</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-white font-extrabold">
                {vista === 'facturador' ? 'PUNTO DE VENTA' : vista === 'admin' ? 'INVENTARIO' : 'HISTORIAL DE VENTAS'}
              </span>
            </div>
          </div>

          {/* Lado Derecho: Reloj en tiempo real, Tasa BCV Oficial, Status y Tema */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Reloj y Estado "En línea" (Estilo Montano) */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {horaActual}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                En línea
              </span>
            </div>

            {/* Widget Tasa Oficial BCV con 2 decimales */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-[#06080F] border border-slate-300/80 dark:border-white/10 rounded-xl shadow-inner">
              <img src="/bcv_logo.svg" alt="BCV" className="w-4 h-4 object-contain shrink-0" />
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.01"
                  value={tasaBCV}
                  onChange={(e) => setTasaBCV(e.target.value)}
                  onBlur={() => {
                    if (tasaBCV && parseVenezuelanNumber) {
                      const n = parseVenezuelanNumber(tasaBCV);
                      if (!isNaN(n) && n > 0) setTasaBCV(n.toFixed(2));
                    }
                  }}
                  className="w-16 sm:w-20 bg-transparent text-right font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  title="Tasa oficial BCV (editable a 2 decimales)"
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 ml-1">
                  Bs.
                </span>
              </div>
              {onActualizarBCV && (
                <button
                  type="button"
                  onClick={onActualizarBCV}
                  disabled={cargandoBCV}
                  className="p-0.5 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                  title="Actualizar tasa BCV oficial del día"
                >
                  <RotateCcw className={`w-3 h-3 ${cargandoBCV ? 'animate-spin text-emerald-500' : ''}`} />
                </button>
              )}
            </div>

            {/* Correlativo de Factura / Venta */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#06080F] border border-slate-300/80 dark:border-white/10 rounded-xl text-xs font-mono font-bold">
              <span className="text-slate-400 text-[10px]">Nº:</span>
              <span className="text-red-600 dark:text-red-400 font-extrabold">{proximoCorrelativo}</span>
            </div>

            {/* Botón Cambio de Tema Claro / Oscuro */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300/80 dark:border-white/10 transition-colors cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>

            {/* Botón Salir en Móvil */}
            <button
              type="button"
              onClick={onCerrarSesion}
              className="lg:hidden p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR TÁCTIL EN TELÉFONOS (BOTTOM NAVIGATION BAR)                */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/[0.08] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const activo = vista === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                activo
                  ? 'text-red-600 dark:text-red-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${activo ? 'scale-110' : ''}`} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-red-600 text-white shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-heading">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}

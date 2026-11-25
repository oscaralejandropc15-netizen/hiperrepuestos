import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  History,
  LogOut,
  Sun,
  Moon,
  RotateCcw,
  ChevronRight,
  Receipt,
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
  parseVenezuelanNumber,
}) {
  const [horaActual, setHoraActual] = useState('');

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      const hora = ahora.toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dia = ahora.toLocaleDateString('es-VE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setHoraActual(`${hora} · ${dia}`);
    };
    actualizarHora();
    const interval = setInterval(actualizarHora, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalItems = itemsCarrito.reduce((acc, it) => acc + (parseFloat(it.cantidad) || 1), 0);

  const navItems = [
    {
      id: 'facturador',
      label: 'Punto de Venta',
      mobileLabel: 'Venta',
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : null,
      desc: 'Mostrador y facturación',
    },
    {
      id: 'admin',
      label: 'Inventario y Gestión',
      mobileLabel: 'Inventario',
      icon: Package,
      desc: 'Catálogo, compras y CxC',
    },
    {
      id: 'historial',
      label: 'Historial',
      mobileLabel: 'Historial',
      icon: History,
      desc: 'Comprobantes emitidos',
    },
  ];

  const vistaMeta = {
    facturador: { title: 'Punto de Venta', subtitle: 'Facturación rápida en mostrador' },
    admin: { title: 'Inventario y Gestión', subtitle: 'Repuestos, compras y cuentas por cobrar' },
    historial: { title: 'Historial de Ventas', subtitle: 'Consulta y reimpresión de documentos' },
  }[vista] || { title: 'Punto de Venta', subtitle: '' };

  const userName = session?.user?.email?.split('@')[0] || 'Vendedor';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-app-canvas flex flex-col lg:flex-row font-sans text-slate-900 dark:text-slate-100 antialiased overflow-x-clip">
      {/* Sidebar ejecutivo oscuro con alto contraste */}
      <aside className="no-print hidden lg:flex flex-col w-64 shrink-0 bg-[#0f172a] text-slate-100 border-r border-slate-800/80 h-screen sticky top-0 z-40 px-4 py-5 justify-between">
        <div className="space-y-6">
          {/* Marca */}
          <div className="flex items-center gap-3 px-1.5">
            <img
              src="/logo.png"
              alt="Logo Familycar"
              className="w-10 h-10 object-contain rounded-full bg-black p-0.5 border border-white/15 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base text-white tracking-tight truncate">
                  Familycar
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-600 text-white uppercase tracking-wider">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">Hiper Repuestos C.A.</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="space-y-1.5" aria-label="Navegación principal">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Menú principal
            </p>

            {navItems.map((item) => {
              const activo = vista === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVista(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                    activo
                      ? 'bg-red-600 text-white shadow-brand'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        activo
                          ? 'bg-white/20 text-white'
                          : 'bg-white/[0.06] text-slate-400 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          activo ? 'text-red-100' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  {item.badge ? (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${
                        activo ? 'bg-white text-red-700' : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del sidebar */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <p className="text-xs font-semibold text-white truncate">
              Hiper Repuestos Familycar
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
              RIF: J-412654489 · Charallave
            </p>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-heading font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] font-medium text-emerald-400">En línea</span>
                </div>
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrarSesion}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-white/[0.08] px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex items-center gap-2 lg:hidden min-w-0">
              <img
                src="/logo.png"
                alt="Familycar"
                className="w-8 h-8 rounded-full object-contain bg-black p-0.5 border border-slate-200 dark:border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-none truncate">
                  Familycar
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  {vistaMeta.title}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="font-heading font-bold text-slate-900 dark:text-white truncate">
                {vistaMeta.title}
              </span>
              {vistaMeta.subtitle && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400 truncate">
                    {vistaMeta.subtitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {horaActual && (
              <span className="hidden xl:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums mr-1">
                {horaActual}
              </span>
            )}

            {/* Tasa BCV */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-9 sm:h-10 bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl">
              <img src="/bcv_logo.svg" alt="BCV" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" />
              <label htmlFor="topbar-bcv-rate" className="sr-only">
                Tasa oficial BCV
              </label>
              <input
                id="topbar-bcv-rate"
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
                className="w-14 sm:w-20 bg-transparent text-right font-bold tabular-nums text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 focus:outline-none"
                title="Tasa oficial BCV (editable)"
              />
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Bs.
              </span>
              {onActualizarBCV && (
                <button
                  type="button"
                  onClick={() => onActualizarBCV(true)}
                  disabled={cargandoBCV}
                  aria-label="Actualizar tasa BCV"
                  title="Actualizar tasa BCV oficial"
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${cargandoBCV ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* Próximo correlativo */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 h-10 bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-white/[0.1] rounded-xl text-xs tabular-nums"
              title="Próximo número de comprobante"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Nº</span>
              <span className="text-red-600 dark:text-red-400 font-bold">{proximoCorrelativo}</span>
            </div>

            {/* Tema */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Salir móvil */}
            <button
              type="button"
              onClick={onCerrarSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom bar móvil */}
      <nav
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.08] px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg"
        aria-label="Navegación móvil"
      >
        {navItems.map((item) => {
          const activo = vista === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setVista(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                activo
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {activo && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-red-600 dark:bg-red-400" />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums bg-red-600 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 leading-tight">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

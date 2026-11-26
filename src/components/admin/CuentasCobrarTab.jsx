import React from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, X } from 'lucide-react';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../../lib/formatters';
import { getBackdropProps } from '../../lib/modalBackdrop';

export default function CuentasCobrarTab({
  cuentasCobrar,
  cargandoCxC,
  tasaBCV,
  totalDeudaPendiente,
  totalAbonado,
  abrirRegistrarAbono,
  modalAbonoAbierto,
  setModalAbonoAbierto,
  cuentaActivaAbono,
  montoAbonoUSD,
  setMontoAbonoUSD,
  metodoAbono,
  setMetodoAbono,
  guardandoAbono,
  confirmarAbono,
}) {
  const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
  const clientesDeudores = cuentasCobrar.filter((c) => c.estado !== 'pagado').length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="surface-card p-4 sm:p-5 space-y-1 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Deuda pendiente
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatUSD(totalDeudaPendiente)}
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {formatVES(totalDeudaPendiente * tasaNum)}
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5 space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Total recuperado
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatUSD(totalAbonado)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Abonos procesados</div>
        </div>

        <div className="surface-card p-4 sm:p-5 space-y-1 border-l-4 border-l-slate-400 dark:border-l-slate-600">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Créditos activos
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {clientesDeudores}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Clientes con saldo</div>
        </div>
      </div>

      {/* Tabla escritorio + Cards móviles */}
      <div className="surface-card overflow-hidden">
        {cargandoCxC ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Cargando cuentas por cobrar...
          </div>
        ) : cuentasCobrar.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No hay cuentas por cobrar registradas.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-[#090d16] border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-3 py-3">Cédula / RIF</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3 text-right">Total venta</th>
                    <th className="px-3 py-3 text-right">Abonado</th>
                    <th className="px-3 py-3 text-right">Saldo pendiente</th>
                    <th className="px-3 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {cuentasCobrar.map((c) => {
                    const saldo = parseFloat(c.saldo_pendiente_usd) || 0;
                    const esPagado = c.estado === 'pagado' || saldo <= 0.01;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {c.cliente_nombre || 'Cliente sin nombre'}
                          </div>
                          {c.cliente_telefono && (
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {c.cliente_telefono}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {c.cliente_cedula_rif || '—'}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500 whitespace-nowrap">
                          {c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString('es-VE') : '—'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">
                          {formatUSD(c.monto_total_usd || 0)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatUSD(c.monto_abonado_usd || 0)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                          {formatUSD(saldo)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              esPagado
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                            }`}
                          >
                            {esPagado ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {!esPagado && (
                            <button
                              type="button"
                              onClick={() => abrirRegistrarAbono(c)}
                              className="px-3 py-1.5 btn-gradient-emerald text-[11px] font-semibold"
                            >
                              Registrar abono
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards para Teléfono (1 col) y Tablet (2 cols) */}
            <div className="lg:hidden p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {cuentasCobrar.map((c) => {
                const saldo = parseFloat(c.saldo_pendiente_usd) || 0;
                const esPagado = c.estado === 'pagado' || saldo <= 0.01;

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#090d16] border border-slate-200 dark:border-white/[0.08] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {c.cliente_nombre || 'Cliente sin nombre'}
                        </p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {c.cliente_cedula_rif || '—'}
                          {c.cliente_telefono ? ` · ${c.cliente_telefono}` : ''}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                          esPagado
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        }`}
                      >
                        {esPagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-end justify-between pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                      <div className="font-mono text-xs space-y-0.5">
                        <div className="text-slate-500 dark:text-slate-400">
                          Total: {formatUSD(c.monto_total_usd || 0)} · Abonado:{' '}
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {formatUSD(c.monto_abonado_usd || 0)}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          Saldo: {formatUSD(saldo)}
                        </div>
                      </div>

                      {!esPagado && (
                        <button
                          type="button"
                          onClick={() => abrirRegistrarAbono(c)}
                          className="min-h-[38px] px-3 py-1.5 btn-gradient-emerald text-xs font-semibold"
                        >
                          Abonar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal para registrar abono */}
      {modalAbonoAbierto &&
        cuentaActivaAbono &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            {...getBackdropProps(() => setModalAbonoAbierto(false))}
            className="fixed inset-0 z-[9999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Registrar abono</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAbonoAbierto(false)}
                  aria-label="Cerrar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 surface-muted text-xs space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {cuentaActivaAbono.cliente_nombre}
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  Cédula / RIF: {cuentaActivaAbono.cliente_cedula_rif || 'S/N'}
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-white/10 font-mono">
                  <span className="text-slate-500">Saldo pendiente:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {formatUSD(cuentaActivaAbono.saldo_pendiente_usd)}
                  </span>
                </div>
              </div>

              <form onSubmit={confirmarAbono} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Monto del abono ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={cuentaActivaAbono.saldo_pendiente_usd}
                    required
                    value={montoAbonoUSD}
                    onChange={(e) => setMontoAbonoUSD(e.target.value)}
                    placeholder="25.00"
                    className="input-field h-11 px-3.5 font-mono font-bold text-base text-emerald-700 dark:text-emerald-300"
                  />
                  {montoAbonoUSD > 0 && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                      Equivalente: {formatVES(parseFloat(montoAbonoUSD) * tasaNum)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Forma de recepción
                  </label>
                  <select
                    value={metodoAbono}
                    onChange={(e) => setMetodoAbono(e.target.value)}
                    className="input-field h-10 px-3 font-semibold cursor-pointer"
                  >
                    <option value="EFECTIVO">Efectivo ($ Divisa / Bs.)</option>
                    <option value="PAGO_MOVIL">Pago Móvil / Transferencia</option>
                    <option value="PUNTO">Punto de Venta</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAbonoAbierto(false)}
                    className="min-h-[42px] px-4 py-2 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoAbono}
                    className="min-h-[42px] px-5 py-2 btn-gradient-emerald text-xs font-semibold"
                  >
                    {guardandoAbono ? 'Registrando...' : 'Confirmar abono'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

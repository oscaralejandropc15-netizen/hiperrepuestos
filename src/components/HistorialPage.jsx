import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getHistorialCached, invalidateHistorialCache } from '../lib/queryCache';
import { formatUSD, formatVES, formatDate } from '../lib/formatters';
import {
  Search,
  RotateCcw,
  Eye,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Receipt,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import PaginationBar from './ui/PaginationBar';
import ConfirmModal from './ui/ConfirmModal';
import ToastNotification from './ui/ToastNotification';

export default function HistorialPage({ onVolverAlFacturador, onVerGuia, onGuiaEliminada }) {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [guiaAEliminar, setGuiaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [limiteCarga, setLimiteCarga] = useState(100);

  const cargarGuias = async (force = false, nextLimit = limiteCarga) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistorialCached({ force, limit: nextLimit });
      setGuias(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGuias(false, 100);
  }, []);

  const confirmarEliminacion = async () => {
    if (!guiaAEliminar) return;
    setEliminando(true);
    setError(null);

    try {
      const { error: itemsErr } = await supabase
        .from('items_guia')
        .delete()
        .eq('guia_id', guiaAEliminar.id);

      if (itemsErr) console.warn('Aviso al eliminar renglones:', itemsErr);

      const { data, error: guiaErr } = await supabase
        .from('guias_despacho')
        .delete()
        .eq('id', guiaAEliminar.id)
        .select();

      if (guiaErr) throw guiaErr;

      if (!data || data.length === 0) {
        throw new Error(
          'No se pudo eliminar el comprobante (0 filas afectadas). Verifica las políticas RLS de DELETE en Supabase.'
        );
      }

      setGuias((prev) => prev.filter((g) => g.id !== guiaAEliminar.id));
      invalidateHistorialCache();
      setSuccessMsg(`Comprobante ${guiaAEliminar.codigo_guia} eliminado correctamente.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setGuiaAEliminar(null);
      onGuiaEliminada?.();
    } catch (err) {
      console.error('Error al eliminar factura:', err);
      setError(err.message || 'No se pudo eliminar el comprobante.');
    } finally {
      setEliminando(false);
    }
  };

  const guiasFiltradas = useMemo(() => {
    const ahora = new Date();
    const term = busqueda.toLowerCase().trim();

    return guias.filter((g) => {
      const codigo = (g.codigo_guia || '').toLowerCase();
      const numero = String(g.numero_guia || '');
      const numClean = codigo.replace(/^gd-/, '');
      const cliente = (g.cliente_nombre || '').toLowerCase();
      const doc = (g.cliente_documento || '').toLowerCase();

      const coincideTexto =
        !term ||
        codigo.includes(term) ||
        numero.includes(term) ||
        numClean.includes(term) ||
        cliente.includes(term) ||
        doc.includes(term);

      if (!coincideTexto) return false;
      if (filtroFecha === 'todas') return true;

      const fechaGuia = new Date(g.fecha);
      if (filtroFecha === 'hoy') {
        return (
          fechaGuia.getDate() === ahora.getDate() &&
          fechaGuia.getMonth() === ahora.getMonth() &&
          fechaGuia.getFullYear() === ahora.getFullYear()
        );
      }
      if (filtroFecha === 'semana') {
        const hace7Dias = new Date();
        hace7Dias.setDate(ahora.getDate() - 7);
        return fechaGuia >= hace7Dias;
      }
      if (filtroFecha === 'mes') {
        return (
          fechaGuia.getMonth() === ahora.getMonth() &&
          fechaGuia.getFullYear() === ahora.getFullYear()
        );
      }
      return true;
    });
  }, [guias, busqueda, filtroFecha]);

  const totalGuias = guiasFiltradas.length;
  const totalPaginas = Math.ceil(totalGuias / porPagina) || 1;
  const indexInicio = (paginaActual - 1) * porPagina;
  const guiasPaginadas = guiasFiltradas.slice(indexInicio, indexInicio + porPagina);

  const totalMontoUSD = guiasFiltradas.reduce(
    (acc, g) => acc + (parseFloat(g.total_usd) || 0),
    0
  );
  const totalMontoBs = guiasFiltradas.reduce((acc, g) => acc + (parseFloat(g.total_bs) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 animate-fade-in">
      <ToastNotification notification={successMsg} onClose={() => setSuccessMsg(null)} />

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera */}
      <div className="surface-card p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolverAlFacturador}
            aria-label="Regresar al punto de venta"
            className="w-10 h-10 flex items-center justify-center btn-secondary shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Historial de Facturas y Notas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consulta, filtra y reimprime comprobantes emitidos en mostrador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {guias.length >= limiteCarga && limiteCarga < 1000 && (
            <button
              type="button"
              onClick={() => {
                setLimiteCarga(1000);
                cargarGuias(false, 1000);
              }}
              disabled={loading}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 btn-secondary text-xs"
            >
              <span>Cargar anteriores</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => cargarGuias(true, limiteCarga)}
            disabled={loading}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 btn-secondary text-xs"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Actualizar lista</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="surface-card p-4 sm:p-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Comprobantes filtrados
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalGuias}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5 flex items-center justify-between gap-3 border-l-4 border-l-red-600">
          <div>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">
              Total facturado (USD)
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {formatUSD(totalMontoUSD)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5 flex items-center justify-between gap-3 border-l-4 border-l-emerald-600">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Total en Bolívares
            </span>
            <div className="font-heading text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums truncate">
              {formatVES(totalMontoBs)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por número de factura, cliente o cédula/RIF..."
              className="input-field h-11 pl-10 pr-4 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-100 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08]">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Últimos 7 días' },
              { id: 'mes', label: 'Este mes' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltroFecha(f.id);
                  setPaginaActual(1);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filtroFecha === f.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla escritorio + Cards móvil */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
            Cargando historial de ventas...
          </div>
        ) : guiasPaginadas.length === 0 ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
            No se encontraron comprobantes con los filtros aplicados.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#090d16] border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Comprobante</th>
                    <th className="py-3.5 px-4">Fecha y hora</th>
                    <th className="py-3.5 px-4">Cliente / Razón Social</th>
                    <th className="py-3.5 px-4 text-center">Ítems</th>
                    <th className="py-3.5 px-4 text-right">Total USD</th>
                    <th className="py-3.5 px-4 text-right">Total Bs.</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {guiasPaginadas.map((guia) => {
                    const numDoc =
                      (guia.codigo_guia || '').replace(/^GD-/, '') ||
                      String(guia.numero_guia || '').padStart(6, '0');
                    const esNota =
                      guia.tipo_documento === 'nota_entrega' ||
                      guia.forma_pago === 'EFECTIVO' ||
                      guia.forma_pago === 'CREDITO_TIENDA';

                    return (
                      <tr
                        key={guia.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block font-bold px-2.5 py-0.5 rounded-lg text-xs tabular-nums ${
                              esNota
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                            }`}
                          >
                            {esNota ? 'NOTA' : 'FACTURA'} Nº {numDoc}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            Control: 00-{numDoc}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs tabular-nums whitespace-nowrap">
                          {formatDate(guia.fecha)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {guia.cliente_nombre}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {guia.cliente_documento}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center tabular-nums">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {guia.items?.length || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatUSD(guia.total_usd)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatVES(guia.total_bs)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => onVerGuia(guia)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary text-xs min-h-[36px]"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGuiaAEliminar(guia);
                                setError(null);
                              }}
                              aria-label="Eliminar comprobante"
                              className="w-9 h-9 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas Móvil */}
            <div className="md:hidden p-3 space-y-3">
              {guiasPaginadas.map((guia) => {
                const numDoc =
                  (guia.codigo_guia || '').replace(/^GD-/, '') ||
                  String(guia.numero_guia || '').padStart(6, '0');
                return (
                  <div key={guia.id} className="surface-muted p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-2.5 py-0.5 rounded-lg text-xs tabular-nums">
                        Nº {numDoc}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatDate(guia.fecha)}
                      </span>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {guia.cliente_nombre}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {guia.cliente_documento}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                      <div className="tabular-nums">
                        <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 block">
                          {formatVES(guia.total_bs)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatUSD(guia.total_usd)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onVerGuia(guia)}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGuiaAEliminar(guia);
                            setError(null);
                          }}
                          aria-label="Eliminar comprobante"
                          className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <PaginationBar
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={totalGuias}
        itemsPorPagina={porPagina}
        onChangePagina={setPaginaActual}
        onChangeItemsPorPagina={setPorPagina}
        opcionesItemsPorPagina={[5, 10, 20, 50]}
        etiquetaItem="comprobantes"
      />

      <ConfirmModal
        open={!!guiaAEliminar}
        title="¿Eliminar este comprobante?"
        description="Esta acción eliminará permanentemente el registro de la base de datos."
        details={
          guiaAEliminar
            ? [
                { label: 'Comprobante', value: guiaAEliminar.codigo_guia },
                { label: 'Cliente', value: guiaAEliminar.cliente_nombre },
                { label: 'Total USD', value: formatUSD(guiaAEliminar.total_usd) },
              ]
            : []
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setGuiaAEliminar(null)}
      />
    </div>
  );
}

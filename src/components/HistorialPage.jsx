import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatUSD, formatVES, formatDate } from '../lib/formatters';
import { 
  Search, 
  RotateCcw, 
  Eye, 
  Trash2, 
  Calendar, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react';

export default function HistorialPage({ onVolverAlFacturador, onVerGuia }) {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todas'); // 'todas', 'hoy', 'semana', 'mes'

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // Modal de confirmación para eliminar
  const [guiaAEliminar, setGuiaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar guías desde Supabase
  const cargarGuias = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('guias_despacho')
        .select(`
          *,
          items:items_guia(*)
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setGuias(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGuias();
  }, []);

  // Eliminar guía seleccionada
  const confirmarEliminacion = async () => {
    if (!guiaAEliminar) return;
    setEliminando(true);
    setError(null);

    try {
      // 1. Eliminar primero los ítems asociados en items_guia
      const { error: itemsErr } = await supabase
        .from('items_guia')
        .delete()
        .eq('guia_id', guiaAEliminar.id);

      if (itemsErr) {
        console.warn('Aviso al eliminar renglones:', itemsErr);
      }

      // 2. Eliminar la cabecera en guias_despacho y verificar retorno con .select()
      const { data, error: guiaErr } = await supabase
        .from('guias_despacho')
        .delete()
        .eq('id', guiaAEliminar.id)
        .select();

      if (guiaErr) throw guiaErr;

      // 3. Si PostgreSQL no devolvió ninguna fila eliminada (bloqueado por políticas RLS)
      if (!data || data.length === 0) {
        throw new Error(
          'Supabase no eliminó la factura (0 filas afectadas). Esto ocurre porque falta la política RLS de DELETE en Supabase.'
        );
      }

      // 4. Actualizar estado local solo si la base de datos realmente la eliminó
      setGuias(prev => prev.filter(g => g.id !== guiaAEliminar.id));
      setSuccessMsg(`La factura ${guiaAEliminar.codigo_guia} fue eliminada permanentemente.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setGuiaAEliminar(null);
    } catch (err) {
      console.error('Error al eliminar factura:', err);
      setError(err.message || 'No se pudo eliminar la guía. Verifica tus permisos RLS en Supabase.');
    } finally {
      setEliminando(false);
    }
  };

  // Filtrado de guías en memoria
  const ahora = new Date();
  const guiasFiltradas = guias.filter((g) => {
    // 1. Filtro por texto
    const term = busqueda.toLowerCase().trim();
    const codigo = (g.codigo_guia || '').toLowerCase();
    const numero = String(g.numero_guia || '');
    const numClean = codigo.replace(/^gd-/, '');
    const cliente = (g.cliente_nombre || '').toLowerCase();
    const doc = (g.cliente_documento || '').toLowerCase();
    const coincideTexto = !term || codigo.includes(term) || numero.includes(term) || numClean.includes(term) || cliente.includes(term) || doc.includes(term);

    if (!coincideTexto) return false;

    // 2. Filtro por fecha
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

  // Cálculos de Paginación
  const totalGuias = guiasFiltradas.length;
  const totalPaginas = Math.ceil(totalGuias / porPagina) || 1;
  const indexInicio = (paginaActual - 1) * porPagina;
  const guiasPaginadas = guiasFiltradas.slice(indexInicio, indexInicio + porPagina);

  // Métricas rápidas de las guías filtradas
  const totalMontoUSD = guiasFiltradas.reduce((acc, g) => acc + (parseFloat(g.total_usd) || 0), 0);
  const totalMontoBs = guiasFiltradas.reduce((acc, g) => acc + (parseFloat(g.total_bs) || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6 animate-slide-up pb-12 font-sans">
      {/* Mensajes Flotantes */}
      {successMsg && (
        <div className="bg-[#0B1A14]/90 border border-emerald-500/50 backdrop-blur-xl text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Barra Superior con Botón de Regreso y Título */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-3xl">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onVolverAlFacturador}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-2xl transition-all active:scale-95 cursor-pointer"
            title="Regresar al Facturador de mostrador"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white font-heading tracking-wide">
              HISTORIAL Y GESTIÓN DE FACTURAS
            </h1>
            <p className="text-xs text-slate-400 tracking-wide mt-0.5">
              Consulta, filtra, reimprime o audita comprobantes emitidos
            </p>
          </div>
        </div>

        <button
          onClick={cargarGuias}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl text-xs font-bold transition-all active:scale-95 min-h-[44px] cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* 2. Tarjetas de Resumen / KPIs Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block font-heading">
            Facturas Registradas
          </span>
          <div className="text-3xl font-black font-mono text-white mt-1.5">
            {totalGuias}
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl relative overflow-hidden group border-t-2 border-t-rose-500/80">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block font-heading">
            Total Facturado (USD)
          </span>
          <div className="text-3xl font-black font-mono text-white mt-1.5 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {formatUSD(totalMontoUSD)}
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl relative overflow-hidden group border-t-2 border-t-emerald-500/80">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block font-heading">
            Total Oficial (Bolívares)
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1.5 truncate drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            {formatVES(totalMontoBs)}
          </div>
        </div>
      </div>

      {/* 3. Panel de Búsqueda y Filtros */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3.5">
          {/* Buscador de texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por número de factura (ej: 000001), cliente o cédula/RIF..."
              className="w-full input-cockpit rounded-2xl pl-11 pr-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 min-h-[46px]"
            />
          </div>

          {/* Filtros rápidos por fecha */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 bg-[#06080F]/90 p-1 rounded-2xl border border-white/[0.08]">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Últimos 7 días' },
              { id: 'mes', label: 'Este Mes' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltroFecha(f.id);
                  setPaginaActual(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 min-h-[38px] cursor-pointer ${
                  filtroFecha === f.id
                    ? 'btn-gradient-red text-white scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Tabla de Guías con Paginación */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm font-medium">
            Cargando historial de facturación...
          </div>
        ) : guiasPaginadas.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-sm font-medium">
            No se encontraron guías con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#0B0F19]/90 border-b border-white/[0.08] text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-heading">
                  <th className="py-3.5 px-4">Factura / Control</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Cliente / Razón Social</th>
                  <th className="py-3.5 px-4 text-center">Renglones</th>
                  <th className="py-3.5 px-4 text-right">Total ($ USD)</th>
                  <th className="py-3.5 px-4 text-right">Total (Bs.)</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {guiasPaginadas.map((guia) => (
                  <tr key={guia.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-black text-rose-300 bg-rose-600/15 border border-rose-500/30 px-2.5 py-0.5 rounded-lg text-xs shadow-sm">
                          FACTURA Nº {(guia.codigo_guia || '').replace(/^GD-/, '') || String(guia.numero_guia || '').padStart(6, '0')}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          Control: 00-{(guia.codigo_guia || '').replace(/^GD-/, '') || String(guia.numero_guia || '').padStart(6, '0')}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                      {formatDate(guia.fecha)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white tracking-wide">{guia.cliente_nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{guia.cliente_documento}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        {guia.items?.length || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-white">
                      {formatUSD(guia.total_usd)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400">
                      {formatVES(guia.total_bs)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onVerGuia(guia)}
                          title="Ver y reimprimir guía"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.08] hover:border-emerald-500/30 rounded-xl text-xs font-bold transition-all min-h-[36px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>

                        <button
                          onClick={() => {
                            setGuiaAEliminar(guia);
                            setError(null);
                          }}
                          title="Eliminar guía"
                          className="p-2 bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/30 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Controles de Paginación */}
        <div className="p-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={porPagina}
              onChange={(e) => {
                setPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="bg-[#06080F] border border-white/[0.1] rounded-xl px-2.5 py-1 text-white font-mono focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>por página (Total: {totalGuias} guías)</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono font-bold text-white">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              title="Página Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {guiaAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-slide-up">
          <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">¿Eliminar esta Factura?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="bg-[#06080F] p-4 rounded-2xl border border-white/[0.06] text-xs space-y-1.5">
              <p><strong>Comprobante:</strong> <span className="font-mono text-rose-400 font-bold">{guiaAEliminar.codigo_guia}</span></p>
              <p><strong>Cliente:</strong> {guiaAEliminar.cliente_nombre} ({guiaAEliminar.cliente_documento})</p>
              <p><strong>Monto Total:</strong> {formatUSD(guiaAEliminar.total_usd)} ({formatVES(guiaAEliminar.total_bs)})</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setGuiaAEliminar(null);
                  setError(null);
                }}
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50 cursor-pointer"
              >
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

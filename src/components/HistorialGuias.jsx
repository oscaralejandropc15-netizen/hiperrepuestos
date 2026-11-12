import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { formatUSD, formatVES, formatDate } from '../lib/formatters';
import { Search, RotateCcw, Eye, X, FileText, AlertCircle } from 'lucide-react';

export default function HistorialGuias({ onSelectGuia, onClose }) {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState(null);

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
        .order('fecha', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGuias(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGuias();
  }, []);

  const guiasFiltradas = guias.filter((g) => {
    const term = filtro.toLowerCase();
    const codigo = (g.codigo_guia || '').toLowerCase();
    const cliente = (g.cliente_nombre || '').toLowerCase();
    const doc = (g.cliente_documento || '').toLowerCase();
    return codigo.includes(term) || cliente.includes(term) || doc.includes(term);
  });

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-red-600/15 border border-red-500/30 text-red-400 rounded-xl flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Historial de Guías de Despacho
              </h3>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Consulta y reimprime comprobantes emitidos en Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador Adaptativo */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por código, cliente o cédula/RIF..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 min-h-[44px]"
            />
          </div>
          <button
            onClick={cargarGuias}
            title="Recargar"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido / Lista */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {error && (
            <div className="p-3 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Cargando historial de guías...
            </div>
          ) : guiasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No se encontraron guías registradas.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden">
              {guiasFiltradas.map((guia) => (
                <div
                  key={guia.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-red-400 text-sm bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                        {guia.codigo_guia}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(guia.fecha)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      {guia.cliente_nombre} <span className="text-xs font-mono text-slate-400 font-normal">({guia.cliente_documento})</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {guia.items?.length || 0} renglón(es) • Tasa: {guia.tasa_bcv} Bs/$
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-none border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <div className="font-mono font-black text-white text-base">
                        {formatUSD(guia.total_usd)}
                      </div>
                      <div className="font-mono text-xs text-emerald-400">
                        {formatVES(guia.total_bs)}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectGuia(guia)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors min-h-[40px]"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Ver / Reimprimir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

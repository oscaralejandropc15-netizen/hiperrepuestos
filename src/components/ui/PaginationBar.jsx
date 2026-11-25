import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Control de paginación unificado y adaptable a móvil/escritorio.
 */
export default function PaginationBar({
  paginaActual,
  totalPaginas,
  totalItems,
  itemsPorPagina,
  onChangePagina,
  onChangeItemsPorPagina,
  opcionesItemsPorPagina = [12, 24, 48, 'todos'],
  etiquetaItem = 'registros'
}) {
  if (totalItems === 0) return null;

  const esTodos = itemsPorPagina === 'todos';
  const numPorPagina = esTodos ? totalItems : parseInt(itemsPorPagina, 10) || 24;
  const inicio = esTodos ? 1 : Math.min((paginaActual - 1) * numPorPagina + 1, totalItems);
  const fin = esTodos ? totalItems : Math.min(paginaActual * numPorPagina, totalItems);

  const generarPaginas = () => {
    if (totalPaginas <= 5) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const paginas = [1];
    if (paginaActual > 3) paginas.push('...');
    const start = Math.max(2, paginaActual - 1);
    const end = Math.min(totalPaginas - 1, paginaActual + 1);
    for (let i = start; i <= end; i++) paginas.push(i);
    if (paginaActual < totalPaginas - 2) paginas.push('...');
    paginas.push(totalPaginas);
    return paginas;
  };

  const paginasMostradas = generarPaginas();

  return (
    <div className="surface-card p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      <div className="text-slate-600 dark:text-slate-400 font-medium">
        Mostrando{' '}
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {inicio}–{fin}
        </span>{' '}
        de{' '}
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {totalItems}
        </span>{' '}
        {etiquetaItem}
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onChangePagina(1)}
          disabled={paginaActual <= 1 || esTodos}
          aria-label="Primera página"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangePagina(Math.max(1, paginaActual - 1))}
          disabled={paginaActual <= 1 || esTodos}
          aria-label="Página anterior"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-0.5">
          {esTodos ? (
            <span className="px-3 py-1.5 rounded-xl font-mono font-bold bg-red-600 text-white">
              Todos
            </span>
          ) : (
            paginasMostradas.map((num, idx) =>
              num === '...' ? (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 select-none">
                  …
                </span>
              ) : (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChangePagina(num)}
                  className={`min-w-[36px] h-9 px-2 rounded-xl font-mono font-bold transition-colors cursor-pointer ${num === paginaActual
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                >
                  {num}
                </button>
              )
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onChangePagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual >= totalPaginas || esTodos}
          aria-label="Página siguiente"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangePagina(totalPaginas)}
          disabled={paginaActual >= totalPaginas || esTodos}
          aria-label="Última página"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {onChangeItemsPorPagina && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Por página:</span>
          <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-100 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {opcionesItemsPorPagina.map((opcion) => {
              const activa = itemsPorPagina === opcion;
              return (
                <button
                  key={String(opcion)}
                  type="button"
                  onClick={() => {
                    onChangeItemsPorPagina(opcion);
                    onChangePagina(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${activa
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {opcion === 'todos' ? 'Todos' : opcion}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

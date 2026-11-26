import React from 'react';
import {
  Layers,
  Tag,
  Car,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { obtenerMarcaVehiculo, extraerMarcaYModeloDeTexto } from '../../lib/vehiculosMarcas';
import PaginationBar from '../ui/PaginationBar';

export default function ClasificacionesTab({
  tabActiva,
  setTabActiva,
  lineasFiltradas,
  busquedaLineas,
  setBusquedaLineas,
  inputTabNuevaLinea,
  setInputTabNuevaLinea,
  inputLineaRef,
  lineaActivaMaster,
  setLineaActivaMaster,
  conteoPorLinea,
  agregarNuevaLinea,
  sublineasParaMaster,
  busquedaSublineas,
  setBusquedaSublineas,
  inputTabNuevaSublinea,
  setInputTabNuevaSublinea,
  inputSublineaRef,
  conteoPorSublinea,
  agregarNuevaSublinea,
  marcasFiltradas,
  marcasPaginadas,
  busquedaMarcas,
  setBusquedaMarcas,
  inputTabNuevaMarca,
  setInputTabNuevaMarca,
  inputMarcaRef,
  conteoPorMarca,
  agregarNuevaMarca,
  paginaMarcas,
  totalPaginasMarcas,
  itemsPorPaginaMarcas,
  setPaginaMarcas,
  setItemsPorPaginaMarcas,
  modelosFiltrados,
  modelosPaginados,
  busquedaModelos,
  setBusquedaModelos,
  inputTabNuevoModelo,
  setInputTabNuevoModelo,
  inputModeloRef,
  conteoPorModelo,
  agregarNuevoModelo,
  paginaModelos,
  totalPaginasModelos,
  itemsPorPaginaModelos,
  setPaginaModelos,
  setItemsPorPaginaModelos,
  ultimoItemCreado,
  setModalRapido,
  abrirModalEditar,
  abrirModalConfirmarEliminar,
  setFiltroLineaInv,
  setFiltroSublineaInv,
  setFiltroMarcaInv,
  setFiltroTexto,
}) {
  if (tabActiva === 'lineas' || tabActiva === 'clasificaciones') {
    return (
      <div className="space-y-4">
        <div className="surface-card p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Sistemas y Líneas Automotrices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona una línea para gestionar sus piezas específicas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Líneas principales */}
          <div className="lg:col-span-5 surface-card p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Sistemas principales ({lineasFiltradas.length})
              </h3>
              <span className="text-xs text-slate-400">Líneas</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busquedaLineas}
                onChange={(e) => setBusquedaLineas(e.target.value)}
                placeholder="Buscar sistema (ej. Frenos, Motor)..."
                className="input-field h-10 pl-9 pr-8"
              />
              {busquedaLineas && (
                <button
                  type="button"
                  onClick={() => setBusquedaLineas('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = inputTabNuevaLinea.trim();
                if (!val) {
                  setModalRapido({ abierto: true, tipo: 'linea', valor: '', lineaPadre: '' });
                  return;
                }
                const res = agregarNuevaLinea(val);
                setInputTabNuevaLinea('');
                if (res) setLineaActivaMaster(res);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputLineaRef}
                type="text"
                value={inputTabNuevaLinea}
                onChange={(e) => setInputTabNuevaLinea(e.target.value)}
                placeholder="Registrar nueva línea..."
                className="input-field h-10 px-3 flex-1"
              />
              <button
                type="submit"
                className="h-10 px-3.5 btn-primary text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {lineasFiltradas.length > 0 ? (
                lineasFiltradas.map((linea) => {
                  const count = conteoPorLinea[linea] || 0;
                  const isSelected =
                    (lineaActivaMaster || 'Tren Delantero y Dirección').toLowerCase() ===
                    linea.toLowerCase();
                  const isRecienCreada =
                    ultimoItemCreado?.tipo === 'linea' &&
                    ultimoItemCreado?.valor?.toLowerCase() === linea.toLowerCase();

                  return (
                    <div
                      key={linea}
                      onClick={() => setLineaActivaMaster(linea)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-50/70 dark:bg-red-500/10 ring-1 ring-red-500/20'
                          : 'border-slate-200 dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isSelected
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                            title={linea}
                          >
                            {linea}
                          </p>
                          {isRecienCreada && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white">
                              Nueva
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                          {count}
                        </span>
                        <button
                          type="button"
                          title={`Editar "${linea}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEditar('linea', linea, '', count);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title={`Eliminar "${linea}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalConfirmarEliminar('linea', linea, '', count);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isSelected ? 'text-red-600' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center surface-muted px-4 space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No se encontró ningún sistema con «{busquedaLineas}».
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const res = agregarNuevaLinea(busquedaLineas.trim());
                      if (res) setLineaActivaMaster(res);
                      setBusquedaLineas('');
                    }}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    + Crear «{busquedaLineas.trim()}»
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sublíneas / Piezas */}
          <div className="lg:col-span-7 surface-card p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Sistema seleccionado
                </span>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{lineaActivaMaster || 'Tren Delantero y Dirección'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    {sublineasParaMaster.length} piezas
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFiltroLineaInv(lineaActivaMaster || 'Tren Delantero y Dirección');
                  setFiltroSublineaInv('');
                  setTabActiva('inventario');
                }}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Ver en inventario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busquedaSublineas}
                  onChange={(e) => setBusquedaSublineas(e.target.value)}
                  placeholder="Filtrar piezas..."
                  className="input-field h-10 pl-9 pr-3"
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = inputTabNuevaSublinea.trim();
                  if (!val) {
                    setModalRapido({
                      abierto: true,
                      tipo: 'sublinea',
                      valor: '',
                      lineaPadre: lineaActivaMaster || 'Tren Delantero y Dirección',
                    });
                    return;
                  }
                  agregarNuevaSublinea(val, lineaActivaMaster);
                  setInputTabNuevaSublinea('');
                }}
                className="sm:col-span-7 flex items-center gap-2"
              >
                <input
                  ref={inputSublineaRef}
                  type="text"
                  value={inputTabNuevaSublinea}
                  onChange={(e) => setInputTabNuevaSublinea(e.target.value)}
                  placeholder={`Nueva pieza para ${lineaActivaMaster}...`}
                  className="input-field h-10 px-3 flex-1"
                />
                <button
                  type="submit"
                  className="h-10 px-3.5 btn-primary text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {sublineasParaMaster.map((sublinea) => {
                const count =
                  conteoPorSublinea[sublinea] || conteoPorSublinea[sublinea.toLowerCase()] || 0;
                const isRecienAgregada =
                  ultimoItemCreado?.tipo === 'sublinea' &&
                  ultimoItemCreado?.valor?.toLowerCase() === sublinea.toLowerCase();

                return (
                  <div
                    key={sublinea}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                      isRecienAgregada
                        ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-50/70 dark:bg-[#090d16] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug break-words">
                          {sublinea}
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                          {lineaActivaMaster}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shrink-0">
                        {count}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={`Editar "${sublinea}"`}
                          onClick={() =>
                            abrirModalEditar('sublinea', sublinea, lineaActivaMaster, count)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title={`Eliminar "${sublinea}"`}
                          onClick={() =>
                            abrirModalConfirmarEliminar(
                              'sublinea',
                              sublinea,
                              lineaActivaMaster,
                              count
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFiltroLineaInv(lineaActivaMaster);
                          setFiltroSublineaInv(sublinea);
                          setTabActiva('inventario');
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-white/[0.06] hover:bg-red-600 hover:text-white border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Ver</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tabActiva === 'marcas') {
    return (
      <div className="space-y-4">
        <div className="surface-card p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Marcas de Fabricantes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catálogo maestro de fabricantes disponibles en mostrador
            </p>
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busquedaMarcas}
                onChange={(e) => setBusquedaMarcas(e.target.value)}
                placeholder="Buscar marca (ej. Bosch, Denso, ATS)..."
                className="input-field h-10 pl-10 pr-8"
              />
              {busquedaMarcas && (
                <button
                  type="button"
                  onClick={() => setBusquedaMarcas('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = inputTabNuevaMarca.trim();
                if (!val) {
                  setModalRapido({ abierto: true, tipo: 'marca', valor: '', lineaPadre: '' });
                  return;
                }
                agregarNuevaMarca(val);
                setInputTabNuevaMarca('');
              }}
              className="md:col-span-7 flex items-center gap-2"
            >
              <input
                ref={inputMarcaRef}
                type="text"
                value={inputTabNuevaMarca}
                onChange={(e) => setInputTabNuevaMarca(e.target.value)}
                placeholder="Registrar nueva marca (ej. MONROE, AISIN)..."
                className="input-field h-10 px-3.5 uppercase flex-1"
              />
              <button
                type="submit"
                className="h-10 px-4 btn-gradient-emerald text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar</span>
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {marcasPaginadas.length > 0 ? (
            marcasPaginadas.map((marca) => {
              const count = conteoPorMarca[marca] || 0;
              return (
                <div
                  key={marca}
                  className="surface-card p-4 flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                      {marca.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-mono font-bold text-xs uppercase text-slate-900 dark:text-white truncate">
                        {marca}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {count} {count === 1 ? 'repuesto' : 'repuestos'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroMarcaInv(marca);
                        setTabActiva('inventario');
                      }}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver stock</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={`Editar "${marca}"`}
                        onClick={() => abrirModalEditar('marca', marca, '', count)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={`Eliminar "${marca}"`}
                        onClick={() => abrirModalConfirmarEliminar('marca', marca, '', count)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full surface-card py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No se encontraron marcas con ese criterio.
            </div>
          )}
        </div>

        <PaginationBar
          paginaActual={paginaMarcas}
          totalPaginas={totalPaginasMarcas}
          totalItems={marcasFiltradas.length}
          itemsPorPagina={itemsPorPaginaMarcas}
          onChangePagina={(num) => {
            setPaginaMarcas(num);
            window.scrollTo({ top: 140, behavior: 'smooth' });
          }}
          onChangeItemsPorPagina={setItemsPorPaginaMarcas}
          opcionesItemsPorPagina={[12, 16, 24, 32, 'todos']}
          etiquetaItem="marcas"
        />
      </div>
    );
  }

  // Modelos de vehículos
  return (
    <div className="space-y-4">
      <div className="surface-card p-4 sm:p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Vehículos y Modelos Compatibles
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra los modelos de vehículos para filtrar y clasificar repuestos
          </p>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busquedaModelos}
              onChange={(e) => setBusquedaModelos(e.target.value)}
              placeholder="Buscar modelo o marca (ej. Toyota, Corolla, Aveo)..."
              className="input-field h-10 pl-10 pr-8"
            />
            {busquedaModelos && (
              <button
                type="button"
                onClick={() => setBusquedaModelos('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = inputTabNuevoModelo.trim();
              if (!val) {
                setModalRapido({
                  abierto: true,
                  tipo: 'modelo',
                  valor: '',
                  lineaPadre: '',
                  marcaVehiculo: '',
                  marcaManual: false,
                });
                return;
              }
              const parsed = extraerMarcaYModeloDeTexto(val);
              if (!parsed.marca) {
                setModalRapido({
                  abierto: true,
                  tipo: 'modelo',
                  valor: parsed.modelo,
                  lineaPadre: '',
                  marcaVehiculo: '',
                  marcaManual: false,
                });
                setInputTabNuevoModelo('');
                return;
              }
              agregarNuevoModelo(parsed.modelo, parsed.marca);
              setInputTabNuevoModelo('');
            }}
            className="md:col-span-7 flex items-center gap-2"
          >
            <input
              ref={inputModeloRef}
              type="text"
              value={inputTabNuevoModelo}
              onChange={(e) => setInputTabNuevoModelo(e.target.value)}
              placeholder="Nuevo modelo sin repetir marca (ej. Corolla, Aveo, Hunter)..."
              className="input-field h-10 px-3.5 flex-1"
            />
            <button
              type="submit"
              className="h-10 px-4 btn-primary text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar</span>
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {modelosPaginados.length > 0 ? (
          modelosPaginados.map((modelo) => {
            const count = conteoPorModelo[modelo] || 0;
            const marcaFabricante = obtenerMarcaVehiculo(modelo);

            return (
              <div
                key={modelo}
                className="surface-card p-4 flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {marcaFabricante && marcaFabricante !== 'General' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 mb-0.5">
                        {marcaFabricante}
                      </span>
                    )}
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {modelo}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {count} compatibles
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroTexto(modelo);
                      setTabActiva('inventario');
                    }}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver repuestos</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={`Editar "${modelo}"`}
                      onClick={() => abrirModalEditar('modelo', modelo, '', count)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={`Eliminar "${modelo}"`}
                      onClick={() => abrirModalConfirmarEliminar('modelo', modelo, '', count)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full surface-card py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No se encontraron modelos de vehículos.
          </div>
        )}
      </div>

      <PaginationBar
        paginaActual={paginaModelos}
        totalPaginas={totalPaginasModelos}
        totalItems={modelosFiltrados.length}
        itemsPorPagina={itemsPorPaginaModelos}
        onChangePagina={(num) => {
          setPaginaModelos(num);
          window.scrollTo({ top: 140, behavior: 'smooth' });
        }}
        onChangeItemsPorPagina={setItemsPorPaginaModelos}
        opcionesItemsPorPagina={[12, 16, 24, 32, 'todos']}
        etiquetaItem="vehículos"
      />
    </div>
  );
}

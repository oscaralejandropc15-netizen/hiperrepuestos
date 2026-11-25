import React from 'react';
import {
  Search,
  X,
  Plus,
  RotateCcw,
  Eye,
  Car,
  Edit,
  Trash2,
  Package
} from 'lucide-react';
import PaginationBar from '../ui/PaginationBar';
import { formatUSD, formatNumber, parseVenezuelanNumber } from '../../lib/formatters';
import { obtenerFotoRepuesto } from '../../lib/repuestosImagenes';

export default function InventarioTab({
  productos,
  productosFiltrados,
  productosPaginados,
  cargandoProd,
  filtroTexto,
  setFiltroTexto,
  filtroLineaInv,
  setFiltroLineaInv,
  filtroSublineaInv,
  setFiltroSublineaInv,
  filtroMarcaInv,
  setFiltroMarcaInv,
  listaLineas,
  sublineasDisponiblesInv,
  listaMarcas,
  paginaInventario,
  totalPaginasInventario,
  itemsPorPaginaInventario,
  setPaginaInventario,
  setItemsPorPaginaInventario,
  tasaBCV,
  onAbrirCrear,
  onAbrirEditar,
  onSolicitarEliminar,
  onZoomRepuesto,
  onActualizarInventario
}) {
  const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
  const hayFiltros = Boolean(filtroTexto || filtroLineaInv || filtroSublineaInv || filtroMarcaInv);

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Filtros */}
      <div className="surface-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Filtrar por código, descripción, marca, vehículo o línea..."
              className="input-field h-10 pl-10 pr-9"
            />
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto('')}
                aria-label="Limpiar filtro de texto"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onActualizarInventario && (
              <button
                type="button"
                onClick={onActualizarInventario}
                disabled={cargandoProd}
                title="Actualizar catálogo desde base de datos"
                aria-label="Actualizar inventario"
                className="min-h-[40px] w-10 btn-secondary inline-flex items-center justify-center"
              >
                <RotateCcw className={`w-4 h-4 ${cargandoProd ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onAbrirCrear}
              className="flex-1 sm:flex-initial min-h-[40px] px-4 btn-gradient-emerald font-semibold text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo repuesto</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <select
            value={filtroLineaInv}
            onChange={(e) => {
              setFiltroLineaInv(e.target.value);
              setFiltroSublineaInv('');
            }}
            className={`input-field h-9 px-2.5 text-xs font-medium cursor-pointer ${filtroLineaInv ? 'border-red-500 ring-1 ring-red-500/20' : ''
              }`}
          >
            <option value="">Todas las líneas</option>
            {listaLineas.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={filtroSublineaInv}
            onChange={(e) => setFiltroSublineaInv(e.target.value)}
            className={`input-field h-9 px-2.5 text-xs font-medium cursor-pointer ${filtroSublineaInv ? 'border-red-500 ring-1 ring-red-500/20' : ''
              }`}
          >
            <option value="">Todas las sublíneas</option>
            {sublineasDisponiblesInv.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filtroMarcaInv}
            onChange={(e) => setFiltroMarcaInv(e.target.value)}
            className={`input-field h-9 px-2.5 text-xs font-medium cursor-pointer ${filtroMarcaInv ? 'border-red-500 ring-1 ring-red-500/20' : ''
              }`}
          >
            <option value="">Todas las marcas</option>
            {listaMarcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {productosFiltrados.length} de {productos.length}
            </span>
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setFiltroTexto('');
                  setFiltroLineaInv('');
                  setFiltroSublineaInv('');
                  setFiltroMarcaInv('');
                }}
                className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Escritorio + Tarjetas Móvil */}
      <div className="surface-card overflow-hidden">
        {cargandoProd ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Cargando catálogo de repuestos...
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-[#090d16] border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3 text-center w-14">Foto</th>
                    <th className="px-3 py-3">Código</th>
                    <th className="px-3 py-3 min-w-[240px]">Descripción y vehículo</th>
                    <th className="px-3 py-3">Marca</th>
                    <th className="px-3 py-3 text-center">Stock</th>
                    <th className="px-3 py-3 text-right">Costo</th>
                    <th className="px-3 py-3 text-right">Precio venta</th>
                    <th className="px-3 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {productosPaginados.length > 0 ? (
                    productosPaginados.map((p) => {
                      const baseUSD = parseFloat(p.precio_detal_usd) || 0;
                      const pBs = baseUSD * tasaNum * (p.aplica_iva !== false ? 1.16 : 1);
                      const fotoUrl = obtenerFotoRepuesto(p);
                      const sinStock = (p.stock || 0) <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onZoomRepuesto(p)}
                              className="group relative inline-flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-red-500 transition-colors bg-slate-50 dark:bg-[#090d16] cursor-pointer p-0.5"
                              title="Ver foto ampliada"
                            >
                              {fotoUrl ? (
                                <img
                                  src={fotoUrl}
                                  alt={p.descripcion}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          </td>

                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-2 py-0.5 rounded-md">
                              {p.codigo_corto}
                            </span>
                            {p.referencia && p.referencia !== p.codigo_corto && (
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                OEM: {p.referencia}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {p.linea && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                                  {p.linea}
                                </span>
                              )}
                              {p.sublinea && p.sublinea !== 'General' && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  · {p.sublinea}
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                              {p.descripcion}
                            </div>
                            {p.modelo_vehiculo && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Car className="w-3 h-3 shrink-0" />
                                <span>{p.modelo_vehiculo}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2.5 whitespace-nowrap font-semibold uppercase text-slate-700 dark:text-slate-300">
                            {p.marca_producto || p.marca || 'GENÉRICO'}
                          </td>

                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono font-semibold text-[11px] ${sinStock
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                }`}
                            >
                              {p.stock ?? 0}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-right font-mono text-slate-500 dark:text-slate-400">
                            {formatUSD(p.costo_usd || 0)}
                          </td>

                          <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono">
                            <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                              {formatUSD(p.precio_detal_usd || 0)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Bs. {formatNumber(pBs.toFixed(2))}
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onAbrirEditar(p)}
                                aria-label="Editar repuesto"
                                title="Editar repuesto"
                                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onSolicitarEliminar(p)}
                                aria-label="Eliminar repuesto"
                                title="Eliminar repuesto"
                                className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-10 text-center text-slate-500 dark:text-slate-400">
                        No se encontraron repuestos con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tarjetas Teléfono (1 col) y Tablet (2 cols) */}
            <div className="lg:hidden p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {productosPaginados.length > 0 ? (
                productosPaginados.map((p) => {
                  const baseUSD = parseFloat(p.precio_detal_usd) || 0;
                  const pBs = baseUSD * tasaNum * (p.aplica_iva !== false ? 1.16 : 1);
                  const fotoUrl = obtenerFotoRepuesto(p);
                  const sinStock = (p.stock || 0) <= 0;

                  return (
                    <div key={p.id} className="surface-muted p-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onZoomRepuesto(p)}
                            className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#0e1422] flex items-center justify-center p-0.5 cursor-pointer"
                            title="Ver foto ampliada"
                          >
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={p.descripcion}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-2 py-0.5 rounded-md">
                                {p.codigo_corto}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                                {p.marca_producto || p.marca || 'GENÉRICO'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono font-semibold text-[11px] ${sinStock
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  }`}
                              >
                                Stock: {p.stock ?? 0}
                              </span>
                            </div>

                            <h3 className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                              {p.descripcion}
                            </h3>

                            {p.modelo_vehiculo && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Car className="w-3 h-3 shrink-0" />
                                <span className="truncate">{p.modelo_vehiculo}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onAbrirEditar(p)}
                            aria-label="Editar repuesto"
                            className="p-2 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSolicitarEliminar(p)}
                            aria-label="Eliminar repuesto"
                            className="p-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06] text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-sans">
                          Costo:{' '}
                          <strong className="font-mono text-slate-700 dark:text-slate-300">
                            {formatUSD(p.costo_usd || 0)}
                          </strong>
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                            {formatUSD(p.precio_detal_usd || 0)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                            Bs. {formatNumber(pBs.toFixed(2))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-2 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No se encontraron repuestos con los filtros seleccionados.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <PaginationBar
        paginaActual={paginaInventario}
        totalPaginas={totalPaginasInventario}
        totalItems={productosFiltrados.length}
        itemsPorPagina={itemsPorPaginaInventario}
        onChangePagina={(num) => {
          setPaginaInventario(num);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        onChangeItemsPorPagina={setItemsPorPaginaInventario}
        opcionesItemsPorPagina={[15, 25, 50, 100, 'todos']}
        etiquetaItem="repuestos"
      />
    </div>
  );
}

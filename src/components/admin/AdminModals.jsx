import React from 'react';
import { createPortal } from 'react-dom';
import { getBackdropProps } from '../../lib/modalBackdrop';
import SearchableCombobox from './SearchableCombobox';
import {
  getListaMarcasAutomotrices,
  extraerMarcaYModeloDeTexto,
  obtenerMarcaVehiculo,
} from '../../lib/vehiculosMarcas';
import {
  Layers,
  Plus,
  Tag,
  Car,
  Edit,
  Save,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function AdminModals({
  modalRapido,
  setModalRapido,
  lineaActivaMaster,
  setLineaActivaMaster,
  listaModelos = [],
  agregarNuevaLinea,
  agregarNuevaSublinea,
  agregarNuevaMarca,
  agregarNuevoModelo,
  mostrarNotificacion,
  modalEditar,
  setModalEditar,
  confirmarEdicion,
  modalConfirmarEliminar,
  setModalConfirmarEliminar,
  ejecutarEliminacion,
}) {
  if (typeof document === 'undefined') return null;

  const cerrarModalRapido = () =>
    setModalRapido({
      abierto: false,
      tipo: 'linea',
      valor: '',
      lineaPadre: '',
      marcaVehiculo: '',
      marcaManual: false,
    });

  const esModalModelo = modalRapido.abierto && modalRapido.tipo === 'modelo';
  const marcasAutomotrices = esModalModelo ? getListaMarcasAutomotrices() : [];
  const previewVehiculo = esModalModelo
    ? extraerMarcaYModeloDeTexto(modalRapido.valor, modalRapido.marcaVehiculo)
    : null;
  const modeloDuplicado =
    esModalModelo && previewVehiculo?.modelo
      ? listaModelos.find((m) => m.toLowerCase() === previewVehiculo.modelo.toLowerCase())
      : null;
  const marcaDuplicado = modeloDuplicado ? obtenerMarcaVehiculo(modeloDuplicado) : '';
  const esDuplicadoReal =
    Boolean(modeloDuplicado) &&
    !(
      marcaDuplicado === 'Otras Marcas' &&
      previewVehiculo?.marca &&
      previewVehiculo.marca !== 'Otras Marcas'
    );

  return (
    <>
      {modalRapido.abierto &&
        createPortal(
          <div
            {...getBackdropProps(cerrarModalRapido)}
            className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90dvh] overflow-y-auto animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    {modalRapido.tipo === 'linea' && <Layers className="w-5 h-5" />}
                    {modalRapido.tipo === 'sublinea' && <Plus className="w-5 h-5" />}
                    {modalRapido.tipo === 'marca' && <Tag className="w-5 h-5" />}
                    {modalRapido.tipo === 'modelo' && <Car className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {modalRapido.tipo === 'linea' && 'Nueva línea automotriz'}
                      {modalRapido.tipo === 'sublinea' &&
                        `Nueva pieza en ${modalRapido.lineaPadre || lineaActivaMaster}`}
                      {modalRapido.tipo === 'marca' && 'Registrar nueva marca'}
                      {modalRapido.tipo === 'modelo' && 'Registrar nuevo vehículo'}
                    </h3>
                    {esModalModelo && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Separa la marca fabricante del modelo para mantener el catálogo ordenado
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cerrarModalRapido}
                  aria-label="Cerrar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = (modalRapido.valor || '').trim();
                  if (esModalModelo) {
                    const { marca, modelo } = extraerMarcaYModeloDeTexto(
                      val,
                      modalRapido.marcaVehiculo
                    );
                    if (!marca) {
                      mostrarNotificacion(
                        'Selecciona o escribe la marca fabricante del vehículo.',
                        'warning'
                      );
                      return;
                    }
                    if (!modelo) {
                      mostrarNotificacion(
                        'Escribe el nombre del modelo (ej. Corolla, Aveo, Hunter).',
                        'warning'
                      );
                      return;
                    }
                    if (esDuplicadoReal) {
                      mostrarNotificacion(
                        `El modelo "${modeloDuplicado}" ya existe bajo ${marcaDuplicado}.`,
                        'warning'
                      );
                      return;
                    }
                    agregarNuevoModelo(modelo, marca);
                    cerrarModalRapido();
                    return;
                  }

                  if (!val) {
                    mostrarNotificacion('Por favor escribe un nombre antes de guardar.', 'warning');
                    return;
                  }
                  if (modalRapido.tipo === 'linea') {
                    const res = agregarNuevaLinea(val);
                    if (res) setLineaActivaMaster(res);
                  } else if (modalRapido.tipo === 'sublinea') {
                    agregarNuevaSublinea(val, modalRapido.lineaPadre || lineaActivaMaster);
                  } else if (modalRapido.tipo === 'marca') {
                    agregarNuevaMarca(val);
                  }
                  cerrarModalRapido();
                }}
                className="space-y-4"
              >
                {esModalModelo ? (
                  <div className="space-y-3.5">
                    <SearchableCombobox
                      label="1. Marca del vehículo *"
                      value={modalRapido.marcaVehiculo || ''}
                      onChange={(marcaElegida) =>
                        setModalRapido((prev) => ({
                          ...prev,
                          marcaVehiculo: marcaElegida,
                          marcaManual: Boolean(marcaElegida),
                        }))
                      }
                      options={marcasAutomotrices}
                      placeholder="Ej. Toyota, Chevrolet, Changan, JAC..."
                      required
                      commitNewOnBlur
                      onCreateNew={(q) => String(q || '').trim()}
                      createNewLabel={(q) => `Usar marca "${q}"`}
                    />

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between gap-2">
                        <span>2. Modelo del vehículo *</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          Sin repetir la marca
                        </span>
                      </label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={modalRapido.valor}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setModalRapido((prev) => {
                            const nextState = { ...prev, valor: nextVal };
                            if (!prev.marcaManual) {
                              nextState.marcaVehiculo =
                                extraerMarcaYModeloDeTexto(nextVal).marca || '';
                            }
                            return nextState;
                          });
                        }}
                        placeholder="Ej. Corolla, Hilux, Hunter, Frison T8..."
                        className="input-field h-10 px-3.5 font-semibold"
                      />
                    </div>

                    {(previewVehiculo?.marca || previewVehiculo?.modelo) && (
                      <div
                        className={`rounded-xl border p-3 flex items-center gap-3 ${
                          esDuplicadoReal
                            ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25'
                            : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                              {previewVehiculo.marca || 'Marca pendiente'}
                            </span>
                            {esDuplicadoReal && (
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                Ya existe en {marcaDuplicado}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                            {previewVehiculo.modelo || 'Escribe el modelo...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={modalRapido.valor}
                      onChange={(e) => setModalRapido((prev) => ({ ...prev, valor: e.target.value }))}
                      placeholder="Escribe el nombre..."
                      className={`input-field h-11 px-3.5 font-semibold ${
                        modalRapido.tipo === 'marca' ? 'uppercase' : ''
                      }`}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cerrarModalRapido}
                    className="min-h-[40px] px-4 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={esDuplicadoReal}
                    className={`min-h-[40px] px-5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1.5 ${
                      esDuplicadoReal ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {modalEditar.abierto &&
        createPortal(
          <div
            {...getBackdropProps(() =>
              setModalEditar({
                abierto: false,
                tipo: 'linea',
                nombreActual: '',
                lineaPadre: '',
                nuevoNombre: '',
                conteoAfectados: 0,
              })
            )}
            className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Editar nombre
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Actual: «{modalEditar.nombreActual}»
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalEditar({
                      abierto: false,
                      tipo: 'linea',
                      nombreActual: '',
                      lineaPadre: '',
                      nuevoNombre: '',
                      conteoAfectados: 0,
                    })
                  }
                  aria-label="Cerrar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={confirmarEdicion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nuevo nombre *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={modalEditar.nuevoNombre}
                    onChange={(e) =>
                      setModalEditar((prev) => ({ ...prev, nuevoNombre: e.target.value }))
                    }
                    className="input-field h-11 px-3.5 font-semibold"
                  />
                </div>

                {modalEditar.conteoAfectados > 0 && (
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25 text-xs text-sky-800 dark:text-sky-300">
                    Hay <strong>{modalEditar.conteoAfectados}</strong> repuesto(s) con esta clasificación. Se actualizarán automáticamente al guardar.
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModalEditar({
                        abierto: false,
                        tipo: 'linea',
                        nombreActual: '',
                        lineaPadre: '',
                        nuevoNombre: '',
                        conteoAfectados: 0,
                      })
                    }
                    className="min-h-[40px] px-4 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {modalConfirmarEliminar.abierto &&
        createPortal(
          <div
            {...getBackdropProps(() =>
              setModalConfirmarEliminar({
                abierto: false,
                tipo: 'linea',
                nombre: '',
                lineaPadre: '',
                conteoAfectados: 0,
              })
            )}
            className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Confirmar eliminación
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      «{modalConfirmarEliminar.nombre}»
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalConfirmarEliminar({
                      abierto: false,
                      tipo: 'linea',
                      nombre: '',
                      lineaPadre: '',
                      conteoAfectados: 0,
                    })
                  }
                  aria-label="Cerrar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalConfirmarEliminar.conteoAfectados > 0 ? (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-xl text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Protección de inventario</span>
                  </div>
                  <p>
                    Hay <strong>{modalConfirmarEliminar.conteoAfectados}</strong> repuesto(s) con esta clasificación. Se reasignarán a <strong>General</strong> sin perder datos ni stock.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No tiene repuestos asociados. Se eliminará limpiamente.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setModalConfirmarEliminar({
                      abierto: false,
                      tipo: 'linea',
                      nombre: '',
                      lineaPadre: '',
                      conteoAfectados: 0,
                    })
                  }
                  className="min-h-[40px] px-4 btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarEliminacion}
                  className="min-h-[40px] px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, eliminar</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

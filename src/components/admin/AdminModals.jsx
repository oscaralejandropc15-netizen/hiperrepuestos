import React from 'react';
import { createPortal } from 'react-dom';
import { getBackdropProps } from '../../lib/modalBackdrop';
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

  return (
    <>
      {modalRapido.abierto &&
        createPortal(
          <div
            {...getBackdropProps(() =>
              setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' })
            )}
            className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    {modalRapido.tipo === 'linea' && <Layers className="w-5 h-5" />}
                    {modalRapido.tipo === 'sublinea' && <Plus className="w-5 h-5" />}
                    {modalRapido.tipo === 'marca' && <Tag className="w-5 h-5" />}
                    {modalRapido.tipo === 'modelo' && <Car className="w-5 h-5" />}
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {modalRapido.tipo === 'linea' && 'Nueva línea automotriz'}
                    {modalRapido.tipo === 'sublinea' &&
                      `Nueva pieza en ${modalRapido.lineaPadre || lineaActivaMaster}`}
                    {modalRapido.tipo === 'marca' && 'Registrar nueva marca'}
                    {modalRapido.tipo === 'modelo' && 'Registrar nuevo vehículo'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' })
                  }
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
                  } else if (modalRapido.tipo === 'modelo') {
                    agregarNuevoModelo(val);
                  }
                  setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' });
                }}
                className="space-y-4"
              >
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
                    className={`input-field h-11 px-3.5 font-semibold ${modalRapido.tipo === 'marca' ? 'uppercase' : ''
                      }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' })
                    }
                    className="min-h-[40px] px-4 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1.5"
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

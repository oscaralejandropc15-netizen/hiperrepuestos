import React from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Layers,
  Tag,
  Camera,
  CameraOff,
  DollarSign,
  Boxes,
  Bookmark,
  Upload,
  RotateCcw,
  Save,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../../lib/formatters';
import { obtenerLineaParaSublinea } from '../../lib/clasificacionesRepuestos';
import { obtenerFotoRepuesto, FOTOS_CATALOGO } from '../../lib/repuestosImagenes';
import { obtenerMarcaVehiculo } from '../../lib/vehiculosMarcas';
import SearchableCombobox from './SearchableCombobox';

const PASOS_MODAL = [
  { id: 1, label: 'Clasificación', hint: 'Línea y vehículo', icon: Layers },
  { id: 2, label: 'Identificación', hint: 'Descripción y códigos', icon: Tag },
  { id: 3, label: 'Fotografía', hint: 'Catálogo o archivo', icon: Camera },
  { id: 4, label: 'Precios & Stock', hint: 'Costo, venta y almacén', icon: DollarSign },
];

export default function RepuestoModal({
  abierto,
  onClose,
  repuestoEditandoId,
  formRepuesto,
  setFormRepuesto,
  pasoModalRepuesto,
  saltarAPasoModal,
  avanzarPasoModal,
  retrocederPasoModal,
  guardarRepuesto,
  guardandoRepuesto,
  tasaBCV,
  listaLineas,
  sublineasDisponiblesModal,
  listaMarcas,
  listaModelos,
  agregarNuevaLinea,
  agregarNuevaSublinea,
  agregarNuevaMarca,
  agregarNuevoModelo,
  fotoActualMostrada,
  esFotoPersonalizada,
  isDraggingFoto,
  setIsDraggingFoto,
  fileInputFotoRef,
  procesarArchivoImagen,
  handleCostoChange,
  handleMargenChange,
  handlePrecioVentaChange,
  mostrarNotificacion,
}) {
  if (!abierto || typeof document === 'undefined') return null;

  const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-slate-950/65 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0e1422] border-0 sm:border border-slate-200 dark:border-white/10 rounded-none sm:rounded-2xl w-full sm:w-[96vw] max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-scale-in"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#090d16] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {repuestoEditandoId ? 'Editar Repuesto' : 'Nuevo Repuesto'}
                </h2>
                {(formRepuesto.codigo_corto || formRepuesto.referencia) && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 font-bold">
                    {formRepuesto.codigo_corto || formRepuesto.referencia}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Paso {pasoModalRepuesto} de 4: {PASOS_MODAL.find((p) => p.id === pasoModalRepuesto)?.hint}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0e1422] shrink-0">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
            {PASOS_MODAL.map((paso) => {
              const IconoPaso = paso.icon;
              const esActivo = pasoModalRepuesto === paso.id;
              const esCompletado = pasoModalRepuesto > paso.id;

              return (
                <button
                  key={paso.id}
                  type="button"
                  onClick={() => saltarAPasoModal(paso.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 p-2 rounded-xl text-center sm:text-left transition-all cursor-pointer border ${esActivo
                    ? 'bg-red-50/80 dark:bg-red-500/15 border-red-300 dark:border-red-500/35'
                    : esCompletado
                      ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08]'
                      : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${esCompletado
                      ? 'bg-emerald-600 text-white'
                      : esActivo
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    {esCompletado ? <Check className="w-3.5 h-3.5" /> : <IconoPaso className="w-3.5 h-3.5" />}
                  </div>
                  <span className="sm:hidden text-[10px] font-semibold truncate max-w-full text-slate-700 dark:text-slate-200">
                    {paso.label.split(' ')[0]}
                  </span>
                  <div className="min-w-0 hidden sm:block">
                    <span
                      className={`text-xs font-semibold block truncate ${esActivo
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-slate-800 dark:text-slate-200'
                        }`}
                    >
                      {paso.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {paso.hint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pasoModalRepuesto < 4) avanzarPasoModal(e);
            else guardarRepuesto(e);
          }}
          className="flex flex-col flex-1 overflow-hidden min-h-0"
        >
          <input
            ref={fileInputFotoRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) procesarArchivoImagen(e.target.files[0]);
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-[#f4f6f9] dark:bg-[#070a11]">
            <div className="max-w-3xl mx-auto space-y-4">
              {pasoModalRepuesto === 1 && (
                <div className="surface-card p-5 space-y-4 animate-fade-in">
                  <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Clasificación y Compatibilidad
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Organiza el repuesto por sistema, tipo de pieza, marca y vehículo
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableCombobox
                      label="Línea / Sistema *"
                      value={formRepuesto.linea}
                      onChange={(val) => setFormRepuesto((prev) => ({ ...prev, linea: val }))}
                      options={listaLineas}
                      placeholder="Buscar o seleccionar línea..."
                      required
                      onCreateNew={(newVal) => {
                        const val = agregarNuevaLinea(newVal);
                        if (val) setFormRepuesto((prev) => ({ ...prev, linea: val }));
                        return val;
                      }}
                      createNewLabel={(q) => `Crear "${q}"`}
                    />

                    <SearchableCombobox
                      label="Sublínea / Pieza"
                      value={formRepuesto.sublinea}
                      onChange={(val) => {
                        const lineaAuto =
                          !formRepuesto.linea || !formRepuesto.linea.trim()
                            ? obtenerLineaParaSublinea(val)
                            : '';
                        setFormRepuesto((prev) => ({
                          ...prev,
                          sublinea: val,
                          ...(lineaAuto ? { linea: lineaAuto } : {}),
                        }));
                      }}
                      options={sublineasDisponiblesModal}
                      placeholder="Buscar o escribir pieza..."
                      onCreateNew={(newVal) => {
                        const val = agregarNuevaSublinea(newVal, formRepuesto.linea);
                        if (val) setFormRepuesto((prev) => ({ ...prev, sublinea: val }));
                        return val;
                      }}
                      createNewLabel={(q) => `Crear "${q}"`}
                    />

                    <SearchableCombobox
                      label="Marca del repuesto *"
                      value={formRepuesto.marca_producto}
                      onChange={(val) =>
                        setFormRepuesto((prev) => ({ ...prev, marca_producto: val }))
                      }
                      options={listaMarcas}
                      placeholder="Ej. BOSCH, DENSO..."
                      required
                      uppercase
                      onCreateNew={(newVal) => {
                        const val = agregarNuevaMarca(newVal);
                        if (val) setFormRepuesto((prev) => ({ ...prev, marca_producto: val }));
                        return val;
                      }}
                      createNewLabel={(q) => `Registrar "${q}"`}
                    />

                    <SearchableCombobox
                      label="Vehículo compatible *"
                      value={formRepuesto.modelo_vehiculo}
                      onChange={(val) =>
                        setFormRepuesto((prev) => ({ ...prev, modelo_vehiculo: val }))
                      }
                      options={listaModelos}
                      placeholder="Ej. 4Runner, Corolla..."
                      required
                      getLabel={(m) => {
                        const marca = obtenerMarcaVehiculo(m);
                        return marca && marca !== 'Otras Marcas' && marca !== 'General'
                          ? `${marca} - ${m}`
                          : m;
                      }}
                      getFilterText={(m) => `${obtenerMarcaVehiculo(m)} ${m}`}
                      onCreateNew={(newVal) => {
                        const val = agregarNuevoModelo(newVal);
                        if (val) setFormRepuesto((prev) => ({ ...prev, modelo_vehiculo: val }));
                        return val;
                      }}
                      createNewLabel={(q) => `Crear "${q}"`}
                    />
                  </div>
                </div>
              )}

              {pasoModalRepuesto === 2 && (
                <div className="surface-card p-5 space-y-4 animate-fade-in">
                  <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Identificación y Códigos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Define la descripción visible en factura y referencias técnicas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Descripción del repuesto <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formRepuesto.descripcion}
                      onChange={(e) =>
                        setFormRepuesto((prev) => ({ ...prev, descripcion: e.target.value }))
                      }
                      placeholder="Ej. PASTILLAS DE FRENO DELANTERAS CERÁMICAS"
                      className="input-field h-11 px-3.5 font-semibold uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Código corto
                      </label>
                      <input
                        type="text"
                        value={formRepuesto.codigo_corto}
                        onChange={(e) =>
                          setFormRepuesto((prev) => ({ ...prev, codigo_corto: e.target.value }))
                        }
                        placeholder="Ej. MD-COR-09"
                        className="input-field h-10 px-3 font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Referencia OEM
                      </label>
                      <input
                        type="text"
                        value={formRepuesto.referencia}
                        onChange={(e) =>
                          setFormRepuesto((prev) => ({ ...prev, referencia: e.target.value }))
                        }
                        placeholder="Ej. 04465-02220"
                        className="input-field h-10 px-3 font-mono font-semibold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Unidad de empaque
                      </label>
                      <select
                        value={formRepuesto.unidad || 'UND'}
                        onChange={(e) =>
                          setFormRepuesto((prev) => ({ ...prev, unidad: e.target.value }))
                        }
                        className="input-field h-10 px-3 font-semibold cursor-pointer"
                      >
                        <option value="UND">UND (Unidad)</option>
                        <option value="PAR">PAR (Par)</option>
                        <option value="JGO">JGO (Juego)</option>
                        <option value="KIT">KIT (Kit Completo)</option>
                        <option value="LITRO">LITRO</option>
                        <option value="GALÓN">GALÓN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Medidas / especificación (opcional)
                      </label>
                      <input
                        type="text"
                        value={formRepuesto.medidas}
                        onChange={(e) =>
                          setFormRepuesto((prev) => ({ ...prev, medidas: e.target.value }))
                        }
                        placeholder="Ej. 1 Galón, 5 Canales, 10W-40..."
                        className="input-field h-10 px-3 font-mono"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-xs text-amber-800 dark:text-amber-200">
                      <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                        <Bookmark className="w-3.5 h-3.5 shrink-0" />
                        <span>Regla de códigos</span>
                      </p>
                      <p className="opacity-90">
                        Ingresa al menos Código Corto o Referencia OEM.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {pasoModalRepuesto === 3 && (
                <div className="surface-card p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        Fotografía del Repuesto (Opcional)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Sube una foto real, pega con Ctrl+V o selecciona del catálogo
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 shrink-0">
                      {esFotoPersonalizada ? 'Foto asignada' : 'Sin foto'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-5 flex justify-center">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFoto(true);
                        }}
                        onDragLeave={() => setIsDraggingFoto(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFoto(false);
                          if (e.dataTransfer.files?.[0]) procesarArchivoImagen(e.dataTransfer.files[0]);
                        }}
                        onClick={() => fileInputFotoRef.current?.click()}
                        className={`w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-dashed transition-all p-2 flex items-center justify-center relative group bg-slate-50 dark:bg-[#090d16] cursor-pointer ${isDraggingFoto
                          ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                          : 'border-slate-300 dark:border-white/15 hover:border-red-500'
                          }`}
                      >
                        {fotoActualMostrada ? (
                          <img
                            src={fotoActualMostrada}
                            alt="Vista previa repuesto"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 gap-1.5 text-center p-3">
                            <CameraOff className="w-9 h-9 stroke-1" />
                            <span className="text-xs font-semibold">Sin foto asignada</span>
                            <span className="text-[11px]">Clic o arrastra aquí</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-2xl">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-xs font-semibold">Cambiar imagen</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputFotoRef.current?.click()}
                          className="min-h-[38px] px-4 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir archivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const fotoSugerida = obtenerFotoRepuesto(formRepuesto);
                            if (fotoSugerida) {
                              setFormRepuesto((prev) => ({ ...prev, imagen_url: fotoSugerida }));
                              mostrarNotificacion('Foto sugerida del catálogo asignada.', 'info');
                            } else {
                              mostrarNotificacion(
                                'Selecciona una sublínea o escribe una descripción para sugerir foto.',
                                'warning'
                              );
                            }
                          }}
                          className="min-h-[38px] px-3.5 btn-secondary text-xs inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Sugerir del catálogo</span>
                        </button>

                        {fotoActualMostrada && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormRepuesto((prev) => ({ ...prev, imagen_url: '' }));
                              mostrarNotificacion('Foto retirada.', 'info');
                            }}
                            className="min-h-[38px] px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <CameraOff className="w-3.5 h-3.5" />
                            <span>Quitar</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Pastillas Freno', url: FOTOS_CATALOGO.pastillas_freno },
                          { label: 'Amortiguador', url: FOTOS_CATALOGO.amortiguador },
                          { label: 'Bujía', url: FOTOS_CATALOGO.bujia },
                          { label: 'Filtro Aceite', url: FOTOS_CATALOGO.filtro_aceite },
                          { label: 'Bomba de Agua', url: FOTOS_CATALOGO.bomba_agua },
                          { label: 'Rótula / Muñón', url: FOTOS_CATALOGO.munon_rotula },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setFormRepuesto((prev) => ({ ...prev, imagen_url: preset.url }));
                              mostrarNotificacion(`Foto asignada: ${preset.label}`, 'success');
                            }}
                            className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border cursor-pointer ${formRepuesto.imagen_url === preset.url
                              ? 'bg-red-50 dark:bg-red-500/15 border-red-500 text-red-700 dark:text-red-300'
                              : 'bg-slate-50 dark:bg-[#090d16] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                              }`}
                          >
                            <img src={preset.url} alt="" className="w-5 h-5 object-contain rounded" />
                            <span className="truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {pasoModalRepuesto === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="surface-card p-5 space-y-4 border-l-4 border-l-emerald-500">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                      <div>
                        <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Costo y Precio de Venta Detal
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {[30, 40, 50, 60, 100].map((mVal) => (
                          <button
                            key={mVal}
                            type="button"
                            onClick={() => handleMargenChange(String(mVal))}
                            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold cursor-pointer ${String(formRepuesto.margen_detal) === String(mVal) &&
                              parseFloat(formRepuesto.costo_usd) > 0
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              }`}
                          >
                            +{mVal}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Costo ($ USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formRepuesto.costo_usd}
                          onChange={(e) => handleCostoChange(e.target.value)}
                          placeholder="0.00"
                          className="input-field h-10 px-3 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Margen (%)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formRepuesto.margen_detal}
                          onChange={(e) => handleMargenChange(e.target.value)}
                          placeholder="40"
                          className="input-field h-10 px-3 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                          Precio venta ($ USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formRepuesto.precio_detal_usd}
                          onChange={(e) => handlePrecioVentaChange(e.target.value)}
                          placeholder="0.00"
                          className="input-field h-10 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="surface-card p-5 space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                      <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                        Inventario y Régimen Fiscal
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Stock actual *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formRepuesto.stock}
                          onChange={(e) =>
                            setFormRepuesto((prev) => ({ ...prev, stock: e.target.value }))
                          }
                          placeholder="0"
                          className="input-field h-10 px-3 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Ubicación física
                        </label>
                        <input
                          type="text"
                          value={formRepuesto.ubicacion_fisica}
                          onChange={(e) =>
                            setFormRepuesto((prev) => ({
                              ...prev,
                              ubicacion_fisica: e.target.value,
                            }))
                          }
                          placeholder="Ej. Pasillo 2, Estante B"
                          className="input-field h-10 px-3"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Régimen fiscal
                        </label>
                        <label className="h-10 px-3 surface-muted flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formRepuesto.aplica_iva}
                              onChange={(e) =>
                                setFormRepuesto((prev) => ({
                                  ...prev,
                                  aplica_iva: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Aplica IVA
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-slate-500">
                            {formRepuesto.aplica_iva ? '+16%' : 'Exento'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold mb-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ficha resumen</span>
                      </div>
                      <h4 className="font-semibold text-xs sm:text-sm truncate uppercase">
                        {formRepuesto.descripcion || 'Sin descripción'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {formRepuesto.marca_producto || 'GENÉRICO'} ·{' '}
                        {formRepuesto.modelo_vehiculo || 'Universal'} ·{' '}
                        {formRepuesto.linea || 'General'}
                      </p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="text-base sm:text-lg font-bold text-emerald-400">
                        {formatUSD(formRepuesto.precio_detal_usd || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatVES((parseFloat(formRepuesto.precio_detal_usd) || 0) * tasaNum)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0e1422] shrink-0">
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400">Precio venta:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {formatUSD(formRepuesto.precio_detal_usd || 0)}
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                ({formatVES((parseFloat(formRepuesto.precio_detal_usd) || 0) * tasaNum)})
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" onClick={onClose} className="min-h-[40px] px-4 btn-secondary text-xs">
                Cancelar
              </button>

              {pasoModalRepuesto > 1 && (
                <button
                  type="button"
                  onClick={retrocederPasoModal}
                  className="min-h-[40px] px-4 btn-secondary text-xs inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
              )}

              {pasoModalRepuesto < 4 ? (
                <button
                  type="button"
                  onClick={avanzarPasoModal}
                  className="min-h-[40px] px-5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={guardandoRepuesto}
                  className="min-h-[40px] px-5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {guardandoRepuesto
                      ? 'Guardando...'
                      : repuestoEditandoId
                        ? 'Guardar cambios'
                        : 'Registrar repuesto'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

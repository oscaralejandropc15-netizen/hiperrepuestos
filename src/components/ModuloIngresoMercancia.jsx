import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Search,
  Plus,
  PlusCircle,
  Trash2,
  RotateCcw,
  Calendar,
  Boxes,
  CheckCircle2,
  FileText,
  ChevronDown,
  History,
  X,
  Eye,
  Check,
  Edit2,
  Car,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { invalidateCatalogoCache } from '../lib/queryCache';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../lib/formatters';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import ModalZoomRepuesto from './ModalZoomRepuesto';
import ConfirmModal from './ui/ConfirmModal';
import ToastNotification from './ui/ToastNotification';

const PROVEEDORES_SUGERIDOS = [
  'ATS Distribuidora',
  'Repuestos Bosch de Venezuela',
  'Cardone Automotive',
  'Denso Auto Parts',
  'Volker Repuestos',
  'A y D Repuestos',
  'Brunner Parts',
  'Motorcraft Venezuela',
  'Gabriel Amortiguadores',
  'Valeo Distribución',
  'Distribuidora Carmona C.A.',
  'Inversiones AutoPartes C.A.',
];

export default function ModuloIngresoMercancia({
  productos = [],
  cargarInventario,
  tasaBCV,
  abrirModalCrear,
}) {
  const tasaNum = useMemo(() => parseVenezuelanNumber(tasaBCV) || 1, [tasaBCV]);

  const [proveedor, setProveedor] = useState('');
  const [proveedorManual, setProveedorManual] = useState(false);
  const [fechaRecepcion, setFechaRecepcion] = useState(() => new Date().toISOString().split('T')[0]);
  const [notasOperativas, setNotasOperativas] = useState('');
  const [renglones, setRenglones] = useState([]);

  const [guardando, setGuardando] = useState(false);
  const [notificacionExito, setNotificacionExito] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { type: 'reset' | 'submit' | 'clearHistory' }

  const [repuestoZoom, setRepuestoZoom] = useState(null);
  const [verHistorial, setVerHistorial] = useState(false);
  const [recepcionDetalleModal, setRecepcionDetalleModal] = useState(null);

  const [modalCrearExpress, setModalCrearExpress] = useState(null);
  const [guardandoNuevoProd, setGuardandoNuevoProd] = useState(false);
  const [formNuevoProd, setFormNuevoProd] = useState({
    codigo_corto: '',
    referencia: '',
    descripcion: '',
    marca: '',
    modelo_vehiculo: '',
    linea: 'Tren Delantero y Dirección',
    costo_usd: '',
    precio_detal_usd: '',
    margen: '35',
  });

  const mostrarToast = (mensaje, tipo = 'warning') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const abrirModalCrearExpress = (rowId, texto = '') => {
    const t = (texto || '').trim();
    const pareceCodigo = t.length > 0 && (!t.includes(' ') || t.length <= 8);
    setFormNuevoProd({
      codigo_corto: pareceCodigo ? t.toUpperCase() : '',
      referencia: '',
      descripcion: !pareceCodigo ? t.toUpperCase() : '',
      marca: '',
      modelo_vehiculo: '',
      linea: 'Tren Delantero y Dirección',
      costo_usd: '',
      precio_detal_usd: '',
      margen: '35',
    });
    setModalCrearExpress({ rowId });
  };

  const guardarProductoExpress = async (e) => {
    if (e) e.preventDefault();
    const cod = formNuevoProd.codigo_corto.trim().toUpperCase();
    const desc = formNuevoProd.descripcion.trim().toUpperCase();
    if (!cod || !desc) {
      mostrarToast('El Código Corto y la Descripción son obligatorios.', 'warning');
      return;
    }

    const costoNum = parseFloat(formNuevoProd.costo_usd) || 0;
    let precioNum = parseFloat(formNuevoProd.precio_detal_usd);
    if (isNaN(precioNum) || precioNum <= 0) {
      const m = parseFloat(formNuevoProd.margen) || 35;
      precioNum = Number((costoNum * (1 + m / 100)).toFixed(2));
    }

    setGuardandoNuevoProd(true);
    try {
      const payload = {
        codigo_corto: cod,
        referencia: formNuevoProd.referencia.trim().toUpperCase() || null,
        descripcion: desc,
        marca: formNuevoProd.marca.trim().toUpperCase() || 'GENÉRICO',
        marca_producto: formNuevoProd.marca.trim().toUpperCase() || 'GENÉRICO',
        modelo_vehiculo: formNuevoProd.modelo_vehiculo.trim() || 'Universal',
        linea: formNuevoProd.linea || 'General',
        sublinea: 'General',
        unidad: 'UND',
        costo_usd: costoNum,
        precio_detal_usd: precioNum,
        precio_taller_usd: precioNum,
        precio_mayor_usd: precioNum,
        stock: 0,
        aplica_iva: true,
        recien_llegado: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('productos').insert(payload).select().single();
      if (error) throw error;

      if (modalCrearExpress?.rowId) {
        seleccionarProductoEnRenglon(modalCrearExpress.rowId, data);
        if (costoNum > 0) {
          actualizarRenglon(modalCrearExpress.rowId, 'costo_unitario', costoNum);
        }
      }

      invalidateCatalogoCache();
      if (typeof cargarInventario === 'function') {
        cargarInventario();
      }
      setModalCrearExpress(null);
      mostrarToast(`Repuesto ${cod} creado y añadido a la recepción.`, 'success');
    } catch (err) {
      mostrarToast('Error al registrar nuevo producto: ' + err.message, 'error');
    } finally {
      setGuardandoNuevoProd(false);
    }
  };

  const [historialRecepciones, setHistorialRecepciones] = useState(() => {
    try {
      const saved = localStorage.getItem('familycar_historial_recepciones');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('familycar_historial_recepciones', JSON.stringify(historialRecepciones));
    } catch (e) {
      console.error('Error guardando historial de recepciones:', e);
    }
  }, [historialRecepciones]);

  const agregarRenglon = () => {
    setRenglones((prev) => [
      ...prev,
      {
        id: `renglon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        producto_id: '',
        producto: null,
        cantidad: 1,
        costo_unitario: '',
        busqueda: '',
        buscando: true,
      },
    ]);
  };

  const eliminarRenglon = (rowId) => {
    setRenglones((prev) => prev.filter((r) => r.id !== rowId));
  };

  const actualizarRenglon = (rowId, campo, valor) => {
    setRenglones((prev) => prev.map((r) => (r.id === rowId ? { ...r, [campo]: valor } : r)));
  };

  const seleccionarProductoEnRenglon = (rowId, prod) => {
    setRenglones((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              producto_id: prod.id,
              producto: prod,
              costo_unitario: prod.costo_usd ?? '',
              busqueda: '',
              buscando: false,
            }
          : r
      )
    );
  };

  const ejecutarResetear = () => {
    setProveedor('');
    setProveedorManual(false);
    setFechaRecepcion(new Date().toISOString().split('T')[0]);
    setNotasOperativas('');
    setRenglones([]);
    setNotificacionExito(null);
    setConfirmState(null);
  };

  const solicitarResetear = () => {
    if (renglones.length > 0 || proveedor || notasOperativas) {
      setConfirmState({ type: 'reset' });
    } else {
      ejecutarResetear();
    }
  };

  const totales = useMemo(() => {
    let cantItems = 0;
    let totalPiezas = 0;
    let totalCostoUSD = 0;
    renglones.forEach((r) => {
      if (r.producto_id) {
        cantItems += 1;
        const cant = parseInt(r.cantidad, 10) || 0;
        const cu = parseFloat(r.costo_unitario) || 0;
        totalPiezas += cant;
        totalCostoUSD += cant * cu;
      }
    });
    return {
      cantItems,
      totalPiezas,
      totalCostoUSD,
      totalCostoVES: totalCostoUSD * tasaNum,
    };
  }, [renglones, tasaNum]);

  const solicitarFinalizarRecepcion = () => {
    if (renglones.length === 0) {
      mostrarToast('Agrega al menos un producto a la lista antes de finalizar.', 'warning');
      return;
    }

    const renglonesValidos = renglones.filter((r) => r.producto_id && r.producto);
    if (renglonesValidos.length === 0) {
      mostrarToast('Selecciona un producto válido en cada renglón de la lista.', 'warning');
      return;
    }

    for (const r of renglonesValidos) {
      const c = parseInt(r.cantidad, 10);
      if (isNaN(c) || c <= 0) {
        mostrarToast(
          `La cantidad para "${r.producto.codigo_corto || r.producto.descripcion}" debe ser mayor a 0.`,
          'warning'
        );
        return;
      }
    }

    setConfirmState({ type: 'submit' });
  };

  const procesarRecepcionConfirmada = async () => {
    const renglonesValidos = renglones.filter((r) => r.producto_id && r.producto);
    const nombreProveedor = (proveedor || 'PROVEEDOR GENERAL').trim();

    setGuardando(true);
    try {
      const ahoraISO = new Date().toISOString();
      const itemsGuardados = [];

      for (const r of renglonesValidos) {
        const cantASumar = parseInt(r.cantidad, 10) || 0;
        const stockActual = parseInt(r.producto.stock, 10) || 0;
        const nuevoStock = stockActual + cantASumar;
        const nuevoCosto =
          r.costo_unitario !== '' && !isNaN(parseFloat(r.costo_unitario))
            ? parseFloat(r.costo_unitario)
            : parseFloat(r.producto.costo_usd) || 0;

        const { error: errUpdate } = await supabase
          .from('productos')
          .update({
            stock: nuevoStock,
            costo_usd: nuevoCosto,
            recien_llegado: true,
            updated_at: ahoraISO,
          })
          .eq('id', r.producto_id);

        if (errUpdate) {
          throw new Error(`Error actualizando ${r.producto.codigo_corto}: ${errUpdate.message}`);
        }

        itemsGuardados.push({
          id: r.producto_id,
          codigo_corto: r.producto.codigo_corto,
          referencia: r.producto.referencia,
          descripcion: r.producto.descripcion,
          marca: r.producto.marca_producto || r.producto.marca,
          modelo_vehiculo: r.producto.modelo_vehiculo,
          stock_anterior: stockActual,
          cantidad_recibida: cantASumar,
          nuevo_stock: nuevoStock,
          costo_unitario: nuevoCosto,
          subtotal_usd: cantASumar * nuevoCosto,
        });
      }

      const registroHistorial = {
        id: `REC-${Date.now()}`,
        fecha: fechaRecepcion,
        fechaHoraRegistro: ahoraISO,
        proveedor: nombreProveedor,
        notas: notasOperativas.trim(),
        total_renglones: renglonesValidos.length,
        total_piezas: totales.totalPiezas,
        total_costo_usd: totales.totalCostoUSD,
        total_costo_ves: totales.totalCostoVES,
        tasa_bcv: tasaNum,
        items: itemsGuardados,
      };

      setHistorialRecepciones((prev) => [registroHistorial, ...prev]);
      setNotificacionExito({
        proveedor: nombreProveedor,
        piezas: totales.totalPiezas,
        renglones: renglonesValidos.length,
        totalUSD: totales.totalCostoUSD,
      });

      invalidateCatalogoCache();
      if (typeof cargarInventario === 'function') {
        await cargarInventario();
      }

      setRenglones([]);
      setProveedor('');
      setProveedorManual(false);
      setNotasOperativas('');
      setConfirmState(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      mostrarToast('Error procesando la recepción: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <ToastNotification notification={toast} onClose={() => setToast(null)} />

      {/* Cabecera */}
      <div className="surface-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Ingreso Masivo de Mercancía
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suma existencias físicas y actualiza costos desde facturas de proveedor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {historialRecepciones.length > 0 && (
            <button
              type="button"
              onClick={() => setVerHistorial(true)}
              className="min-h-[38px] px-3 py-1.5 btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial ({historialRecepciones.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={solicitarResetear}
            className="min-h-[38px] px-3 py-1.5 btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetear</span>
          </button>
        </div>
      </div>

      {/* Banner de éxito */}
      {notificacionExito && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-heading font-bold text-sm text-emerald-800 dark:text-emerald-300">
                Recepción procesada con éxito
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                Proveedor: <strong>{notificacionExito.proveedor}</strong> ·{' '}
                {notificacionExito.renglones} productos · +{notificacionExito.piezas} unidades · Total:{' '}
                <strong className="font-mono">{formatUSD(notificacionExito.totalUSD)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificacionExito(null)}
            aria-label="Cerrar aviso"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Proveedor y Fecha */}
      <div className="surface-card p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Proveedor
            </label>
            <button
              type="button"
              onClick={() => {
                setProveedorManual(!proveedorManual);
                setProveedor('');
              }}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              {proveedorManual ? 'Elegir de lista' : '+ Escribir otro'}
            </button>
          </div>

          {proveedorManual ? (
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Escribe el nombre del proveedor..."
              className="input-field h-10 px-3.5 uppercase font-medium"
              autoFocus
            />
          ) : (
            <div className="relative">
              <select
                value={proveedor}
                onChange={(e) => {
                  if (e.target.value === '__OTRO__') {
                    setProveedorManual(true);
                    setProveedor('');
                  } else {
                    setProveedor(e.target.value);
                  }
                }}
                className="input-field h-10 px-3.5 pr-9 font-medium appearance-none cursor-pointer"
              >
                <option value="">Seleccionar proveedor...</option>
                {PROVEEDORES_SUGERIDOS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
                <option value="__OTRO__">+ Otro proveedor (escribir)...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Fecha de recepción
          </label>
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="date"
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
              className="input-field h-10 pl-9 pr-3 font-mono cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Desglose de productos */}
      <div className="surface-card overflow-visible">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center gap-2">
          <Boxes className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Productos recibidos
          </h3>
        </div>

        {/* Cabecera solo en sm+ */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-[#090d16] border-b border-slate-200 dark:border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <div className="col-span-7">Producto</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-2 text-right">Costo unit. ($)</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {renglones.map((row) => (
            <FilaRenglon
              key={row.id}
              row={row}
              productos={productos}
              onActualizar={(campo, valor) => actualizarRenglon(row.id, campo, valor)}
              onSeleccionarProducto={(prod) => seleccionarProductoEnRenglon(row.id, prod)}
              onEliminar={() => eliminarRenglon(row.id)}
              onZoom={(prod) => setRepuestoZoom(prod)}
              onCrearNuevo={(texto) => abrirModalCrearExpress(row.id, texto)}
              abrirModalCrear={abrirModalCrear}
            />
          ))}
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={agregarRenglon}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-red-50/40 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar producto a la recepción</span>
          </button>
        </div>

        {totales.cantItems > 0 && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#090d16] border-t border-slate-200/80 dark:border-white/[0.06] rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <span>
                Renglones: <strong className="font-mono text-slate-900 dark:text-white">{totales.cantItems}</strong>
              </span>
              <span>
                Unidades a sumar:{' '}
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                  +{totales.totalPiezas} un.
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Total costo:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {formatUSD(totales.totalCostoUSD)}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                ({formatVES(totales.totalCostoVES)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notas y envío */}
      <div className="surface-card p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Notas operativas
          </label>
          <textarea
            rows={2}
            value={notasOperativas}
            onChange={(e) => setNotasOperativas(e.target.value)}
            placeholder="Observaciones de la carga, factura del proveedor, etc."
            className="input-field p-3 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={solicitarFinalizarRecepcion}
            disabled={guardando || renglones.length === 0}
            className="w-full sm:w-auto min-h-[44px] px-6 btn-gradient-red text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>{guardando ? 'Procesando ingreso...' : 'Finalizar recepción masiva'}</span>
          </button>
        </div>
      </div>

      {/* Confirmaciones */}
      <ConfirmModal
        open={confirmState?.type === 'reset'}
        title="¿Resetear el formulario?"
        description="Se limpiarán todos los renglones y datos ingresados en esta recepción."
        confirmLabel="Sí, resetear"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={ejecutarResetear}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmModal
        open={confirmState?.type === 'clearHistory'}
        title="¿Vaciar historial de recepciones?"
        description="Se eliminará el registro local de recepciones guardadas en este equipo."
        confirmLabel="Vaciar historial"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          setHistorialRecepciones([]);
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmModal
        open={confirmState?.type === 'submit'}
        title="Confirmar recepción masiva"
        description="Se sumará el stock recibido al inventario actual y se actualizarán los costos."
        details={[
          { label: 'Proveedor', value: (proveedor || 'PROVEEDOR GENERAL').trim() },
          { label: 'Fecha', value: fechaRecepcion },
          { label: 'Productos válidos', value: String(totales.cantItems) },
          { label: 'Unidades a sumar', value: `+${totales.totalPiezas} un.` },
          { label: 'Costo total', value: formatUSD(totales.totalCostoUSD) },
        ]}
        confirmLabel="Confirmar ingreso"
        cancelLabel="Revisar"
        variant="primary"
        loading={guardando}
        onConfirm={procesarRecepcionConfirmada}
        onCancel={() => setConfirmState(null)}
      />

      {/* Modal Historial Recepciones */}
      {verHistorial &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setVerHistorial(false);
            }}
            className="fixed inset-0 z-[9999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-4xl w-full p-5 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Historial de recepciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {historialRecepciones.length} recepciones guardadas localmente
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {historialRecepciones.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmState({ type: 'clearHistory' })}
                      className="text-xs font-semibold text-rose-600 hover:underline mr-2 cursor-pointer"
                    >
                      Vaciar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setVerHistorial(false)}
                    aria-label="Cerrar"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[540px] text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#090d16] text-[11px] font-semibold uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Proveedor</th>
                      <th className="py-2.5 px-2 text-center">Ítems</th>
                      <th className="py-2.5 px-2 text-center">Unidades</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {historialRecepciones.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">{rec.fecha}</td>
                        <td className="py-2.5 px-3 font-semibold uppercase truncate max-w-[200px]">
                          {rec.proveedor}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{rec.total_renglones}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          +{rec.total_piezas}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {formatUSD(rec.total_costo_usd || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setRecepcionDetalleModal(rec)}
                            className="px-2.5 py-1 btn-secondary text-xs inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Detalle de recepción */}
      {recepcionDetalleModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setRecepcionDetalleModal(null);
            }}
            className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Recepción: {recepcionDetalleModal.proveedor}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {recepcionDetalleModal.fecha} · Total: {formatUSD(recepcionDetalleModal.total_costo_usd || 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecepcionDetalleModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[520px] text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#090d16] text-[11px] font-semibold uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-2 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">Costo unit.</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {(recepcionDetalleModal.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono font-bold text-red-600 dark:text-red-400">
                          {it.codigo_corto}
                        </td>
                        <td className="py-2 px-3 uppercase">{it.descripcion}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          +{it.cantidad_recibida}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatUSD(it.costo_unitario)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {formatUSD(it.subtotal_usd || it.cantidad_recibida * it.costo_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Creación Express */}
      {modalCrearExpress &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalCrearExpress(null);
            }}
            className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Registrar nuevo repuesto express
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Se guardará en el catálogo y se asignará a esta fila
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCrearExpress(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarProductoExpress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código corto *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formNuevoProd.codigo_corto}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({
                          ...prev,
                          codigo_corto: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ej. MD-COR-24"
                      className="input-field h-10 px-3 font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Referencia OEM
                    </label>
                    <input
                      type="text"
                      value={formNuevoProd.referencia}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({
                          ...prev,
                          referencia: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ej. 04465-0K090"
                      className="input-field h-10 px-3 font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNuevoProd.descripcion}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({
                          ...prev,
                          descripcion: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ej. PASTILLAS DE FRENO DELANTERAS CERÁMICA"
                      className="input-field h-10 px-3 font-semibold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formNuevoProd.marca}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({
                          ...prev,
                          marca: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ej. BOSCH, 555, ATS..."
                      className="input-field h-10 px-3 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vehículo compatible
                    </label>
                    <input
                      type="text"
                      value={formNuevoProd.modelo_vehiculo}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({ ...prev, modelo_vehiculo: e.target.value }))
                      }
                      placeholder="Ej. Toyota Corolla, Aveo..."
                      className="input-field h-10 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Línea / Sistema
                    </label>
                    <select
                      value={formNuevoProd.linea}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({ ...prev, linea: e.target.value }))
                      }
                      className="input-field h-10 px-3 cursor-pointer"
                    >
                      {[
                        'Tren Delantero y Dirección',
                        'Frenos',
                        'Motor',
                        'Suspensión',
                        'Eléctrico y Encendido',
                        'Refrigeración',
                        'Tracción y Transmisión',
                        'General',
                      ].map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Costo compra ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formNuevoProd.costo_usd}
                      onChange={(e) => {
                        const c = parseFloat(e.target.value) || 0;
                        const m = parseFloat(formNuevoProd.margen) || 35;
                        const p = c > 0 ? Number((c * (1 + m / 100)).toFixed(2)) : '';
                        setFormNuevoProd((prev) => ({
                          ...prev,
                          costo_usd: e.target.value,
                          precio_detal_usd: p,
                        }));
                      }}
                      placeholder="0.00"
                      className="input-field h-10 px-3 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 surface-muted space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Precio venta sugerido ($ USD)
                      </label>
                      <div className="flex items-center gap-1">
                        {[30, 35, 40, 50].map((mg) => (
                          <button
                            key={mg}
                            type="button"
                            onClick={() => {
                              const c = parseFloat(formNuevoProd.costo_usd) || 0;
                              const p = c > 0 ? Number((c * (1 + mg / 100)).toFixed(2)) : '';
                              setFormNuevoProd((prev) => ({
                                ...prev,
                                margen: String(mg),
                                precio_detal_usd: p,
                              }));
                            }}
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold cursor-pointer ${
                              formNuevoProd.margen === String(mg)
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            +{mg}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formNuevoProd.precio_detal_usd}
                      onChange={(e) =>
                        setFormNuevoProd((prev) => ({ ...prev, precio_detal_usd: e.target.value }))
                      }
                      placeholder="0.00"
                      className="input-field h-10 px-3 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalCrearExpress(null)}
                    className="min-h-[40px] px-4 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoNuevoProd}
                    className="min-h-[40px] px-5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{guardandoNuevoProd ? 'Guardando...' : 'Guardar y agregar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {repuestoZoom && (
        <ModalZoomRepuesto
          producto={repuestoZoom}
          onClose={() => setRepuestoZoom(null)}
          tasaBCV={tasaBCV}
        />
      )}
    </div>
  );
}

function FilaRenglon({
  row,
  productos,
  onActualizar,
  onSeleccionarProducto,
  onEliminar,
  onZoom,
  onCrearNuevo,
  abrirModalCrear,
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productosFiltrados = useMemo(() => {
    const q = (row.busqueda || '').toLowerCase().trim();
    if (!q) return productos.slice(0, 15);
    return productos
      .filter((p) => {
        const codigo = (p.codigo_corto || '').toLowerCase();
        const oem = (p.referencia || '').toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        const marca = (p.marca_producto || p.marca || '').toLowerCase();
        const vehiculo = (p.modelo_vehiculo || '').toLowerCase();
        return (
          codigo.includes(q) ||
          oem.includes(q) ||
          desc.includes(q) ||
          marca.includes(q) ||
          vehiculo.includes(q)
        );
      })
      .slice(0, 20);
  }, [productos, row.busqueda]);

  const foto = row.producto ? obtenerFotoRepuesto(row.producto) : null;

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors relative">
      {/* Producto */}
      <div className="col-span-12 sm:col-span-7 relative" ref={dropdownRef}>
        {!row.producto ? (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={row.busqueda}
              onChange={(e) => {
                onActualizar('busqueda', e.target.value);
                setDropdownAbierto(true);
              }}
              onFocus={() => setDropdownAbierto(true)}
              placeholder="Buscar por código, descripción o vehículo..."
              className="input-field h-10 pl-9 pr-8"
              autoFocus
            />
            {row.busqueda && (
              <button
                type="button"
                onClick={() => onActualizar('busqueda', '')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {dropdownAbierto && (
              <div className="absolute left-0 right-0 sm:right-auto sm:w-[560px] max-w-[calc(100vw-2.5rem)] top-full mt-1.5 bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl z-[999] max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] animate-fade-in">
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#090d16] text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Resultados ({productosFiltrados.length})</span>
                  <span>Selecciona un repuesto</span>
                </div>

                {productosFiltrados.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500 space-y-3">
                    <p>
                      No se encontraron repuestos con «<strong className="font-mono">{row.busqueda}</strong>».
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownAbierto(false);
                          onCrearNuevo?.(row.busqueda);
                        }}
                        className="px-3.5 py-2 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar nuevo en catálogo</span>
                      </button>
                      {typeof abrirModalCrear === 'function' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownAbierto(false);
                            abrirModalCrear();
                          }}
                          className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                        >
                          Ficha completa
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {productosFiltrados.map((p) => {
                      const f = obtenerFotoRepuesto(p);
                      const stock = parseInt(p.stock, 10) || 0;
                      const costo = parseFloat(p.costo_usd) || 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSeleccionarProducto(p);
                            setDropdownAbierto(false);
                          }}
                          className="p-3 hover:bg-red-50/70 dark:hover:bg-white/[0.06] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              {f ? (
                                <img src={f} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-1.5 py-0.5 rounded text-[11px]">
                                  {p.codigo_corto}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  {p.marca_producto || p.marca}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 uppercase truncate">
                                {p.descripcion}
                              </div>
                              {p.modelo_vehiculo && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                  <Car className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{p.modelo_vehiculo}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-0.5 font-mono">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full block ${
                                stock > 0
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              }`}
                            >
                              Stock: {stock}
                            </span>
                            {costo > 0 && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                ${costo.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-2.5 bg-slate-50 dark:bg-[#090d16] flex items-center justify-between gap-2 sticky bottom-0">
                      <span className="text-[11px] text-slate-500">¿No aparece en la lista?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownAbierto(false);
                          onCrearNuevo?.(row.busqueda);
                        }}
                        className="px-3 py-1.5 btn-gradient-red text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear nuevo</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-xl surface-muted">
            <button
              type="button"
              onClick={() => onZoom(row.producto)}
              className="w-10 h-10 rounded-lg bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer p-0.5"
              title="Ampliar foto"
            >
              {foto ? (
                <img src={foto} alt="" className="w-full h-full object-contain" />
              ) : (
                <Package className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300">
                  {row.producto.codigo_corto}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Stock actual: {row.producto.stock ?? 0}
                </span>
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-xs truncate mt-0.5">
                {row.producto.descripcion}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onActualizar('producto', null)}
              aria-label="Cambiar producto"
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cantidad */}
      <div className="col-span-5 sm:col-span-2 flex flex-col sm:items-center">
        <span className="sm:hidden text-[11px] font-semibold text-slate-500 mb-1">Cantidad</span>
        <input
          type="number"
          min="1"
          value={row.cantidad}
          onChange={(e) => onActualizar('cantidad', e.target.value)}
          className="input-field h-10 sm:w-24 px-2 text-center font-mono font-bold"
        />
      </div>

      {/* Costo unitario */}
      <div className="col-span-5 sm:col-span-2 flex flex-col sm:items-end">
        <span className="sm:hidden text-[11px] font-semibold text-slate-500 mb-1">Costo ($)</span>
        <div className="relative w-full sm:w-28">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={row.costo_unitario}
            onChange={(e) => onActualizar('costo_unitario', e.target.value)}
            placeholder="0.00"
            className="input-field h-10 pl-6 pr-2 text-right font-mono font-bold"
          />
        </div>
      </div>

      {/* Eliminar */}
      <div className="col-span-2 sm:col-span-1 flex items-end sm:items-center justify-end sm:justify-center h-full">
        <button
          type="button"
          onClick={onEliminar}
          aria-label="Eliminar fila"
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

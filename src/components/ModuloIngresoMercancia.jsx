import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  PlusCircle,
  Trash2, 
  RotateCcw, 
  Calendar, 
  Boxes, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ChevronDown,
  History,
  X,
  Eye,
  Check,
  Edit2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatUSD, formatVES, parseVenezuelanNumber } from '../lib/formatters';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import ModalZoomRepuesto from './ModalZoomRepuesto';

// Proveedores frecuentes en el mercado de repuestos
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
  'Inversiones AutoPartes C.A.'
];

export default function ModuloIngresoMercancia({ productos = [], cargarInventario, tasaBCV, abrirModalCrear }) {
  // Tasa de cambio numérica
  const tasaNum = useMemo(() => parseVenezuelanNumber(tasaBCV) || 1, [tasaBCV]);

  // Formulario principal
  const [proveedor, setProveedor] = useState('');
  const [proveedorManual, setProveedorManual] = useState(false);
  const [fechaRecepcion, setFechaRecepcion] = useState(() => new Date().toISOString().split('T')[0]);
  const [notasOperativas, setNotasOperativas] = useState('');

  // Renglones de la recepción
  // Cada renglón: { id, producto_id, producto, cantidad, costo_unitario, busqueda, buscando }
  const [renglones, setRenglones] = useState([]);

  // Estados de proceso y UI
  const [guardando, setGuardando] = useState(false);
  const [notificacionExito, setNotificacionExito] = useState(null);
  const [repuestoZoom, setRepuestoZoom] = useState(null);
  const [verHistorial, setVerHistorial] = useState(false);
  const [recepcionDetalleModal, setRecepcionDetalleModal] = useState(null);

  // Modal para creación express de producto nuevo
  const [modalCrearExpress, setModalCrearExpress] = useState(null); // { rowId: string }
  const [guardandoNuevoProd, setGuardandoNuevoProd] = useState(false);
  const [formNuevoProd, setFormNuevoProd] = useState({
    codigo_corto: '',
    referencia: '',
    descripcion: '',
    marca: '',
    modelo_vehiculo: '',
    linea: 'Tren Delantero',
    costo_usd: '',
    precio_detal_usd: '',
    margen: '35'
  });

  // Abrir creación express pre-llenando con el texto buscado
  const abrirModalCrearExpress = (rowId, texto = '') => {
    const t = (texto || '').trim();
    const pareceCodigo = t.length > 0 && (!t.includes(' ') || t.length <= 8);
    setFormNuevoProd({
      codigo_corto: pareceCodigo ? t.toUpperCase() : '',
      referencia: '',
      descripcion: !pareceCodigo ? t.toUpperCase() : '',
      marca: '',
      modelo_vehiculo: '',
      linea: 'Tren Delantero',
      costo_usd: '',
      precio_detal_usd: '',
      margen: '35'
    });
    setModalCrearExpress({ rowId });
  };

  // Guardar producto express en Supabase y añadirlo directamente a la fila
  const guardarProductoExpress = async (e) => {
    if (e) e.preventDefault();
    const cod = formNuevoProd.codigo_corto.trim().toUpperCase();
    const desc = formNuevoProd.descripcion.trim().toUpperCase();
    if (!cod || !desc) {
      alert('El Código Corto y la Descripción son obligatorios para crear el repuesto.');
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
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('productos')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Asignar el nuevo producto a la fila activa
      if (modalCrearExpress?.rowId) {
        seleccionarProductoEnRenglon(modalCrearExpress.rowId, data);
        if (costoNum > 0) {
          actualizarRenglon(modalCrearExpress.rowId, 'costo_unitario', costoNum);
        }
      }

      // Recargar catálogo global
      if (typeof cargarInventario === 'function') {
        cargarInventario();
      }

      setModalCrearExpress(null);
    } catch (err) {
      console.error('Error creando producto express:', err);
      alert('Error al registrar nuevo producto: ' + err.message);
    } finally {
      setGuardandoNuevoProd(false);
    }
  };

  // Historial local de recepciones
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

  // Agregar una nueva fila de producto
  const agregarRenglon = () => {
    const nuevo = {
      id: `renglon-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      producto_id: '',
      producto: null,
      cantidad: 1,
      costo_unitario: '',
      busqueda: '',
      buscando: true
    };
    setRenglones(prev => [...prev, nuevo]);
  };

  // Quitar una fila
  const eliminarRenglon = (rowId) => {
    setRenglones(prev => prev.filter(r => r.id !== rowId));
  };

  // Modificar campo de un renglón
  const actualizarRenglon = (rowId, campo, valor) => {
    setRenglones(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, [campo]: valor };
    }));
  };

  // Seleccionar producto en un renglón
  const seleccionarProductoEnRenglon = (rowId, prod) => {
    setRenglones(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        producto_id: prod.id,
        producto: prod,
        costo_unitario: prod.costo_usd ?? '',
        busqueda: '',
        buscando: false
      };
    }));
  };

  // Resetear todo el formulario
  const resetearFormulario = () => {
    if (renglones.length > 0 || proveedor || notasOperativas) {
      if (!window.confirm('¿Deseas resetear el formulario y vaciar todos los renglones?')) {
        return;
      }
    }
    setProveedor('');
    setProveedorManual(false);
    setFechaRecepcion(new Date().toISOString().split('T')[0]);
    setNotasOperativas('');
    setRenglones([]);
    setNotificacionExito(null);
  };

  // Totales calculados de la recepción
  const totales = useMemo(() => {
    let cantItems = 0;
    let totalPiezas = 0;
    let totalCostoUSD = 0;

    renglones.forEach(r => {
      if (r.producto_id) {
        cantItems += 1;
        const cant = parseInt(r.cantidad, 10) || 0;
        const cu = parseFloat(r.costo_unitario) || 0;
        totalPiezas += cant;
        totalCostoUSD += (cant * cu);
      }
    });

    return {
      cantItems,
      totalPiezas,
      totalCostoUSD,
      totalCostoVES: totalCostoUSD * tasaNum
    };
  }, [renglones, tasaNum]);

  // Finalizar y procesar recepción masiva en Supabase
  const finalizarRecepcion = async () => {
    // Validaciones
    if (renglones.length === 0) {
      alert('Debes agregar al menos un producto a la lista antes de finalizar.');
      return;
    }

    const renglonesValidos = renglones.filter(r => r.producto_id && r.producto);
    if (renglonesValidos.length === 0) {
      alert('Por favor selecciona los productos en cada renglón de la lista.');
      return;
    }

    for (const r of renglonesValidos) {
      const c = parseInt(r.cantidad, 10);
      if (isNaN(c) || c <= 0) {
        alert(`La cantidad para el producto "${r.producto.codigo_corto || r.producto.descripcion}" debe ser mayor a 0.`);
        return;
      }
    }

    const nombreProveedor = (proveedor || 'PROVEEDOR GENERAL').trim();

    const confirmar = window.confirm(
      `¿Confirmas finalizar la Recepción Masiva?\n\n` +
      `Proveedor: ${nombreProveedor}\n` +
      `Fecha: ${fechaRecepcion}\n` +
      `Productos: ${renglonesValidos.length} renglones\n` +
      `Piezas a sumar al inventario: +${totales.totalPiezas} unidades\n` +
      `Total Costo: ${formatUSD(totales.totalCostoUSD)}`
    );
    if (!confirmar) return;

    setGuardando(true);
    try {
      const ahoraISO = new Date().toISOString();
      const itemsGuardados = [];

      // Actualizar cada producto en Supabase (sumando al stock actual)
      for (const r of renglonesValidos) {
        const cantASumar = parseInt(r.cantidad, 10) || 0;
        const stockActual = parseInt(r.producto.stock, 10) || 0;
        const nuevoStock = stockActual + cantASumar;
        const nuevoCosto = r.costo_unitario !== '' && !isNaN(parseFloat(r.costo_unitario))
          ? parseFloat(r.costo_unitario)
          : parseFloat(r.producto.costo_usd) || 0;

        const { error: errUpdate } = await supabase
          .from('productos')
          .update({
            stock: nuevoStock,
            costo_usd: nuevoCosto,
            recien_llegado: true,
            updated_at: ahoraISO
          })
          .eq('id', r.producto_id);

        if (errUpdate) {
          throw new Error(`Error actualizando producto ${r.producto.codigo_corto}: ${errUpdate.message}`);
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
          subtotal_usd: cantASumar * nuevoCosto
        });
      }

      // Guardar en el Historial de Recepciones
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
        items: itemsGuardados
      };

      setHistorialRecepciones(prev => [registroHistorial, ...prev]);

      // Notificación de éxito
      setNotificacionExito({
        proveedor: nombreProveedor,
        piezas: totales.totalPiezas,
        renglones: renglonesValidos.length,
        totalUSD: totales.totalCostoUSD
      });

      // Recargar catálogo en toda la aplicación
      if (typeof cargarInventario === 'function') {
        await cargarInventario();
      }

      // Limpiar formulario
      setRenglones([]);
      setProveedor('');
      setProveedorManual(false);
      setNotasOperativas('');

      // Desplazar suavemente a la parte superior
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error al finalizar recepción masiva:', err);
      alert('Ocurrió un error al procesar la recepción:\n' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* =================================================================== */}
      {/* 1. ENCABEZADO: TÍTULO, SUBTÍTULO Y BOTÓN RESETEAR                   */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Icono cuadrado negro redondeado con signo + */}
          <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-md shrink-0">
            <PlusCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Nueva Entrada Masiva
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Registre múltiples productos en una sola operación logística.
            </p>
          </div>
        </div>

        {/* Acciones de cabecera: Resetear e Historial */}
        <div className="flex items-center gap-2">
          {historialRecepciones.length > 0 && (
            <button
              type="button"
              onClick={() => setVerHistorial(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ver recepciones anteriores"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Historial ({historialRecepciones.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetearFormulario}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetear</span>
          </button>
        </div>
      </div>

      {/* BANNER DE NOTIFICACIÓN DE ÉXITO */}
      {notificacionExito && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100 flex items-start justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                ¡Recepción Masiva Procesada con Éxito!
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Se ingresaron existencias de <strong>{notificacionExito.proveedor}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 font-mono font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
                <span>📦 {notificacionExito.renglones} productos actualizados</span>
                <span>•</span>
                <span>➕ {notificacionExito.piezas} unidades físicas sumadas</span>
                <span>•</span>
                <span>💵 Total: {formatUSD(notificacionExito.totalUSD)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificacionExito(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. CAMPOS SUPERIORES: PROVEEDOR & FECHA RECEPCIÓN                   */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* PROVEEDOR (7 cols) */}
        <div className="md:col-span-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Proveedor
            </label>
            <button
              type="button"
              onClick={() => {
                setProveedorManual(!proveedorManual);
                setProveedor('');
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
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
              className="w-full h-11 px-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm transition-all uppercase"
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
                className="w-full h-11 px-4 pr-10 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm transition-all appearance-none cursor-pointer"
              >
                <option value="">Seleccionar Proveedor...</option>
                {PROVEEDORES_SUGERIDOS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
                <option value="__OTRO__">+ Otro proveedor (escribir nuevo)...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* FECHA RECEPCIÓN (4 cols) */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Fecha Recepción
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer font-mono"
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. SECCIÓN: DESGLOSE DE PRODUCTOS RECIBIDOS                         */}
      {/* =================================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Icono de caja azul/morada */}
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Boxes className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200">
            DESGLOSE DE PRODUCTOS RECIBIDOS
          </h2>
        </div>

        {/* CONTENEDOR / TABLA */}
        <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-visible">
          
          {/* Encabezados de tabla */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] rounded-t-2xl text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
            <div className="col-span-12 sm:col-span-7">PRODUCTO</div>
            <div className="col-span-4 sm:col-span-2 text-center">CANTIDAD</div>
            <div className="col-span-4 sm:col-span-2 text-right">COSTO UNIT. (USD)</div>
            <div className="col-span-4 sm:col-span-1 text-center">ACCIONES</div>
          </div>

          {/* Renglones / Filas */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {renglones.map((row, idx) => (
              <FilaRenglon
                key={row.id}
                row={row}
                index={idx}
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

          {/* Botón "+ Agregar otro producto a la lista" */}
          <div className="p-3 sm:p-4 bg-slate-50/40 dark:bg-white/[0.01] rounded-b-2xl">
            <button
              type="button"
              onClick={agregarRenglon}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/40 dark:hover:border-indigo-700/60 bg-white hover:bg-indigo-50/40 dark:bg-transparent dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Agregar otro producto a la lista</span>
            </button>
          </div>

          {/* Barra de totales / resumen si hay renglones válidos */}
          {totales.cantItems > 0 && (
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/[0.06] rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Renglones: <strong className="text-slate-800 dark:text-slate-100">{totales.cantItems}</strong></span>
                <span>•</span>
                <span>Unidades a Ingresar: <strong className="text-emerald-600 dark:text-emerald-400">+{totales.totalPiezas} un.</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Total Costo:</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {formatUSD(totales.totalCostoUSD)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({formatVES(totales.totalCostoVES)})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. NOTAS OPERATIVAS & BOTÓN FINALIZAR RECEPCIÓN MASIVA              */}
      {/* =================================================================== */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas Operativas
          </label>
          <textarea
            rows={3}
            value={notasOperativas}
            onChange={(e) => setNotasOperativas(e.target.value)}
            placeholder="Observaciones de la carga, calidad, factura #, etc."
            className="w-full p-3.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm transition-all resize-none"
          />
        </div>

        {/* Botón Acción Principal: "Finalizar Recepción Masiva" */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={finalizarRecepcion}
            disabled={guardando || renglones.length === 0}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 ${
              renglones.length === 0 || guardando
                ? 'bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-[#E11D48] hover:bg-[#BE123C] shadow-rose-600/25 hover:shadow-rose-600/35'
            }`}
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando Ingreso...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Finalizar Recepción Masiva</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: HISTORIAL DE RECEPCIONES                                     */}
      {/* =================================================================== */}
      {verHistorial && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setVerHistorial(false); }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/20 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl p-5 space-y-4 cursor-default animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                    Historial de Recepciones Masivas
                  </h3>
                  <p className="text-xs text-slate-400">
                    {historialRecepciones.length} recepciones registradas en este equipo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {historialRecepciones.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas vaciar el historial de recepciones?')) {
                        setHistorialRecepciones([]);
                      }
                    }}
                    className="text-xs text-red-500 hover:underline mr-2 cursor-pointer"
                  >
                    Vaciar Historial
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVerHistorial(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {historialRecepciones.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>No hay recepciones registradas aún.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-white/[0.04] text-[10px] font-mono uppercase font-bold text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Proveedor</th>
                      <th className="py-3 px-2 text-center">Renglones</th>
                      <th className="py-3 px-2 text-center">Unidades</th>
                      <th className="py-3 px-3 text-right">Total ($)</th>
                      <th className="py-3 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {historialRecepciones.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {rec.fecha}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white uppercase truncate max-w-[180px]">
                          {rec.proveedor}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          {rec.total_renglones}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{rec.total_piezas} un.
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {formatUSD(rec.total_costo_usd || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setRecepcionDetalleModal(rec)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
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
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DETALLE DE RECEPCIÓN HISTÓRICA                                */}
      {/* =================================================================== */}
      {recepcionDetalleModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setRecepcionDetalleModal(null); }}
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/20 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 p-5 cursor-default animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                  Recepción: {recepcionDetalleModal.proveedor}
                </h3>
                <p className="text-xs text-slate-400">
                  Fecha: {recepcionDetalleModal.fecha} • Total: {formatUSD(recepcionDetalleModal.total_costo_usd || 0)}
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

            {/* Tabla de ítems en este comprobante */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-white/[0.04] text-[10px] font-mono font-bold uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-3 text-right">Costo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {(recepcionDetalleModal.items || []).map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {it.codigo_corto}
                      </td>
                      <td className="py-2 px-3 uppercase text-slate-800 dark:text-slate-200">
                        {it.descripcion}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-emerald-600">
                        +{it.cantidad_recibida}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatUSD(it.costo_unitario)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {formatUSD(it.subtotal_usd || (it.cantidad_recibida * it.costo_unitario))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recepcionDetalleModal.notas && (
              <div className="text-xs text-slate-500 bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl">
                <strong>Notas:</strong> {recepcionDetalleModal.notas}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRecepcionDetalleModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: REGISTRAR NUEVO PRODUCTO EXPRESS EN CATÁLOGO                 */}
      {/* =================================================================== */}
      {modalCrearExpress && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalCrearExpress(null); }}
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/20 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 cursor-default"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Registrar Nuevo Repuesto en Catálogo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Se guardará en el catálogo general y se asignará automáticamente a esta recepción.
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

            {/* Formulario */}
            <form onSubmit={guardarProductoExpress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Código Corto */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Código Corto / Referencia Proveedor</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNuevoProd.codigo_corto}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, codigo_corto: e.target.value.toUpperCase() }))}
                    placeholder="Ej. MD-COR-24, 555-SB36, etc."
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 uppercase"
                    autoFocus
                  />
                </div>

                {/* Referencia OEM */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nº OEM Original (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formNuevoProd.referencia}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, referencia: e.target.value.toUpperCase() }))}
                    placeholder="Ej. 04465-0K090"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                {/* Descripción (2 cols) */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Descripción del Repuesto</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNuevoProd.descripcion}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, descripcion: e.target.value.toUpperCase() }))}
                    placeholder="Ej. PASTILLAS DE FRENO DELANTERAS CERÁMICA"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                {/* Marca */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Marca del Producto
                  </label>
                  <input
                    type="text"
                    list="marcas-sugeridas-express"
                    value={formNuevoProd.marca}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, marca: e.target.value.toUpperCase() }))}
                    placeholder="Ej. BOSCH, 555, ATS, GABRIEL..."
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 uppercase"
                  />
                  <datalist id="marcas-sugeridas-express">
                    {['555', 'BOSCH', 'ATS', 'GABRIEL', 'NGK', 'DENSO', 'MOTORCRAFT', 'VALEO', 'CARDONE', 'ACDELCO', 'GENÉRICO'].map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                {/* Vehículo / Aplicación */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Vehículo / Aplicación
                  </label>
                  <input
                    type="text"
                    value={formNuevoProd.modelo_vehiculo}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, modelo_vehiculo: e.target.value }))}
                    placeholder="Ej. Toyota Corolla, Aveo, Yaris..."
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Línea / Categoría */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Línea / Sistema
                  </label>
                  <select
                    value={formNuevoProd.linea}
                    onChange={(e) => setFormNuevoProd(prev => ({ ...prev, linea: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {['Frenos', 'Motor', 'Suspensión', 'Tren Delantero', 'Eléctrico', 'Refrigeración', 'Transmisión', 'Filtros', 'General'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Costo de Compra USD */}
                <div className="space-y-1">
                  <label className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Costo Compra ($ USD)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Factura</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formNuevoProd.costo_usd}
                      onChange={(e) => {
                        const c = parseFloat(e.target.value) || 0;
                        const m = parseFloat(formNuevoProd.margen) || 35;
                        const p = c > 0 ? Number((c * (1 + m / 100)).toFixed(2)) : '';
                        setFormNuevoProd(prev => ({ ...prev, costo_usd: e.target.value, precio_detal_usd: p }));
                      }}
                      placeholder="0.00"
                      className="w-full h-10 pl-7 pr-3 bg-white dark:bg-[#06080F] border-2 border-emerald-500/40 rounded-xl font-mono font-bold text-emerald-800 dark:text-emerald-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Precio Venta Detal USD */}
                <div className="sm:col-span-2 space-y-1 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/60 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Precio de Venta Sugerido ($ USD)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">Margen:</span>
                      {[30, 35, 40, 50].map(mg => (
                        <button
                          key={mg}
                          type="button"
                          onClick={() => {
                            const c = parseFloat(formNuevoProd.costo_usd) || 0;
                            const p = c > 0 ? Number((c * (1 + mg / 100)).toFixed(2)) : '';
                            setFormNuevoProd(prev => ({ ...prev, margen: String(mg), precio_detal_usd: p }));
                          }}
                          className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                            formNuevoProd.margen === String(mg)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          +{mg}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formNuevoProd.precio_detal_usd}
                      onChange={(e) => setFormNuevoProd(prev => ({ ...prev, precio_detal_usd: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 pl-7 pr-3 bg-white dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setModalCrearExpress(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNuevoProd}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {guardandoNuevoProd ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando en Catálogo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar y Agregar a la Recepción</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM DE REPUESTO */}
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

// =========================================================================
// SUBCOMPONENTE: FILA DE RENGLÓN EN LA TABLA
// =========================================================================
function FilaRenglon({ 
  row, 
  index, 
  productos, 
  onActualizar, 
  onSeleccionarProducto, 
  onEliminar, 
  onZoom, 
  onCrearNuevo,
  abrirModalCrear 
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Coincidencias de búsqueda
  const productosFiltrados = useMemo(() => {
    const q = (row.busqueda || '').toLowerCase().trim();
    if (!q) return productos.slice(0, 15);

    return productos.filter(p => {
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
    }).slice(0, 20);
  }, [productos, row.busqueda]);

  const foto = row.producto ? obtenerFotoRepuesto(row.producto) : null;

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors relative">
      
      {/* 1. PRODUCTO (col-span-7) */}
      <div className="col-span-12 sm:col-span-7 relative" ref={dropdownRef}>
        {!row.producto ? (
          // Input de Búsqueda interactivo
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={row.busqueda}
              onChange={(e) => {
                onActualizar('busqueda', e.target.value);
                setDropdownAbierto(true);
              }}
              onFocus={() => setDropdownAbierto(true)}
              placeholder="Buscar por código, descripción, vehículo..."
              className="w-full h-10 pl-9 pr-8 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 uppercase transition-all shadow-sm"
              autoFocus
            />
            {row.busqueda && (
              <button
                type="button"
                onClick={() => onActualizar('busqueda', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown flotante amplio y sin recortes */}
            {dropdownAbierto && (
              <div className="absolute left-0 top-full mt-2 w-[520px] sm:w-[600px] max-w-[92vw] bg-white dark:bg-[#0F1420] border-2 border-indigo-200 dark:border-indigo-700/60 rounded-2xl shadow-2xl z-[999] max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] animate-fadeIn">
                <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.03] text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between">
                  <span>Resultados del Catálogo ({productosFiltrados.length})</span>
                  <span>Selecciona un repuesto</span>
                </div>

                {productosFiltrados.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 space-y-3">
                    <p className="font-medium text-slate-500">
                      No se encontraron repuestos con <strong className="text-slate-800 dark:text-slate-200 font-mono">"{row.busqueda}"</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownAbierto(false);
                          if (onCrearNuevo) onCrearNuevo(row.busqueda);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar como Nuevo en Catálogo</span>
                      </button>

                      {typeof abrirModalCrear === 'function' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownAbierto(false);
                            abrirModalCrear();
                          }}
                          className="px-3 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs underline cursor-pointer"
                        >
                          Ficha detallada
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {productosFiltrados.map(p => {
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
                          className="p-3 hover:bg-indigo-50/80 dark:hover:bg-white/[0.08] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Miniatura foto */}
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              {f ? (
                                <img src={f} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            {/* Info producto */}
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-white bg-indigo-600 px-2 py-0.5 rounded-md text-[11px] shadow-xs">
                                  {p.codigo_corto}
                                </span>
                                {p.referencia && p.referencia !== p.codigo_corto && (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    OEM: {p.referencia}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                  {p.marca_producto || p.marca}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 uppercase text-xs truncate">
                                {p.descripcion}
                              </div>
                              {p.modelo_vehiculo && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  🚗 {p.modelo_vehiculo}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stock y Costo */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              stock > 0 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              Stock: {stock} un.
                            </span>
                            {costo > 0 && (
                              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                Costo: ${costo.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Botón persistente al final del dropdown */}
                    <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-sm">
                      <span className="text-[11px] text-slate-500 font-medium">¿Es una pieza nueva que no existe?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownAbierto(false);
                          if (onCrearNuevo) onCrearNuevo(row.busqueda);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Registrar Producto Nuevo</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          // Chip de Producto Seleccionado
          <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10">
            {/* Foto con zoom */}
            <button
              type="button"
              onClick={() => onZoom(row.producto)}
              className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer p-0.5 hover:ring-2 hover:ring-indigo-500 transition-all"
              title="Click para ampliar imagen"
            >
              {foto ? (
                <img src={foto} alt="" className="w-full h-full object-contain" />
              ) : (
                <Package className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Datos del producto */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {row.producto.codigo_corto}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Stock: {row.producto.stock ?? 0}
                </span>
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] truncate" title={row.producto.descripcion}>
                {row.producto.descripcion}
              </div>
            </div>

            {/* Botón cambiar producto */}
            <button
              type="button"
              onClick={() => onActualizar('producto', null)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer transition-colors"
              title="Elegir otro producto"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. CANTIDAD (col-span-2) */}
      <div className="col-span-4 sm:col-span-2 flex flex-col items-center justify-center">
        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad</span>
        <input
          type="number"
          min="1"
          value={row.cantidad}
          onChange={(e) => onActualizar('cantidad', e.target.value)}
          placeholder="1"
          className="w-24 h-10 px-2 text-center bg-white dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* 3. COSTO UNIT. (USD) (col-span-2) */}
      <div className="col-span-4 sm:col-span-2 flex flex-col items-end justify-center">
        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Costo ($)</span>
        <div className="relative w-28">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={row.costo_unitario}
            onChange={(e) => onActualizar('costo_unitario', e.target.value)}
            placeholder="0.00"
            className="w-full h-10 pl-6 pr-2 text-right bg-white dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* 4. ACCIONES (col-span-1) */}
      <div className="col-span-4 sm:col-span-1 flex items-center justify-center">
        <button
          type="button"
          onClick={onEliminar}
          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          title="Eliminar producto de la lista"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

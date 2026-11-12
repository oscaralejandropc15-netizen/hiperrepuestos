import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Truck, 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  RotateCcw, 
  DollarSign, 
  Percent, 
  FileText, 
  Calendar, 
  Boxes, 
  Tag, 
  Car, 
  Eye, 
  TrendingUp, 
  History, 
  Receipt, 
  Building2, 
  Clock, 
  ArrowUpRight, 
  Minus, 
  Sparkles, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatUSD, formatVES, formatNumber, parseVenezuelanNumber } from '../lib/formatters';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import ModalZoomRepuesto from './ModalZoomRepuesto';

// Proveedores frecuentes sugeridos en el mercado de autopartes venezolano
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

export default function ModuloIngresoMercancia({ productos, cargarInventario, tasaBCV, abrirModalCrear }) {
  // Pestaña activa dentro del módulo de ingreso
  // 'factura' = Recepción de factura multi-ítem en lote
  // 'rapido'  = Ajuste / Entrada exprés 1 a 1
  // 'historial'= Historial de facturas recepcionadas
  const [subTab, setSubTab] = useState('factura');

  // Tasa de cambio numérica
  const tasaNum = useMemo(() => parseVenezuelanNumber(tasaBCV) || 1, [tasaBCV]);

  // KPIs globales de almacén
  const metricasAlmacen = useMemo(() => {
    let stockTotal = 0;
    let agotados = 0;
    let valorCostoTotal = 0;

    productos.forEach(p => {
      const s = parseInt(p.stock, 10) || 0;
      const c = parseFloat(p.costo_usd) || 0;
      stockTotal += s;
      if (s <= 0) agotados += 1;
      valorCostoTotal += (s * c);
    });

    return {
      totalItems: productos.length,
      stockTotal,
      agotados,
      valorCostoTotal
    };
  }, [productos]);

  // =========================================================================
  // MODO 1: RECEPCIÓN DE FACTURA DE PROVEEDOR EN LOTE (MULTI-ITEM)
  // =========================================================================
  const [datosFactura, setDatosFactura] = useState({
    proveedor: '',
    numero_factura: '',
    fecha: new Date().toISOString().split('T')[0],
    condicion_pago: 'Contado', // 'Contado' | 'Crédito (15d)' | 'Crédito (30d)' | 'Consignación'
    notas: '',
    marcarRecienLlegado: true
  });

  // Lista de renglones en la factura actual a recepcionar
  const [renglonesFactura, setRenglonesFactura] = useState([]);
  
  // Búsqueda para agregar repuesto a la factura
  const [busquedaRepuesto, setBusquedaRepuesto] = useState('');
  const [mostrarDropdownBusqueda, setMostrarDropdownBusqueda] = useState(false);
  const inputBusquedaRef = useRef(null);

  // Repuesto para Zoom Modal
  const [repuestoZoom, setRepuestoZoom] = useState(null);

  // Estados de proceso
  const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);
  const [notificacionExito, setNotificacionExito] = useState(null);

  // Historial persistente en localStorage
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

  // Modal de detalle de una recepción histórica
  const [recepcionDetalleModal, setRecepcionDetalleModal] = useState(null);

  // =========================================================================
  // FILTRADO DE REPUESTOS EN BÚSQUEDA
  // =========================================================================
  const repuestosFiltrados = useMemo(() => {
    const q = busquedaRepuesto.toLowerCase().trim();
    if (!q) return [];
    
    return productos.filter(p => {
      const codigo = (p.codigo_corto || '').toLowerCase();
      const oem = (p.referencia || '').toLowerCase();
      const desc = (p.descripcion || '').toLowerCase();
      const marca = (p.marca_producto || p.marca || '').toLowerCase();
      const vehiculo = (p.modelo_vehiculo || '').toLowerCase();
      const sublinea = (p.sublinea || '').toLowerCase();

      return (
        codigo.includes(q) ||
        oem.includes(q) ||
        desc.includes(q) ||
        marca.includes(q) ||
        vehiculo.includes(q) ||
        sublinea.includes(q)
      );
    }).slice(0, 10);
  }, [productos, busquedaRepuesto]);

  // Agregar un repuesto a la factura
  const agregarAFactura = (producto) => {
    setRenglonesFactura(prev => {
      const existeIndex = prev.findIndex(r => r.id === producto.id);
      if (existeIndex >= 0) {
        // Ya existe: incrementar cantidad recibida en 1
        const copia = [...prev];
        copia[existeIndex] = {
          ...copia[existeIndex],
          cantidad_recibida: Number(copia[existeIndex].cantidad_recibida || 0) + 1
        };
        return copia;
      }

      // Nuevo renglón
      const costoActual = parseFloat(producto.costo_usd) || 0;
      const precioDetal = parseFloat(producto.precio_detal_usd) || 0;

      const nuevoRenglon = {
        id: producto.id,
        codigo_corto: producto.codigo_corto || '',
        referencia: producto.referencia || '',
        descripcion: producto.descripcion || '',
        marca: producto.marca_producto || producto.marca || 'GENÉRICO',
        modelo_vehiculo: producto.modelo_vehiculo || 'Universal',
        linea: producto.linea || 'General',
        sublinea: producto.sublinea || 'General',
        imagen_url: producto.imagen_url || null,
        stock_actual: parseInt(producto.stock, 10) || 0,
        cantidad_recibida: 1,
        costo_unitario: costoActual,
        costo_anterior: costoActual,
        precio_detal: precioDetal,
        precio_anterior: precioDetal
      };

      return [nuevoRenglon, ...prev];
    });

    setBusquedaRepuesto('');
    setMostrarDropdownBusqueda(false);
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  };

  // Modificar campo de un renglón
  const modificarRenglon = (id, campo, valor) => {
    setRenglonesFactura(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        [campo]: valor
      };
    }));
  };

  // Eliminar renglón de la factura
  const eliminarRenglon = (id) => {
    setRenglonesFactura(prev => prev.filter(r => r.id !== id));
  };

  // Aplicar margen porcentual uniforme a los renglones (e.g. 35%, 40%)
  const aplicarMargenUniforme = (porcentaje) => {
    setRenglonesFactura(prev => prev.map(r => {
      const costo = parseFloat(r.costo_unitario) || 0;
      if (costo <= 0) return r;
      const nuevoPrecio = Number((costo * (1 + porcentaje / 100)).toFixed(2));
      return {
        ...r,
        precio_detal: nuevoPrecio
      };
    }));
  };

  // Totales de la factura actual
  const totalesFactura = useMemo(() => {
    let piezas = 0;
    let totalCostoUSD = 0;
    let totalVentaEstimadaUSD = 0;

    renglonesFactura.forEach(r => {
      const cant = parseInt(r.cantidad_recibida, 10) || 0;
      const costo = parseFloat(r.costo_unitario) || 0;
      const precio = parseFloat(r.precio_detal) || 0;

      piezas += cant;
      totalCostoUSD += (cant * costo);
      totalVentaEstimadaUSD += (cant * precio);
    });

    const gananciaEstimadaUSD = totalVentaEstimadaUSD - totalCostoUSD;
    const margenPromedio = totalVentaEstimadaUSD > 0 
      ? Math.round((gananciaEstimadaUSD / totalVentaEstimadaUSD) * 100) 
      : 0;

    return {
      itemsDiferentes: renglonesFactura.length,
      piezas,
      totalCostoUSD,
      totalCostoVES: totalCostoUSD * tasaNum,
      totalVentaEstimadaUSD,
      gananciaEstimadaUSD,
      margenPromedio
    };
  }, [renglonesFactura, tasaNum]);

  // PROCESAR Y GUARDAR RECEPCIÓN EN SUPABASE
  const procesarRecepcionFactura = async (e) => {
    if (e) e.preventDefault();

    if (renglonesFactura.length === 0) {
      alert('Debes agregar al menos un repuesto a la factura.');
      return;
    }

    // Validar cantidades
    for (const r of renglonesFactura) {
      const cant = parseInt(r.cantidad_recibida, 10);
      if (!cant || cant <= 0) {
        alert(`La cantidad para el repuesto "${r.codigo_corto}" debe ser mayor a 0.`);
        return;
      }
    }

    const confirmacion = window.confirm(
      `¿Confirmas la recepción de esta factura?\n\n` +
      `Proveedor: ${datosFactura.proveedor || 'Sin especificar'}\n` +
      `Nº Factura: ${datosFactura.numero_factura || 'S/N'}\n` +
      `Repuestos: ${totalesFactura.itemsDiferentes} renglones\n` +
      `Unidades a sumar: +${totalesFactura.piezas} piezas en inventario\n` +
      `Monto Total Costo: ${formatUSD(totalesFactura.totalCostoUSD)}`
    );
    if (!confirmacion) return;

    setGuardandoRecepcion(true);
    try {
      const ahoraISO = new Date().toISOString();
      const itemsParaHistorial = [];

      // Actualizar cada producto en Supabase
      for (const r of renglonesFactura) {
        const cant = parseInt(r.cantidad_recibida, 10) || 0;
        const nuevoStock = (r.stock_actual || 0) + cant;
        const nuevoCosto = parseFloat(r.costo_unitario) || r.costo_anterior || 0;
        const nuevoPrecio = parseFloat(r.precio_detal) || r.precio_anterior || 0;

        const { error: errUpdate } = await supabase
          .from('productos')
          .update({
            stock: nuevoStock,
            costo_usd: nuevoCosto,
            precio_detal_usd: nuevoPrecio,
            recien_llegado: Boolean(datosFactura.marcarRecienLlegado),
            updated_at: ahoraISO
          })
          .eq('id', r.id);

        if (errUpdate) {
          throw new Error(`Error actualizando repuesto ${r.codigo_corto}: ${errUpdate.message}`);
        }

        itemsParaHistorial.push({
          id: r.id,
          codigo_corto: r.codigo_corto,
          referencia: r.referencia,
          descripcion: r.descripcion,
          marca: r.marca,
          modelo_vehiculo: r.modelo_vehiculo,
          stock_anterior: r.stock_actual,
          cantidad_recibida: cant,
          nuevo_stock: nuevoStock,
          costo_unitario: nuevoCosto,
          precio_detal: nuevoPrecio,
          subtotal_usd: cant * nuevoCosto
        });
      }

      // Guardar en Historial de Recepciones
      const nuevaRecepcion = {
        id: `REC-${Date.now()}`,
        fecha: datosFactura.fecha || ahoraISO.split('T')[0],
        fechaHoraRegistro: ahoraISO,
        proveedor: datosFactura.proveedor.trim() || 'PROVEEDOR GENERAL',
        numero_factura: datosFactura.numero_factura.trim() || 'S/N',
        condicion_pago: datosFactura.condicion_pago,
        notas: datosFactura.notas.trim(),
        total_renglones: totalesFactura.itemsDiferentes,
        total_piezas: totalesFactura.piezas,
        total_costo_usd: totalesFactura.totalCostoUSD,
        total_costo_ves: totalesFactura.totalCostoVES,
        tasa_bcv: tasaNum,
        items: itemsParaHistorial
      };

      setHistorialRecepciones(prev => [nuevaRecepcion, ...prev]);

      // Mostrar Notificación de Éxito
      setNotificacionExito({
        proveedor: nuevaRecepcion.proveedor,
        numero_factura: nuevaRecepcion.numero_factura,
        piezas: totalesFactura.piezas,
        renglones: totalesFactura.itemsDiferentes,
        totalUSD: totalesFactura.totalCostoUSD
      });

      // Recargar catálogo en la app
      if (typeof cargarInventario === 'function') {
        cargarInventario();
      }

      // Limpiar formulario de factura
      setRenglonesFactura([]);
      setDatosFactura({
        proveedor: '',
        numero_factura: '',
        fecha: new Date().toISOString().split('T')[0],
        condicion_pago: 'Contado',
        notas: '',
        marcarRecienLlegado: true
      });

      // Scroll arriba suave
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error procesando recepción:', err);
      alert('Ocurrió un error al procesar el ingreso de mercancía:\n' + err.message);
    } finally {
      setGuardandoRecepcion(false);
    }
  };

  // =========================================================================
  // MODO 2: AJUSTE / ENTRADA RÁPIDA (1 A 1)
  // =========================================================================
  const [repuestoRapido, setRepuestoRapido] = useState(null);
  const [formRapido, setFormRapido] = useState({
    cantidad: '',
    proveedor: '',
    numero_factura: '',
    nuevo_costo: '',
    nuevo_precio: '',
    notas: ''
  });
  const [guardandoRapido, setGuardandoRapido] = useState(false);

  const seleccionarParaRapido = (p) => {
    setRepuestoRapido(p);
    setFormRapido({
      cantidad: '1',
      proveedor: '',
      numero_factura: '',
      nuevo_costo: String(p.costo_usd || ''),
      nuevo_precio: String(p.precio_detal_usd || ''),
      notas: ''
    });
    setBusquedaRepuesto('');
  };

  const procesarIngresoRapido = async (e) => {
    e.preventDefault();
    if (!repuestoRapido) return;

    const cant = parseInt(formRapido.cantidad, 10);
    if (!cant || cant <= 0) {
      alert('Ingresa una cantidad válida a sumar.');
      return;
    }

    setGuardandoRapido(true);
    try {
      const stockAnterior = parseInt(repuestoRapido.stock, 10) || 0;
      const nuevoStock = stockAnterior + cant;
      const nuevoCosto = parseFloat(formRapido.nuevo_costo) || repuestoRapido.costo_usd || 0;
      const nuevoPrecio = parseFloat(formRapido.nuevo_precio) || repuestoRapido.precio_detal_usd || 0;
      const ahoraISO = new Date().toISOString();

      const { error } = await supabase
        .from('productos')
        .update({
          stock: nuevoStock,
          costo_usd: nuevoCosto,
          precio_detal_usd: nuevoPrecio,
          recien_llegado: true,
          updated_at: ahoraISO
        })
        .eq('id', repuestoRapido.id);

      if (error) throw error;

      // Registrar también en historial
      const recepcionRapida = {
        id: `REC-${Date.now()}`,
        fecha: ahoraISO.split('T')[0],
        fechaHoraRegistro: ahoraISO,
        proveedor: formRapido.proveedor.trim() || 'AJUSTE DIRECTO DE STOCK',
        numero_factura: formRapido.numero_factura.trim() || 'DIRECTO',
        condicion_pago: 'Ajuste Inmediato',
        notas: formRapido.notas.trim() || 'Entrada rápida unitaria',
        total_renglones: 1,
        total_piezas: cant,
        total_costo_usd: cant * nuevoCosto,
        total_costo_ves: (cant * nuevoCosto) * tasaNum,
        tasa_bcv: tasaNum,
        items: [{
          id: repuestoRapido.id,
          codigo_corto: repuestoRapido.codigo_corto,
          referencia: repuestoRapido.referencia,
          descripcion: repuestoRapido.descripcion,
          marca: repuestoRapido.marca_producto || repuestoRapido.marca,
          modelo_vehiculo: repuestoRapido.modelo_vehiculo,
          stock_anterior: stockAnterior,
          cantidad_recibida: cant,
          nuevo_stock: nuevoStock,
          costo_unitario: nuevoCosto,
          precio_detal: nuevoPrecio,
          subtotal_usd: cant * nuevoCosto
        }]
      };

      setHistorialRecepciones(prev => [recepcionRapida, ...prev]);

      setNotificacionExito({
        proveedor: recepcionRapida.proveedor,
        numero_factura: recepcionRapida.numero_factura,
        piezas: cant,
        renglones: 1,
        totalUSD: cant * nuevoCosto
      });

      if (typeof cargarInventario === 'function') {
        cargarInventario();
      }

      setRepuestoRapido(null);
      setFormRapido({
        cantidad: '',
        proveedor: '',
        numero_factura: '',
        nuevo_costo: '',
        nuevo_precio: '',
        notas: ''
      });

    } catch (err) {
      console.error('Error en ingreso rápido:', err);
      alert('Error sumando al stock: ' + err.message);
    } finally {
      setGuardandoRapido(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* =================================================================== */}
      {/* 1. CABECERA & METRICAS DEL ALMACEN                                   */}
      {/* =================================================================== */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0B0F19]/95 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/25 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Ingreso de Mercancía & Facturas de Proveedor
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Gestión de Compras
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recepción por factura de compra, actualización de costos de adquisición y suma atómica de existencias.
              </p>
            </div>
          </div>

          {/* Selector de Modos / Sub-Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSubTab('factura')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                subTab === 'factura'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Factura en Lote</span>
              {renglonesFactura.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-red-600 font-mono text-[10px] font-black">
                  {renglonesFactura.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTab('rapido')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                subTab === 'rapido'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Entrada Rápida 1 a 1</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('historial')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                subTab === 'historial'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial de Facturas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 font-bold">
                {historialRecepciones.length}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Mini Cards de Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-0.5">
              Catálogo Registrado
            </span>
            <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-slate-400" />
              <span>{metricasAlmacen.totalItems} repuestos</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
              Stock Físico Global
            </span>
            <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{metricasAlmacen.stockTotal} unidades</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 block mb-0.5">
              Agotados (Stock 0)
            </span>
            <div className="text-base font-black font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{metricasAlmacen.agotados} repuestos</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 block mb-0.5">
              Facturas Recepcionadas
            </span>
            <div className="text-base font-black font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>{historialRecepciones.length} registradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BANNER DE NOTIFICACIÓN DE ÉXITO                                     */}
      {/* =================================================================== */}
      {notificacionExito && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 flex items-start justify-between gap-3 shadow-xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                ¡Ingreso de Mercancía Procesado con Éxito!
              </h3>
              <p className="text-xs">
                Se sumaron existencias al inventario para la factura <strong>{notificacionExito.numero_factura}</strong> de <strong>{notificacionExito.proveedor}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-200">
                <span>📦 {notificacionExito.renglones} repuestos actualizados</span>
                <span>•</span>
                <span>➕ {notificacionExito.piezas} piezas físicas ingresadas</span>
                <span>•</span>
                <span>💵 Monto Costo: {formatUSD(notificacionExito.totalUSD)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificacionExito(null)}
            className="p-1.5 text-emerald-600 hover:text-emerald-950 dark:hover:text-white rounded-lg hover:bg-emerald-500/20 cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* PESTAÑA A: RECEPCIÓN DE FACTURA DE PROVEEDOR EN LOTE                 */}
      {/* =================================================================== */}
      {subTab === 'factura' && (
        <div className="space-y-4">
          
          {/* PASO 1: DATOS GENERALES DE LA FACTURA DE COMPRA */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95 shadow-md space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-black text-xs font-mono">
                  1
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Datos de la Factura / Guía de Recepción
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ingresa el proveedor y número de documento fiscal o guía de despacho del proveedor
                  </p>
                </div>
              </div>

              {renglonesFactura.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Deseas vaciar todos los repuestos agregados a esta factura?')) {
                      setRenglonesFactura([]);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Vaciar Borrador</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Proveedor con Datalist de Sugerencias */}
              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Proveedor:</span>
                </label>
                <input
                  type="text"
                  list="proveedores-lista"
                  value={datosFactura.proveedor}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, proveedor: e.target.value }))}
                  placeholder="Ej. ATS Distribuidora..."
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 uppercase"
                />
                <datalist id="proveedores-lista">
                  {PROVEEDORES_SUGERIDOS.map(prov => (
                    <option key={prov} value={prov} />
                  ))}
                </datalist>
              </div>

              {/* Nº de Factura o Guía */}
              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nº Factura / Control:</span>
                </label>
                <input
                  type="text"
                  value={datosFactura.numero_factura}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, numero_factura: e.target.value }))}
                  placeholder="Ej. FAC-004921 / G-1204"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 uppercase"
                />
              </div>

              {/* Fecha de Recepción */}
              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fecha de Emisión:</span>
                </label>
                <input
                  type="date"
                  value={datosFactura.fecha}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Condición de Pago */}
              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Condición de Pago:</span>
                </label>
                <select
                  value={datosFactura.condicion_pago}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, condicion_pago: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="Contado">Contado (Pagado)</option>
                  <option value="Crédito (15 días)">Crédito (15 días)</option>
                  <option value="Crédito (30 días)">Crédito (30 días)</option>
                  <option value="Consignación">En Consignación</option>
                </select>
              </div>
            </div>

            {/* Opciones y notas adicionales */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={datosFactura.marcarRecienLlegado}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, marcarRecienLlegado: e.target.checked }))}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Marcar estos repuestos con la etiqueta destacada <strong>"Recién Llegado"</strong></span>
              </label>

              <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                <input
                  type="text"
                  value={datosFactura.notas}
                  onChange={(e) => setDatosFactura(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Observación o nota adicional (ej: Tealca bulto #24)..."
                  className="w-full h-8 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* PASO 2: BUSCADOR DE REPUESTOS PARA AGREGAR A LA FACTURA */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-black text-xs font-mono">
                  2
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Agregar Repuestos a la Factura
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Escribe cualquier referencia para seleccionarlo y agregarlo a la lista de recepción
                  </p>
                </div>
              </div>

              {typeof abrirModalCrear === 'function' && (
                <button
                  type="button"
                  onClick={abrirModalCrear}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto border border-slate-200 dark:border-white/10"
                >
                  <Plus className="w-3.5 h-3.5 text-red-600" />
                  <span>¿Es una pieza nueva? Crearla</span>
                </button>
              )}
            </div>

            {/* Input de Búsqueda con Dropdown Reactivo */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busquedaRepuesto}
                onChange={(e) => {
                  setBusquedaRepuesto(e.target.value);
                  setMostrarDropdownBusqueda(true);
                }}
                onFocus={() => setMostrarDropdownBusqueda(true)}
                placeholder="Escribe código corto, OEM, repuesto, marca o vehículo (ej: Corolla, Pastillas, 555, Amortiguador)..."
                className="w-full h-12 pl-12 pr-10 bg-slate-50 dark:bg-[#06080F] border-2 border-slate-300 dark:border-white/[0.12] focus:border-red-600 dark:focus:border-red-500 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-red-600/15 shadow-inner transition-all uppercase"
              />
              {busquedaRepuesto && (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaRepuesto('');
                    if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* DROPDOWN DE COINCIDENCIAS */}
              {mostrarDropdownBusqueda && busquedaRepuesto.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0F1420] border-2 border-slate-300 dark:border-white/20 rounded-2xl shadow-2xl z-30 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {repuestosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                      <p>No se encontraron repuestos con "{busquedaRepuesto}".</p>
                      {typeof abrirModalCrear === 'function' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarDropdownBusqueda(false);
                            abrirModalCrear();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar como Nuevo Repuesto en Catálogo</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    repuestosFiltrados.map(p => {
                      const foto = obtenerFotoRepuesto(p);
                      const yaEnFactura = renglonesFactura.find(r => r.id === p.id);
                      const stockActual = parseInt(p.stock, 10) || 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => agregarAFactura(p)}
                          className="p-3 hover:bg-red-50/80 dark:hover:bg-white/[0.08] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Mini Foto */}
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                              {foto ? (
                                <img src={foto} alt={p.descripcion} className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-black text-xs px-2 py-0.2 rounded bg-red-600 text-white">
                                  {p.codigo_corto}
                                </span>
                                {p.referencia && p.referencia !== p.codigo_corto && (
                                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                    OEM: {p.referencia}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                  {p.marca_producto || p.marca || 'GENÉRICO'}
                                </span>
                                {p.modelo_vehiculo && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    {p.modelo_vehiculo}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-slate-900 dark:text-white uppercase truncate">
                                {p.descripcion}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
                                <span>Costo Actual: <strong>{formatUSD(p.costo_usd || 0)}</strong></span>
                                <span>•</span>
                                <span>P. Detal: <strong>{formatUSD(p.precio_detal_usd || 0)}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Badge de Stock Actual */}
                            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-xl border ${
                              stockActual <= 0
                                ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
                                : 'bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            }`}>
                              Stock: {stockActual}
                            </span>

                            {yaEnFactura ? (
                              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-[11px] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>+{yaEnFactura.cantidad_recibida} en factura</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Sumar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PASO 3: TABLA DE RENGLONES DE LA FACTURA A RECEPCIONAR */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-black text-xs font-mono">
                  3
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Renglones a Ingresar al Inventario</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {renglonesFactura.length} repuestos
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Revisa las cantidades recibidas, confirma los costos de compra y actualiza los precios de venta
                  </p>
                </div>
              </div>

              {/* Botones de Margen Rápido si hay ítems */}
              {renglonesFactura.length > 0 && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                  <span className="text-slate-400 text-[11px] font-bold hidden sm:inline">Margen sugerido:</span>
                  {[30, 35, 40, 50].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => aplicarMargenUniforme(m)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
                      title={`Calcular precio de venta con ${m}% de ganancia`}
                    >
                      +{m}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SI NO HAY RENGLONES */}
            {renglonesFactura.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400">
                  <Boxes className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No has agregado repuestos a esta recepción
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Utiliza el buscador del paso 2 para seleccionar los repuestos que llegaron en la factura del proveedor.
                  </p>
                </div>
              </div>
            ) : (
              /* TABLA INTERACTIVA DE RENGLONES */
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-white/[0.04] text-[10px] font-mono font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                      <th className="py-3 px-3">Repuesto / Código</th>
                      <th className="py-3 px-3 text-center">Stock (Antes ➜ Después)</th>
                      <th className="py-3 px-3 text-center">Cant. Recibida</th>
                      <th className="py-3 px-3">Costo Compra ($)</th>
                      <th className="py-3 px-3">Precio Venta Detal ($)</th>
                      <th className="py-3 px-3 text-right">Subtotal ($)</th>
                      <th className="py-3 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {renglonesFactura.map((r) => {
                      const foto = obtenerFotoRepuesto(r);
                      const cant = parseInt(r.cantidad_recibida, 10) || 0;
                      const costo = parseFloat(r.costo_unitario) || 0;
                      const precio = parseFloat(r.precio_detal) || 0;
                      const subtotal = cant * costo;
                      const nuevoStock = (r.stock_actual || 0) + cant;
                      
                      // Cálculo de margen
                      const margenPct = precio > 0 && precio > costo
                        ? Math.round(((precio - costo) / precio) * 100)
                        : 0;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          {/* 1. FOTO + CÓDIGO + DESCRIPCIÓN */}
                          <td className="py-2.5 px-3 min-w-[240px]">
                            <div className="flex items-center gap-2.5">
                              {/* Foto con zoom al clic */}
                              <button
                                type="button"
                                onClick={() => setRepuestoZoom(r)}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer p-0.5 hover:ring-2 hover:ring-red-500 transition-all"
                                title="Ver foto ampliada"
                              >
                                {foto ? (
                                  <img src={foto} alt={r.descripcion} className="w-full h-full object-contain" />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-black text-[11px] px-1.5 py-0.2 rounded bg-red-600 text-white">
                                    {r.codigo_corto}
                                  </span>
                                  {r.referencia && r.referencia !== r.codigo_corto && (
                                    <span className="font-mono text-[10px] text-slate-400">
                                      OEM: {r.referencia}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                    {r.marca}
                                  </span>
                                </div>
                                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase truncate text-[11px]">
                                  {r.descripcion}
                                </div>
                                {r.modelo_vehiculo && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                                    Vehículo: {r.modelo_vehiculo}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. STOCK ANTES ➜ DESPUÉS */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 font-mono text-xs">
                              <span className="text-slate-500 font-bold">{r.stock_actual ?? 0}</span>
                              <span className="text-emerald-500 font-black">➜</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">
                                {nuevoStock} un.
                              </span>
                            </div>
                          </td>

                          {/* 3. CANTIDAD RECIBIDA CON STEPPERS */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => modificarRenglon(r.id, 'cantidad_recibida', Math.max(1, cant - 1))}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              
                              <input
                                type="number"
                                min="1"
                                value={r.cantidad_recibida}
                                onChange={(e) => modificarRenglon(r.id, 'cantidad_recibida', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-14 h-7 text-center font-mono font-black text-xs bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={() => modificarRenglon(r.id, 'cantidad_recibida', cant + 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* 4. COSTO UNITARIO USD */}
                          <td className="py-2.5 px-3 min-w-[120px]">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={r.costo_unitario}
                                onChange={(e) => modificarRenglon(r.id, 'costo_unitario', e.target.value)}
                                className="w-full h-8 pl-6 pr-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-lg font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:border-red-600"
                              />
                            </div>
                            {r.costo_anterior > 0 && r.costo_anterior !== costo && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Ant: ${r.costo_anterior}
                              </div>
                            )}
                          </td>

                          {/* 5. PRECIO VENTA DETAL USD */}
                          <td className="py-2.5 px-3 min-w-[130px]">
                            <div className="space-y-1">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={r.precio_detal}
                                  onChange={(e) => modificarRenglon(r.id, 'precio_detal', e.target.value)}
                                  className="w-full h-8 pl-6 pr-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-lg font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:border-red-600"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Margen:</span>
                                <span className={`font-bold px-1.5 py-0.2 rounded ${
                                  margenPct >= 30
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : margenPct >= 15
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
                                }`}>
                                  {margenPct}%
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 6. SUBTOTAL USD */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <div>{formatUSD(subtotal)}</div>
                            <div className="text-[10px] font-normal text-slate-400">
                              {formatVES(subtotal * tasaNum)}
                            </div>
                          </td>

                          {/* 7. ACCIONES */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarRenglon(r.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Quitar este repuesto de la factura"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* BARRA DE LIQUIDACIÓN Y BOTÓN PRINCIPAL */}
            {renglonesFactura.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/[0.02] dark:to-white/[0.04] border border-slate-200 dark:border-white/10 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Repuestos Distintos
                    </span>
                    <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                      {totalesFactura.itemsDiferentes} ítems
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                      Piezas Físicas a Sumar
                    </span>
                    <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      +{totalesFactura.piezas} unidades
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Costo Total Factura ($)
                    </span>
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {formatUSD(totalesFactura.totalCostoUSD)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Equivalente BCV
                    </span>
                    <div className="text-sm font-bold font-mono text-slate-600 dark:text-slate-300 truncate">
                      {formatVES(totalesFactura.totalCostoVES)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Al procesar, el stock se sumará atómicamente a cada repuesto en Supabase y quedará registrado en el historial.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={procesarRecepcionFactura}
                      disabled={guardandoRecepcion}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {guardandoRecepcion ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando en Inventario...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Procesar y Sumar al Inventario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PESTAÑA B: ENTRADA RÁPIDA DIRECTA 1 A 1                              */}
      {/* =================================================================== */}
      {subTab === 'rapido' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95 shadow-md space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Ajuste / Entrada Rápida de Stock (1 Repuesto)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ideal para sumas directas sin necesidad de registrar una factura completa
            </p>
          </div>

          {/* Seleccionar repuesto si aún no se ha elegido */}
          {!repuestoRapido ? (
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300 block">
                Buscar repuesto a recepcionar:
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaRepuesto}
                  onChange={(e) => setBusquedaRepuesto(e.target.value)}
                  placeholder="Escribe código o descripción (ej. 555, Corolla, Filtro, Bujía)..."
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/[0.12] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 uppercase"
                  autoFocus
                />
              </div>

              {/* Lista de coincidencias */}
              {busquedaRepuesto.trim().length > 0 && (
                <div className="bg-white dark:bg-[#0F1420] border-2 border-slate-300 dark:border-white/20 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {repuestosFiltrados.map(p => {
                    const foto = obtenerFotoRepuesto(p);
                    const stock = parseInt(p.stock, 10) || 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => seleccionarParaRapido(p)}
                        className="p-3 hover:bg-red-50 dark:hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            {foto ? (
                              <img src={foto} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                {p.codigo_corto}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                                {p.descripcion}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Marca: {p.marca_producto || p.marca} · Vehículo: {p.modelo_vehiculo || 'Universal'}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                          Stock: {stock}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* REPUESTO SELECCIONADO EN MODO RÁPIDO */
            <form onSubmit={procesarIngresoRapido} className="space-y-4">
              <div className="p-3.5 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    {obtenerFotoRepuesto(repuestoRapido) ? (
                      <img src={obtenerFotoRepuesto(repuestoRapido)} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-red-600 text-white">
                        {repuestoRapido.codigo_corto}
                      </span>
                      {repuestoRapido.referencia && repuestoRapido.referencia !== repuestoRapido.codigo_corto && (
                        <span className="font-mono text-xs text-slate-400">
                          OEM: {repuestoRapido.referencia}
                        </span>
                      )}
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase">
                        {repuestoRapido.descripcion}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Stock actual: <strong>{repuestoRapido.stock ?? 0} unidades</strong> · Marca: {repuestoRapido.marca_producto || repuestoRapido.marca}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRepuestoRapido(null)}
                  className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-red-600 cursor-pointer self-start sm:self-auto"
                >
                  Cambiar repuesto
                </button>
              </div>

              {/* Formulario Rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                    Cantidad a Sumar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formRapido.cantidad}
                    onChange={(e) => setFormRapido(prev => ({ ...prev, cantidad: e.target.value }))}
                    placeholder="Ej. 12"
                    className="w-full h-11 px-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Nuevo stock: {(parseInt(repuestoRapido.stock, 10) || 0) + (parseInt(formRapido.cantidad, 10) || 0)} un.
                  </span>
                </div>

                <div>
                  <label className="font-mono font-bold text-slate-500 uppercase block mb-1">
                    Costo Unitario Compra ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRapido.nuevo_costo}
                    onChange={(e) => setFormRapido(prev => ({ ...prev, nuevo_costo: e.target.value }))}
                    placeholder="Ej. 14.50"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-slate-500 uppercase block mb-1">
                    Precio Venta Detal ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRapido.nuevo_precio}
                    onChange={(e) => setFormRapido(prev => ({ ...prev, nuevo_precio: e.target.value }))}
                    placeholder="Ej. 22.00"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-slate-500 uppercase block mb-1">
                    Proveedor (Opcional)
                  </label>
                  <input
                    type="text"
                    list="proveedores-rapido"
                    value={formRapido.proveedor}
                    onChange={(e) => setFormRapido(prev => ({ ...prev, proveedor: e.target.value }))}
                    placeholder="Ej. ATS / Carmona"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 uppercase"
                  />
                  <datalist id="proveedores-rapido">
                    {PROVEEDORES_SUGERIDOS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={guardandoRapido}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardandoRapido ? 'Guardando en Supabase...' : 'Sumar al Stock Inmediatamente'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* PESTAÑA C: HISTORIAL DE FACTURAS RECEPCIONADAS                       */}
      {/* =================================================================== */}
      {subTab === 'historial' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                <History className="w-4 h-4 text-red-600" />
                <span>Historial de Facturas y Compras Recepcionadas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro cronológico de mercancía ingresada al almacén
              </p>
            </div>

            {historialRecepciones.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas vaciar el historial local de recepciones?')) {
                    setHistorialRecepciones([]);
                  }
                }}
                className="text-xs text-red-500 hover:underline cursor-pointer"
              >
                Limpiar Historial
              </button>
            )}
          </div>

          {historialRecepciones.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Aún no has registrado ingresos de facturas en este dispositivo.</p>
              <button
                type="button"
                onClick={() => setSubTab('factura')}
                className="text-red-600 font-bold hover:underline"
              >
                Ingresar la primera factura ahora
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-white/[0.04] text-[10px] font-mono font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Proveedor</th>
                    <th className="py-3 px-3">Nº Factura</th>
                    <th className="py-3 px-3 text-center">Renglones</th>
                    <th className="py-3 px-3 text-center">Unidades</th>
                    <th className="py-3 px-3 text-right">Total Factura ($)</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {historialRecepciones.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {rec.fecha}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white uppercase">
                        {rec.proveedor}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-600 dark:text-red-400">
                        {rec.numero_factura}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {rec.total_renglones}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{rec.total_piezas}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatUSD(rec.total_costo_usd || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setRecepcionDetalleModal(rec)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DETALLE DE RECEPCIÓN HISTÓRICA                                */}
      {/* =================================================================== */}
      {recepcionDetalleModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setRecepcionDetalleModal(null); }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/20 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 p-5 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                    Factura: {recepcionDetalleModal.numero_factura}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proveedor: <strong>{recepcionDetalleModal.proveedor}</strong> · Fecha: {recepcionDetalleModal.fecha}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRecepcionDetalleModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Renglones</span>
                <span className="font-mono font-bold">{recepcionDetalleModal.total_renglones} repuestos</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <span className="text-[10px] font-mono uppercase block">Unidades Recibidas</span>
                <span className="font-mono font-black">+{recepcionDetalleModal.total_piezas} piezas</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <span className="text-[10px] font-mono uppercase block">Total Costo Factura</span>
                <span className="font-mono font-black">{formatUSD(recepcionDetalleModal.total_costo_usd || 0)}</span>
              </div>
            </div>

            {/* Tabla de ítems en este comprobante */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-white/[0.04] text-[10px] font-mono font-bold uppercase text-slate-500 sticky top-0">
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
                      <td className="py-2 px-3 font-mono font-bold text-red-600">
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

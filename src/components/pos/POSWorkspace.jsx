import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  RotateCcw, 
  User, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShoppingBag, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X,
  Package,
  Car,
  Tag,
  Eye,
  SlidersHorizontal,
  MapPin,
  Phone,
  ArrowRight,
  Layers,
  Sparkles,
  Receipt,
  Printer,
  Zap,
  FileText
} from 'lucide-react';
import { formatUSD, formatVES, parseVenezuelanNumber, generarVariantesCedula } from '../../lib/formatters';
import { obtenerFotoRepuesto } from '../../lib/repuestosImagenes';
import { desglosarModelosVehiculo } from '../../lib/vehiculosMarcas';
import ModalZoomRepuesto from '../ModalZoomRepuesto';

export default function POSWorkspace({
  cliente,
  setCliente,
  items,
  setItems,
  tasaBCV,
  formaPago,
  setFormaPago,
  condicionPago,
  setCondicionPago,
  monedaIngreso,
  setMonedaIngreso,
  tipoDocumento,
  setTipoDocumento,
  totals,
  onGuardar,
  onImprimir,
  onLimpiar,
  loading,
  error
}) {
  // =========================================================================
  // ESTADOS DEL CLIENTE (TIPO a2 SOFTWAY)
  // =========================================================================
  const [sugerenciasCedula, setSugerenciasCedula] = useState([]);
  const [mostrarSugerenciasCedula, setMostrarSugerenciasCedula] = useState(false);
  const [buscandoClienteCedula, setBuscandoClienteCedula] = useState(false);

  const [sugerenciasNombre, setSugerenciasNombre] = useState([]);
  const [mostrarSugerenciasNombre, setMostrarSugerenciasNombre] = useState(false);
  const [buscandoClienteNombre, setBuscandoClienteNombre] = useState(false);

  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  const cedulaContainerRef = useRef(null);
  const nombreContainerRef = useRef(null);
  const inputBusquedaRef = useRef(null);

  // =========================================================================
  // ESTADOS DEL CATÁLOGO Y FILTROS
  // =========================================================================
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroSublinea, setFiltroSublinea] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [repuestoParaZoom, setRepuestoParaZoom] = useState(null);

  const [todosLosProductosMeta, setTodosLosProductosMeta] = useState([]);
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [ultimoAgregadoId, setUltimoAgregadoId] = useState(null);

  // Tasa BCV numérica limpia
  const tasaActivaNum = useMemo(() => {
    const parsed = parseVenezuelanNumber(tasaBCV);
    return parsed > 0 ? parsed : 1;
  }, [tasaBCV]);

  // Cargar metadata para filtros en cascada
  useEffect(() => {
    async function cargarMetadata() {
      try {
        const { data } = await supabase
          .from('productos')
          .select('linea, sublinea, marca_producto, marca, modelo_vehiculo, stock');
        if (data) setTodosLosProductosMeta(data);
      } catch (e) {
        console.warn('Error cargando metadata productos:', e);
      }
    }
    cargarMetadata();
  }, []);

  // 1. Líneas disponibles
  const listaLineas = useMemo(() => {
    const lins = Array.from(new Set(todosLosProductosMeta.map(d => d.linea).filter(Boolean)))
      .filter(l => l.toLowerCase() !== 'tren delantero')
      .sort();
    return lins.length > 0 ? lins : [
      'Tren Delantero y Dirección', 'Suspensión', 'Motor', 'Frenos', 
      'Eléctrico y Encendido', 'Tracción y Transmisión', 'Refrigeración', 'General'
    ];
  }, [todosLosProductosMeta]);

  // 2. Sublíneas en cascada
  const sublineasDisponibles = useMemo(() => {
    let prods = todosLosProductosMeta;
    if (filtroLinea) {
      prods = prods.filter(p => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    return Array.from(new Set(prods.map(d => d.sublinea).filter(Boolean))).sort();
  }, [filtroLinea, todosLosProductosMeta]);

  // 3. Marcas en cascada
  const marcasDisponibles = useMemo(() => {
    let prods = todosLosProductosMeta;
    if (filtroLinea) {
      prods = prods.filter(p => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    if (filtroSublinea) {
      prods = prods.filter(p => p.sublinea && p.sublinea.toLowerCase().includes(filtroSublinea.toLowerCase()));
    }
    return Array.from(new Set(prods.map(d => (d.marca_producto || d.marca || '').trim().toUpperCase()).filter(Boolean))).sort();
  }, [filtroLinea, filtroSublinea, todosLosProductosMeta]);

  // 4. Modelos de vehículos en cascada
  const vehiculosDisponibles = useMemo(() => {
    let prods = todosLosProductosMeta;
    if (filtroLinea) {
      prods = prods.filter(p => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    if (filtroSublinea) {
      prods = prods.filter(p => p.sublinea && p.sublinea.toLowerCase().includes(filtroSublinea.toLowerCase()));
    }
    if (filtroMarca) {
      prods = prods.filter(p => (p.marca_producto || p.marca || '').toUpperCase().includes(filtroMarca.toUpperCase()));
    }
    return Array.from(new Set(prods.flatMap(d => desglosarModelosVehiculo(d.modelo_vehiculo)))).sort();
  }, [filtroLinea, filtroSublinea, filtroMarca, todosLosProductosMeta]);

  // Estado de búsqueda activa
  const hayFiltrosActivos = Boolean(
    busquedaTexto.trim().length > 0 || 
    filtroLinea || 
    filtroSublinea || 
    filtroMarca || 
    filtroVehiculo
  );

  // Consulta de productos
  const buscarProductos = async (
    termino = busquedaTexto, 
    linea = filtroLinea, 
    sublinea = filtroSublinea, 
    marca = filtroMarca, 
    vehiculo = filtroVehiculo
  ) => {
    setCargandoProductos(true);
    try {
      const term = (termino || '').trim();
      let query = supabase.from('productos').select('*');

      if (linea) query = query.ilike('linea', `%${linea}%`);
      if (sublinea) {
        const cleanSub = sublinea.replace(/^\d+[-_ ]*/, '').trim();
        query = query.or(`sublinea.ilike.%${sublinea}%,sublinea.ilike.%${cleanSub}%,descripcion.ilike.%${cleanSub}%`);
      }
      if (marca) query = query.or(`marca.ilike.%${marca}%,marca_producto.ilike.%${marca}%`);
      if (vehiculo) query = query.ilike('modelo_vehiculo', `%${vehiculo}%`);
      if (term.length > 0) {
        query = query.or(
          `codigo_corto.ilike.%${term}%,referencia.ilike.%${term}%,descripcion.ilike.%${term}%,marca.ilike.%${term}%,marca_producto.ilike.%${term}%,modelo_vehiculo.ilike.%${term}%,linea.ilike.%${term}%,sublinea.ilike.%${term}%`
        );
      }

      query = query.order('codigo_corto', { ascending: true }).limit(50);
      const { data } = await query;
      setProductosEncontrados(data || []);
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    if (!hayFiltrosActivos) {
      setProductosEncontrados([]);
      return;
    }
    const timer = setTimeout(() => {
      buscarProductos(busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo);
    }, 200);
    return () => clearTimeout(timer);
  }, [busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo]);

  // Cerrar sugerencias al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (cedulaContainerRef.current && !cedulaContainerRef.current.contains(event.target)) {
        setMostrarSugerenciasCedula(false);
      }
      if (nombreContainerRef.current && !nombreContainerRef.current.contains(event.target)) {
        setMostrarSugerenciasNombre(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Seleccionar cliente (Tipo a2)
  const seleccionarCliente = (c) => {
    const docNormalizado = c.cedula_rif || c.cliente_documento || '';
    setCliente({
      id: c.id || null,
      documento: docNormalizado,
      nombre: c.nombre || c.cliente_nombre || '',
      telefono: c.telefono || c.cliente_telefono || '',
      direccion: c.direccion || c.cliente_direccion || ''
    });
    setClienteEncontrado(c);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  // Limpiar datos del cliente
  const limpiarDatosCliente = () => {
    setCliente({ id: null, documento: '', nombre: '', telefono: '', direccion: '' });
    setClienteEncontrado(null);
    setSugerenciasCedula([]);
    setSugerenciasNombre([]);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  // Llenar consumidor final de contado instantáneo
  const setConsumidorFinal = () => {
    setCliente({
      id: null,
      documento: 'V-00000000',
      nombre: 'CLIENTE DE CONTADO',
      telefono: '0414-0000000',
      direccion: 'TIENDA MOSTRADOR'
    });
    setClienteEncontrado({
      id: null,
      cedula_rif: 'V-00000000',
      nombre: 'CLIENTE DE CONTADO'
    });
    setSugerenciasCedula([]);
    setSugerenciasNombre([]);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  // Búsqueda inteligente por Cédula (Tipo a2)
  useEffect(() => {
    const doc = (cliente.documento || '').trim();
    const soloDigitos = doc.replace(/\D/g, '');

    if (soloDigitos.length < 3) {
      setSugerenciasCedula([]);
      setMostrarSugerenciasCedula(false);
      if (soloDigitos.length === 0) setClienteEncontrado(null);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoClienteCedula(true);
      try {
        const variantes = generarVariantesCedula(doc);
        const orVariantes = variantes.map(v => `cedula_rif.eq.${v}`).join(',');

        // Coincidencia exacta directa
        const { data: exacto } = await supabase
          .from('clientes')
          .select('*')
          .or(orVariantes)
          .limit(1)
          .maybeSingle();

        if (exacto && exacto.nombre) {
          setClienteEncontrado(exacto);
          setCliente(prev => ({
            ...prev,
            id: exacto.id,
            documento: exacto.cedula_rif || prev.documento,
            nombre: exacto.nombre,
            telefono: exacto.telefono || prev.telefono || '',
            direccion: exacto.direccion || prev.direccion || ''
          }));
          setSugerenciasCedula([]);
          setMostrarSugerenciasCedula(false);
          return;
        }

        // Sugerencias parciales
        const { data: sugeridos } = await supabase
          .from('clientes')
          .select('*')
          .ilike('cedula_rif', `%${soloDigitos}%`)
          .limit(6);

        let matches = sugeridos ? [...sugeridos] : [];
        if (matches.length < 3) {
          const { data: guias } = await supabase
            .from('guias_despacho')
            .select('cliente_documento, cliente_nombre, cliente_telefono, cliente_direccion')
            .ilike('cliente_documento', `%${soloDigitos}%`)
            .order('created_at', { ascending: false })
            .limit(6);

          if (guias) {
            const existentes = new Set(matches.map(m => (m.cedula_rif || '').replace(/\D/g, '')));
            guias.forEach(g => {
              const gDig = (g.cliente_documento || '').replace(/\D/g, '');
              if (gDig && !existentes.has(gDig) && g.cliente_nombre) {
                existentes.add(gDig);
                matches.push({
                  id: null,
                  cedula_rif: g.cliente_documento,
                  nombre: g.cliente_nombre,
                  telefono: g.cliente_telefono || '',
                  direccion: g.cliente_direccion || ''
                });
              }
            });
          }
        }

        setSugerenciasCedula(matches);
        setMostrarSugerenciasCedula(matches.length > 0);
      } catch (err) {
        console.warn('Error consultando cliente por cédula:', err);
      } finally {
        setBuscandoClienteCedula(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [cliente.documento]);

  // Búsqueda inteligente por Nombre (Tipo a2)
  useEffect(() => {
    const nombreQuery = (cliente.nombre || '').trim();
    if (nombreQuery.length < 2 || (clienteEncontrado && clienteEncontrado.nombre === nombreQuery)) {
      setSugerenciasNombre([]);
      setMostrarSugerenciasNombre(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoClienteNombre(true);
      try {
        const { data: sugeridos } = await supabase
          .from('clientes')
          .select('*')
          .ilike('nombre', `%${nombreQuery}%`)
          .limit(6);

        let matches = sugeridos ? [...sugeridos] : [];
        if (matches.length < 3) {
          const { data: guias } = await supabase
            .from('guias_despacho')
            .select('cliente_documento, cliente_nombre, cliente_telefono, cliente_direccion')
            .ilike('cliente_nombre', `%${nombreQuery}%`)
            .order('created_at', { ascending: false })
            .limit(6);

          if (guias) {
            const existentes = new Set(matches.map(m => (m.cedula_rif || '').replace(/\D/g, '')));
            guias.forEach(g => {
              const gDig = (g.cliente_documento || '').replace(/\D/g, '');
              if (gDig && !existentes.has(gDig) && g.cliente_nombre) {
                existentes.add(gDig);
                matches.push({
                  id: null,
                  cedula_rif: g.cliente_documento,
                  nombre: g.cliente_nombre,
                  telefono: g.cliente_telefono || '',
                  direccion: g.cliente_direccion || ''
                });
              }
            });
          }
        }

        setSugerenciasNombre(matches);
        setMostrarSugerenciasNombre(matches.length > 0);
      } catch (err) {
        console.warn('Error consultando cliente por nombre:', err);
      } finally {
        setBuscandoClienteNombre(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cliente.nombre]);

  const handleDocumentoChange = (raw) => {
    let val = raw.toUpperCase().replace(/\s+/g, '');
    if (!val) {
      setCliente(prev => ({ ...prev, documento: '' }));
      return;
    }

    let prefix = 'V';
    let rest = val;
    const match = val.match(/^([VJEGP])(-?)(.*)$/);
    if (match) {
      prefix = match[1];
      rest = match[3];
      if (!match[2] && !rest) {
        setCliente(prev => ({ ...prev, documento: `${prefix}-` }));
        return;
      }
    } else if (/^\d/.test(val)) {
      prefix = 'V';
      rest = val;
    }

    let digits = rest.replace(/\D/g, '');
    if (!digits) {
      setCliente(prev => ({ ...prev, documento: `${prefix}-` }));
      return;
    }

    let formattedDoc = '';
    if (['V', 'E'].includes(prefix)) {
      digits = digits.slice(0, 8);
      const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formattedDoc = `${prefix}-${withDots}`;
    } else {
      digits = digits.slice(0, 9);
      const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formattedDoc = `${prefix}-${withDots}`;
    }
    setCliente(prev => ({ ...prev, documento: formattedDoc }));
  };

  const seleccionarPrefijo = (prefijo) => {
    const docActual = cliente.documento || '';
    const numPart = docActual.replace(/^[VJEGP]-\s*/i, '');
    if (!numPart) setCliente(prev => ({ ...prev, documento: `${prefijo}-` }));
    else handleDocumentoChange(`${prefijo}-${numPart}`);
  };

  const handleTelefonoChange = (raw) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('58') && digits.length >= 12) digits = '0' + digits.slice(2);
    digits = digits.slice(0, 11);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    setCliente(prev => ({ ...prev, telefono: formatted }));
  };

  // Cálculo de precios de un repuesto
  const calcularPrecios = (prod) => {
    const baseUSD = parseFloat(prod.precio_detal_usd) || 0;
    const aplicaIva = prod.aplica_iva !== false;
    const pDivisa = baseUSD;
    const pBs = aplicaIva ? (baseUSD * tasaActivaNum) * 1.16 : (baseUSD * tasaActivaNum);
    const pBsUSD = aplicaIva ? baseUSD * 1.16 : baseUSD;
    const factorCashea = 1.12;
    const factorIva = aplicaIva ? 1.16 : 1.0;
    const pCashea = baseUSD * factorCashea * factorIva;
    const pCasheaBs = pCashea * tasaActivaNum;
    return { pDivisa, pBs, pBsUSD, pCashea, pCasheaBs, aplicaIva };
  };

  // Agregar al carrito
  const agregarAlCarrito = (prod) => {
    const precios = calcularPrecios(prod);
    setItems(prev => {
      const idx = prev.findIndex(it => it.producto_id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        const itemActual = next[idx];
        const nuevaCant = (itemActual.cantidad || 1) + 1;
        next[idx] = {
          ...itemActual,
          cantidad: nuevaCant,
          subtotal_usd: nuevaCant * precios.pDivisa,
          subtotal_bs: nuevaCant * precios.pBs,
          subtotal_cashea: nuevaCant * precios.pCashea
        };
        return next;
      }

      const nuevoItem = {
        id: `${prod.id}_${Date.now()}`,
        producto_id: prod.id,
        codigo_corto: prod.codigo_corto,
        referencia: prod.referencia || '',
        descripcion: prod.descripcion,
        marca: prod.marca_producto || prod.marca || '',
        medidas: prod.medidas || '',
        stock_disponible: prod.stock ?? 0,
        cantidad: 1,
        precio_divisa: precios.pDivisa,
        precio_bs: precios.pBs,
        precio_cashea: precios.pCashea,
        subtotal_usd: precios.pDivisa,
        subtotal_bs: precios.pBs,
        subtotal_cashea: precios.pCashea,
        precio: precios.pDivisa,
        aplica_iva: precios.aplicaIva
      };
      return [nuevoItem, ...prev];
    });

    setUltimoAgregadoId(prod.id);
    setTimeout(() => setUltimoAgregadoId(null), 800);
  };

  // Modificar cantidad en carrito
  const modificarCantidad = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const it = { ...next[index] };
      const nueva = Math.max(1, (it.cantidad || 1) + delta);
      it.cantidad = nueva;
      it.subtotal_usd = nueva * (it.precio_divisa || it.precio || 0);
      it.subtotal_bs = nueva * (it.precio_bs || 0);
      it.subtotal_cashea = nueva * (it.precio_cashea || 0);
      next[index] = it;
      return next;
    });
  };

  const eliminarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const agregarItemManual = () => {
    setItems(prev => [
      {
        id: `manual_${Date.now()}`,
        producto_id: null,
        codigo_corto: 'MANUAL',
        referencia: '—',
        descripcion: '',
        marca: 'VARIOS',
        stock_disponible: 999,
        cantidad: 1,
        precio_divisa: '',
        precio: '',
        precio_bs: '',
        subtotal_usd: 0,
        subtotal_bs: 0,
        subtotal_cashea: 0,
        aplica_iva: formaPago !== 'EFECTIVO'
      },
      ...prev
    ]);
  };

  const handleItemManualChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      const it = { ...next[index] };
      if (field === 'descripcion') it.descripcion = value;
      else if (field === 'precio_divisa' || field === 'precio') {
        const num = parseVenezuelanNumber(value);
        it.precio_divisa = value;
        it.precio = value;
        it.precio_bs = num > 0 ? (num * tasaActivaNum).toFixed(2) : '';
        it.subtotal_usd = (it.cantidad || 1) * (num > 0 ? num : 0);
        it.subtotal_bs = it.subtotal_usd * tasaActivaNum;
        it.subtotal_cashea = it.subtotal_usd * 1.12 * 1.16;
      }
      next[index] = it;
      return next;
    });
  };

  // Cambiar modalidad de cierre
  const seleccionarModalidadCierre = (modalidad) => {
    if (modalidad === 'EFECTIVO') {
      setFormaPago('EFECTIVO');
      setTipoDocumento('nota_entrega');
      setCondicionPago('CONTADO');
      setMonedaIngreso('USD');
    } else if (modalidad === 'PAGO_MOVIL') {
      setFormaPago('PAGO_MOVIL');
      setTipoDocumento('factura_fiscal');
      setCondicionPago('CONTADO');
      setMonedaIngreso('VES');
    } else if (modalidad === 'CASHEA') {
      setFormaPago('CASHEA');
      setTipoDocumento('factura_fiscal');
      setCondicionPago('CONTADO');
      setMonedaIngreso('USD');
    } else if (modalidad === 'CREDITO_TIENDA') {
      setFormaPago('CREDITO_TIENDA');
      setTipoDocumento('nota_entrega');
      setCondicionPago('CRÉDITO');
      setMonedaIngreso('USD');
    }
  };

  const totalItemsEnCarrito = items.reduce((acc, it) => acc + (it.cantidad || 1), 0);
  const formularioValido = (cliente.nombre || '').trim().length > 0 && (cliente.documento || '').trim().length > 0 && items.length > 0;

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE CONTROL: TIPO DE COMPROBANTE Y ACCIONES RÁPIDAS         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Punto de Venta y Facturación
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Tasa BCV: {formatVES(tasaActivaNum)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flujo unificado: Cliente ➔ Renglones de la Venta ➔ Cobro y Cierre
            </p>
          </div>
        </div>

        {/* Tipo de Documento y Botones Rápidos */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTipoDocumento('nota_entrega')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tipoDocumento === 'nota_entrega'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nota de Entrega
            </button>
            <button
              type="button"
              onClick={() => setTipoDocumento('factura_fiscal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tipoDocumento === 'factura_fiscal'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Factura Fiscal
            </button>
          </div>

          {(items.length > 0 || cliente.nombre) && (
            <button
              type="button"
              onClick={onLimpiar}
              className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
              title="Limpiar mostrador y comenzar una nueva venta"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva Venta</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: DATOS DEL CLIENTE / RECEPTOR (HORIZONTAL Y AMPLIO)                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-mono font-black text-xs">
              1
            </span>
            <h2 className="text-sm font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Datos del Cliente / Receptor
            </h2>
            {clienteEncontrado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cliente Registrado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setConsumidorFinal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Contado / Consumidor Final</span>
            </button>

            {(cliente.documento || cliente.nombre) && (
              <button
                type="button"
                onClick={limpiarDatosCliente}
                className="text-xs font-mono font-bold text-slate-400 hover:text-red-500 cursor-pointer px-2 py-1"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Formulario en fila horizontal amplia (3 columnas en PC) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Cédula / RIF */}
          <div ref={cedulaContainerRef} className="md:col-span-4 relative">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1.5">
              Cédula / RIF *
            </label>
            <div className="flex gap-1.5">
              <div className="flex bg-slate-100 dark:bg-[#06080F] rounded-xl p-0.5 border border-slate-300 dark:border-white/10 shrink-0">
                {['V', 'J', 'E', 'G'].map((tipo) => {
                  const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => seleccionarPrefijo(tipo)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-black cursor-pointer transition-colors ${
                        activo ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tipo}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={cliente.documento || ''}
                onChange={(e) => handleDocumentoChange(e.target.value)}
                onFocus={() => {
                  if (sugerenciasCedula.length > 0) setMostrarSugerenciasCedula(true);
                }}
                placeholder="26.946.393"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Desplegable a2 Cédula */}
            {mostrarSugerenciasCedula && sugerenciasCedula.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/20 rounded-2xl shadow-2xl p-1.5 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase">
                  Clientes encontrados (Tipo a2)
                </div>
                {sugerenciasCedula.map((c, i) => (
                  <div
                    key={c.id || i}
                    onMouseDown={() => seleccionarCliente(c)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-white/10 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-red-600 mr-2">{c.cedula_rif}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{c.nombre}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500">
                      Seleccionar
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nombre o Razón Social */}
          <div ref={nombreContainerRef} className="md:col-span-5 relative">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1.5">
              Nombre o Razón Social *
            </label>
            <input
              type="text"
              value={cliente.nombre || ''}
              onChange={(e) => {
                setCliente(prev => ({ ...prev, nombre: e.target.value }));
                if (clienteEncontrado && clienteEncontrado.nombre !== e.target.value) setClienteEncontrado(null);
              }}
              onFocus={() => {
                if (sugerenciasNombre.length > 0) setMostrarSugerenciasNombre(true);
              }}
              placeholder="Ej. Taller Los Andes C.A. o Juan Pérez"
              className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors"
            />

            {/* Desplegable a2 Nombre */}
            {mostrarSugerenciasNombre && sugerenciasNombre.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/20 rounded-2xl shadow-2xl p-1.5 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase">
                  Clientes encontrados por nombre
                </div>
                {sugerenciasNombre.map((c, i) => (
                  <div
                    key={c.id || i}
                    onMouseDown={() => seleccionarCliente(c)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-white/10 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{c.nombre}</p>
                      <p className="text-[10px] font-mono text-red-600">{c.cedula_rif}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500">
                      Cargar
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teléfono de Contacto */}
          <div className="md:col-span-3">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1.5">
              Teléfono de Contacto
            </label>
            <div className="relative">
              <input
                type="tel"
                value={cliente.telefono || ''}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="0414-1234567"
                className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 2: RENGLONES DE LA FACTURA + BUSCADOR INTEGRADO                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        
        {/* Cabecera del Paso 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-mono font-black text-xs">
              2
            </span>
            <h2 className="text-sm font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Renglones de la Factura
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              {items.length} {items.length === 1 ? 'renglón' : 'renglones'} ({totalItemsEnCarrito} piezas)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={agregarItemManual}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-red-500" />
              <span>Renglón Manual</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-xs font-mono font-bold text-rose-500 hover:text-rose-700 cursor-pointer px-2 py-1"
              >
                Vaciar Renglones
              </button>
            )}
          </div>
        </div>

        {/* Buscador Rápido de Repuestos Integrado */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Escribe código corto, número de parte, descripción o vehículo para agregar repuestos (ej: 05143, pastilla, corolla)..."
              className="w-full h-12 pl-11 pr-28 bg-slate-50 dark:bg-[#06080F] border-2 border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-red-600 transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaTexto('');
                    setFiltroLinea('');
                    setFiltroSublinea('');
                    setFiltroMarca('');
                    setFiltroVehiculo('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  mostrarFiltrosAvanzados || filtroLinea || filtroMarca || filtroVehiculo
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
          </div>

          {/* Filtros en Cascada (Colapsables) */}
          {mostrarFiltrosAvanzados && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-2xl animate-in fade-in">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  1. Línea
                </label>
                <select
                  value={filtroLinea}
                  onChange={(e) => {
                    setFiltroLinea(e.target.value);
                    setFiltroSublinea('');
                    setFiltroMarca('');
                    setFiltroVehiculo('');
                  }}
                  className="w-full h-8 px-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                >
                  <option value="">Todas las Líneas</option>
                  {listaLineas.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  2. Sublínea
                </label>
                <select
                  value={filtroSublinea}
                  onChange={(e) => {
                    setFiltroSublinea(e.target.value);
                    setFiltroMarca('');
                    setFiltroVehiculo('');
                  }}
                  className="w-full h-8 px-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                >
                  <option value="">Todas las Sublíneas</option>
                  {sublineasDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  3. Marca del Repuesto
                </label>
                <select
                  value={filtroMarca}
                  onChange={(e) => {
                    setFiltroMarca(e.target.value);
                    setFiltroVehiculo('');
                  }}
                  className="w-full h-8 px-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                >
                  <option value="">Todas las Marcas</option>
                  {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  4. Modelo del Vehículo
                </label>
                <select
                  value={filtroVehiculo}
                  onChange={(e) => setFiltroVehiculo(e.target.value)}
                  className="w-full h-8 px-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                >
                  <option value="">Todos los Modelos</option>
                  {vehiculosDisponibles.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* BANDEJA DE RESULTADOS DE BÚSQUEDA RÁPIDA (SI EL USUARIO ESCRIBIÓ O FILTRÓ) */}
          {hayFiltrosActivos && (
            <div className="bg-slate-50 dark:bg-[#06080F] border-2 border-red-200 dark:border-red-900/40 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>Repuestos encontrados ({productosEncontrados.length})</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Haz clic en "+ Agregar" para añadir a la factura
                </span>
              </div>

              {cargandoProductos ? (
                <div className="py-6 text-center text-xs font-mono text-slate-400 animate-pulse">
                  Buscando repuestos en el inventario...
                </div>
              ) : productosEncontrados.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {productosEncontrados.map((prod) => {
                    const precios = calcularPrecios(prod);
                    const sinStock = (prod.stock ?? 0) <= 0;
                    const agregadoReciente = ultimoAgregadoId === prod.id;
                    const fotoUrl = obtenerFotoRepuesto(prod);

                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                          agregadoReciente
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 scale-[1.02]'
                            : 'bg-white dark:bg-[#0B0F19] border-slate-200 dark:border-white/10 hover:border-red-400'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-mono font-black text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                              {prod.codigo_corto || 'S/C'}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              sinStock
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}>
                              Stock: {prod.stock ?? 0}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {prod.descripcion}
                          </h3>

                          {(prod.marca_producto || prod.marca) && (
                            <p className="text-[10px] font-mono text-slate-500 uppercase">
                              Marca: {prod.marca_producto || prod.marca}
                            </p>
                          )}
                          {prod.modelo_vehiculo && (
                            <p className="text-[10px] text-slate-400 truncate">
                              🚗 {prod.modelo_vehiculo}
                            </p>
                          )}
                        </div>

                        {/* Precios y Botón Agregar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-black text-slate-900 dark:text-white">
                              {formatUSD(precios.pDivisa)}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatVES(precios.pBs)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => agregarAlCarrito(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs font-mono text-slate-400">
                  No se encontraron repuestos con los términos de búsqueda.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TABLA PRINCIPAL DE RENGLONES EN LA FACTURA                                */}
        {/* ========================================================================= */}
        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3 w-28">Código</th>
                  <th className="py-3 px-3">Descripción del Repuesto</th>
                  <th className="py-3 px-3 text-center w-32">Cantidad</th>
                  <th className="py-3 px-3 text-right w-36">Precio Unitario</th>
                  <th className="py-3 px-3 text-right w-36">Subtotal</th>
                  <th className="py-3 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {items.map((it, idx) => (
                  <tr
                    key={it.id || idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Número de Renglón */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Código Corto */}
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                        {it.codigo_corto}
                      </span>
                    </td>

                    {/* Descripción */}
                    <td className="py-3 px-3">
                      {it.codigo_corto === 'MANUAL' ? (
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => handleItemManualChange(idx, 'descripcion', e.target.value)}
                          placeholder="Escribe la descripción del producto o servicio manual..."
                          className="w-full bg-white dark:bg-[#06080F] px-2.5 py-1.5 border border-slate-300 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                        />
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {it.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                            {it.marca && <span className="uppercase font-semibold">{it.marca}</span>}
                            {it.referencia && <span>• Ref: {it.referencia}</span>}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Stepper de Cantidad */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center bg-slate-100 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => modificarCantidad(idx, -1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {it.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => modificarCantidad(idx, 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Precio Unitario */}
                    <td className="py-3 px-3 text-right font-mono">
                      {it.codigo_corto === 'MANUAL' ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span className="text-slate-400">$</span>
                          <input
                            type="text"
                            value={it.precio_divisa || ''}
                            onChange={(e) => handleItemManualChange(idx, 'precio_divisa', e.target.value)}
                            placeholder="0.00"
                            className="w-20 bg-white dark:bg-[#06080F] px-2 py-1 border border-slate-300 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatUSD(it.precio_divisa || it.precio)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatVES(it.precio_bs)}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Subtotal */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {formatUSD(it.subtotal_usd || 0)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatVES(it.subtotal_bs || 0)}
                      </div>
                    </td>

                    {/* Botón Eliminar */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar renglón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              La factura no tiene renglones todavía
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Escribe en el buscador superior para agregar repuestos del inventario o presiona "Renglón Manual" para servicios o productos sin código.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PASO 3: FORMA DE PAGO, TOTALES Y CIERRE DE VENTA                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-mono font-black text-xs">
            3
          </span>
          <h2 className="text-sm font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Forma de Pago y Total a Cobrar
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Modalidades de Pago (4 Botones Táctiles) */}
          <div className="lg:col-span-7 space-y-2.5">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
              Selecciona la Modalidad de Cobro:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('EFECTIVO')}
                className={`p-3 rounded-2xl border text-left transition-all font-bold cursor-pointer ${
                  formaPago === 'EFECTIVO'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm">Efectivo ($)</span>
                </div>
                <div className="text-[11px] font-normal opacity-85">
                  Nota de Entrega • Divisas en Efectivo
                </div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('PAGO_MOVIL')}
                className={`p-3 rounded-2xl border text-left transition-all font-bold cursor-pointer ${
                  formaPago === 'PAGO_MOVIL'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">Pago Móvil / Punto</span>
                </div>
                <div className="text-[11px] font-normal opacity-85">
                  Factura Fiscal • Bolívares Tasa BCV
                </div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('CASHEA')}
                className={`p-3 rounded-2xl border text-left transition-all font-bold cursor-pointer ${
                  formaPago === 'CASHEA'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Cashea (12%)</span>
                </div>
                <div className="text-[11px] font-normal opacity-85">
                  Factura Fiscal • Recargo Cashea Integrado
                </div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('CREDITO_TIENDA')}
                className={`p-3 rounded-2xl border text-left transition-all font-bold cursor-pointer ${
                  formaPago === 'CREDITO_TIENDA'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">Crédito Tienda</span>
                </div>
                <div className="text-[11px] font-normal opacity-85">
                  Nota de Entrega • Cuentas por Cobrar
                </div>
              </button>
            </div>
          </div>

          {/* Desglose Fiscal y Totales Grandes */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 font-mono text-xs">
            
            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-white/10">
              {/* Subtotal Base */}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{formaPago === 'EFECTIVO' ? 'Subtotal (0% IVA):' : 'Subtotal Neto:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formaPago === 'PAGO_MOVIL'
                    ? `${formatVES(totals.baseImponibleBs)} / ${formatUSD(totals.baseImponible)}`
                    : `${formatUSD(totals.baseImponible)} / ${formatVES(totals.baseImponibleBs)}`}
                </span>
              </div>

              {/* IVA 16% (para todo excepto Efectivo con nota de entrega) */}
              {formaPago !== 'EFECTIVO' && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>IVA (16%):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formaPago === 'PAGO_MOVIL'
                      ? `+${formatVES(totals.ivaBs)} / ${formatUSD(totals.iva)}`
                      : `+${formatUSD(totals.iva)} / ${formatVES(totals.ivaBs)}`}
                  </span>
                </div>
              )}

              {/* Recargo Cashea (12%) - Sobre precio con IVA */}
              {formaPago === 'CASHEA' && (
                <div className="flex justify-between text-purple-600 dark:text-purple-400 font-bold">
                  <span>Recargo Cashea (12%):</span>
                  <span>+{formatUSD(totals.recargoCasheaUSD)} / {formatVES(totals.recargoCasheaBs)}</span>
                </div>
              )}
            </div>

            {/* Total Grande Destacado Adaptativo según Forma de Pago */}
            <div className="flex items-end justify-between pt-1">
              <div>
                <span className="text-[11px] font-heading font-black text-slate-400 uppercase tracking-wider block">
                  {formaPago === 'PAGO_MOVIL' 
                    ? 'Total a Cobrar (Bs.)' 
                    : formaPago === 'CASHEA'
                    ? 'Total Cashea ($)'
                    : formaPago === 'EFECTIVO'
                    ? 'Total en Efectivo ($)'
                    : 'Total a Cobrar'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Tasa: {formatVES(tasaActivaNum)}
                </span>
              </div>

              <div className="text-right">
                {formaPago === 'PAGO_MOVIL' ? (
                  /* PAGO MÓVIL: BOLÍVARES EN GRANDE, DÓLARES EN PEQUEÑO ABAJO */
                  <>
                    <div className="text-2xl sm:text-3xl font-heading font-black text-blue-600 dark:text-blue-400 leading-tight">
                      {formatVES(totals.totalBs)}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                      Ref: {formatUSD(totals.totalUSD)}
                    </div>
                  </>
                ) : formaPago === 'CASHEA' ? (
                  /* CASHEA: TOTAL EN DÓLARES EN GRANDE CON RECARGO Y BS ABAJO */
                  <>
                    <div className="text-2xl sm:text-3xl font-heading font-black text-purple-600 dark:text-purple-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-purple-600/80 dark:text-purple-300">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                ) : formaPago === 'EFECTIVO' ? (
                  /* EFECTIVO: DÓLARES EN GRANDE, BS ABAJO */
                  <>
                    <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-400">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                ) : (
                  /* CRÉDITO TIENDA U OTRO */
                  <>
                    <div className="text-2xl sm:text-3xl font-heading font-black text-amber-600 dark:text-amber-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-400">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fila extra explicativa para Cashea (Cuota Inicial + 3 Cuotas) */}
            {formaPago === 'CASHEA' && (
              <div className="mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-500/20 bg-purple-500/10 rounded-xl p-2.5 text-center sm:text-left flex flex-wrap items-center justify-between gap-1 text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                <span>Inicial Cashea (~40%): {formatUSD(totals.totalUSD * 0.4)} ({formatVES(totals.totalBs * 0.4)})</span>
                <span className="opacity-80">+ 3 cuotas de {formatUSD((totals.totalUSD * 0.6) / 3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Emisión Final */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onGuardar}
            disabled={loading || !formularioValido}
            className={`flex-1 w-full py-4 rounded-2xl font-heading font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              formularioValido
                ? 'btn-gradient-red text-white hover:brightness-110 active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <span>Emitiendo Comprobante...</span>
            ) : (
              <>
                <span>Emitir {tipoDocumento === 'factura_fiscal' ? 'Factura Fiscal' : 'Nota de Entrega'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onImprimir}
            disabled={loading || !formularioValido}
            className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Emitir e Imprimir Directo</span>
          </button>
        </div>
      </div>

      {/* MODAL ZOOM DE FOTO SI SE REQUIERE */}
      {repuestoParaZoom && (
        <ModalZoomRepuesto
          producto={repuestoParaZoom}
          onClose={() => setRepuestoParaZoom(null)}
        />
      )}
    </div>
  );
}

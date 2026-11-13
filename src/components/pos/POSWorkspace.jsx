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
  Receipt
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

  // Control del drawer de carrito en teléfono
  const [drawerCarritoAbierto, setDrawerCarritoAbierto] = useState(false);

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
    <div className="space-y-5">

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BANNER SUPERIOR ESTILO MONTANO SYSTEM                                     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200/80 dark:border-red-500/20 mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Mostrador de Ventas
          </span>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
            Punto de Venta y Facturación
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta rápida de repuestos, carga automática de clientes tipo a2 y liquidación fiscal instantánea.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={agregarItemManual}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>+ Renglón Manual</span>
          </button>

          {(items.length > 0 || cliente.nombre) && (
            <button
              type="button"
              onClick={onLimpiar}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-white/[0.06] dark:hover:bg-rose-500/10 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Limpiar todo el mostrador"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUERPO PRINCIPAL: SPLIT SCREEN EN COMPUTADORA (60% CATÁLOGO / 40% TICKET) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LADO IZQUIERDO: BUSCADOR DE INVENTARIO Y CATÁLOGO TÁCTIL (60%) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tarjeta del Buscador Central */}
          <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-red-600" />
                <span>Buscador de Repuestos en Tiempo Real</span>
              </span>

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
                  className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </button>
              )}
            </div>

            {/* Input de Búsqueda Grande */}
            <div className="relative">
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                placeholder="Escribe código corto, OEM, repuesto, marca o vehículo (ej: corolla, 05143)..."
                className="w-full h-11 pl-11 pr-24 bg-slate-50 dark:bg-[#06080F] border-2 border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-red-600 transition-all shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

              <button
                type="button"
                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  mostrarFiltrosAvanzados || filtroLinea || filtroMarca || filtroVehiculo
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>

            {/* Desglose de Filtros en Cascada */}
            {mostrarFiltrosAvanzados && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] animate-in fade-in">
                {/* 1. Línea */}
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                    Línea
                  </label>
                  <select
                    value={filtroLinea}
                    onChange={(e) => {
                      setFiltroLinea(e.target.value);
                      setFiltroSublinea('');
                      setFiltroMarca('');
                      setFiltroVehiculo('');
                    }}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                  >
                    <option value="">Todas las Líneas</option>
                    {listaLineas.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* 2. Sublínea */}
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                    Sublínea
                  </label>
                  <select
                    value={filtroSublinea}
                    onChange={(e) => {
                      setFiltroSublinea(e.target.value);
                      setFiltroMarca('');
                      setFiltroVehiculo('');
                    }}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                  >
                    <option value="">Todas las Sublíneas</option>
                    {sublineasDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* 3. Marca */}
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                    Marca
                  </label>
                  <select
                    value={filtroMarca}
                    onChange={(e) => {
                      setFiltroMarca(e.target.value);
                      setFiltroVehiculo('');
                    }}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                  >
                    <option value="">Todas las Marcas</option>
                    {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* 4. Vehículo */}
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                    Vehículo
                  </label>
                  <select
                    value={filtroVehiculo}
                    onChange={(e) => setFiltroVehiculo(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
                  >
                    <option value="">Todos los Modelos</option>
                    {vehiculosDisponibles.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Resultados de Productos */}
          <div className="space-y-2.5">
            {cargandoProductos ? (
              <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-8 text-center text-slate-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block mr-2" />
                Buscando en catálogo de repuestos...
              </div>
            ) : hayFiltrosActivos && productosEncontrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productosEncontrados.map((prod) => {
                  const precios = calcularPrecios(prod);
                  const agregadoReciente = ultimoAgregadoId === prod.id;
                  const enStock = (prod.stock ?? 0) > 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => agregarAlCarrito(prod)}
                      className={`bg-white dark:bg-[#0B0F19]/90 border rounded-2xl p-3.5 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                        agregadoReciente
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01]'
                          : 'border-slate-200/90 dark:border-white/[0.08] hover:border-red-500/60 hover:shadow-md'
                      }`}
                    >
                      {/* Cabecera del producto */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-mono font-black text-red-600 dark:text-red-400">
                            {prod.codigo_corto}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            enStock 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60' 
                              : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                          }`}>
                            {enStock ? `${prod.stock} disp.` : 'Agotado'}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                          {prod.descripcion}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {prod.marca_producto || prod.marca || 'GENÉRICO'}
                          </span>
                          {prod.referencia && (
                            <>
                              <span>•</span>
                              <span>OEM: {prod.referencia}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pie con Precios y Botón */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="text-sm font-mono font-black text-slate-900 dark:text-white">
                            ${formatUSD(precios.pDivisa)}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Bs. {formatVES(precios.pBs)}
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] group-hover:bg-red-600 group-hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : hayFiltrosActivos ? (
              <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-8 text-center text-slate-400 text-xs font-mono">
                No se encontraron repuestos con los términos o filtros seleccionados.
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-8 text-center text-slate-400 text-xs font-mono space-y-1">
                <Search className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Comienza escribiendo en el buscador superior</p>
                <p className="text-[11px]">Busca repuestos por código corto, descripción, OEM o marca para agregar al ticket.</p>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: TICKET DE VENTA, CLIENTE Y COBRO (40% EN PC / DRAWER EN MÓVIL) */}
        <div className={`lg:col-span-5 space-y-4 ${drawerCarritoAbierto ? 'block' : 'hidden lg:block'}`}>
          
          {/* ========================================================================= */}
          {/* 1. SECCIÓN DE CLIENTE TIPO a2 SOFTWAY                                    */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Cliente / Receptor
                </span>
                {clienteEncontrado && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Registrado
                  </span>
                )}
              </div>

              {(cliente.documento || cliente.nombre) && (
                <button
                  type="button"
                  onClick={limpiarDatosCliente}
                  className="text-[10px] font-mono font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Inputs de Cédula y Nombre Tipo a2 */}
            <div className="space-y-2.5 text-xs">
              
              {/* Cédula / RIF con Autocompletado */}
              <div ref={cedulaContainerRef} className="relative">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  Cédula / RIF *
                </label>
                <div className="flex gap-1">
                  <div className="flex bg-slate-100 dark:bg-[#06080F] rounded-xl p-0.5 border border-slate-300 dark:border-white/10 shrink-0">
                    {['V', 'J', 'E', 'G'].map((tipo) => {
                      const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => seleccionarPrefijo(tipo)}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-black cursor-pointer transition-colors ${
                            activo ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-900'
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
                    className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Desplegable a2 Cédula */}
                {mostrarSugerenciasCedula && sugerenciasCedula.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/20 rounded-xl shadow-2xl p-1 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                    <div className="px-2 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase">
                      Clientes coincidentes (Tipo a2)
                    </div>
                    {sugerenciasCedula.map((c, i) => (
                      <div
                        key={c.id || i}
                        onMouseDown={() => seleccionarCliente(c)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-red-600 mr-2">{c.cedula_rif}</span>
                          <span className="font-bold text-slate-800 dark:text-white">{c.nombre}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">Enter</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nombre o Razón Social */}
              <div ref={nombreContainerRef} className="relative">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
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
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                />

                {/* Desplegable a2 Nombre */}
                {mostrarSugerenciasNombre && sugerenciasNombre.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/20 rounded-xl shadow-2xl p-1 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                    <div className="px-2 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase">
                      Clientes encontrados por nombre
                    </div>
                    {sugerenciasNombre.map((c, i) => (
                      <div
                        key={c.id || i}
                        onMouseDown={() => seleccionarCliente(c)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{c.nombre}</p>
                          <p className="text-[10px] font-mono text-red-600">{c.cedula_rif}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">Cargar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teléfono de Contacto */}
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="tel"
                  value={cliente.telefono || ''}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="0414-1234567"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. LISTA DE RENGLONES EN EL TICKET                                        */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-red-600" />
                <span>Renglones ({totalItemsEnCarrito})</span>
              </span>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-[10px] font-mono font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {items.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#06080F] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      {it.codigo_corto === 'MANUAL' ? (
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => handleItemManualChange(idx, 'descripcion', e.target.value)}
                          placeholder="Descripción del renglón manual..."
                          className="w-full bg-white dark:bg-black/30 px-2 py-1 border border-slate-300 dark:border-white/10 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {it.descripcion}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span className="font-bold text-red-600">{it.codigo_corto}</span>
                        <span>•</span>
                        <span>${formatUSD(it.precio_divisa || it.precio)} c/u</span>
                      </div>
                    </div>

                    {/* Stepper de Cantidad */}
                    <div className="flex items-center gap-1 bg-white dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 rounded-xl p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => modificarCantidad(idx, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">
                        {it.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => modificarCantidad(idx, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal del item */}
                    <div className="text-right font-mono font-bold text-xs shrink-0 w-16">
                      ${formatUSD(it.subtotal_usd || 0)}
                    </div>

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => eliminarItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-mono">
                El carrito está vacío. Agrega repuestos desde el catálogo.
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. MODALIDADES DE PAGO Y CIERRE FISCAL                                    */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-[#0B0F19]/90 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
            
            <div className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Modalidad de Cobro
            </div>

            {/* Selector de 4 botones */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('EFECTIVO')}
                className={`p-2.5 rounded-xl border text-left transition-all font-bold ${
                  formaPago === 'EFECTIVO'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Efectivo ($)</span>
                </div>
                <div className="text-[10px] font-normal opacity-80">Nota de Entrega</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('PAGO_MOVIL')}
                className={`p-2.5 rounded-xl border text-left transition-all font-bold ${
                  formaPago === 'PAGO_MOVIL'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Pago Móvil / Punto</span>
                </div>
                <div className="text-[10px] font-normal opacity-80">Factura Fiscal</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('CASHEA')}
                className={`p-2.5 rounded-xl border text-left transition-all font-bold ${
                  formaPago === 'CASHEA'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cashea (12%)</span>
                </div>
                <div className="text-[10px] font-normal opacity-80">Recargo Integrado</div>
              </button>

              <button
                type="button"
                onClick={() => seleccionarModalidadCierre('CREDITO_TIENDA')}
                className={`p-2.5 rounded-xl border text-left transition-all font-bold ${
                  formaPago === 'CREDITO_TIENDA'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Crédito Tienda</span>
                </div>
                <div className="text-[10px] font-normal opacity-80">Cuentas por Cobrar</div>
              </button>
            </div>

            {/* Liquidación Fiscal */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Neto:</span>
                <span>${formatUSD(totals.baseImponible)} / Bs. {formatVES(totals.baseImponibleBs)}</span>
              </div>
              {formaPago === 'CASHEA' && (
                <div className="flex justify-between text-purple-600 font-bold">
                  <span>Recargo Cashea (12%):</span>
                  <span>+${formatUSD((totals.totalUSD || 0) - (totals.baseImponible || 0))}</span>
                </div>
              )}
              {formaPago !== 'EFECTIVO' && (
                <div className="flex justify-between text-slate-500">
                  <span>IVA (16%):</span>
                  <span>+${formatUSD(totals.iva)} / Bs. {formatVES(totals.ivaBs)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-baseline font-bold text-base text-slate-900 dark:text-white">
                <span className="font-heading">TOTAL A COBRAR:</span>
                <div className="text-right">
                  <div className="text-lg font-black text-red-600 dark:text-red-400">
                    ${formatUSD(totals.totalUSD)}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Bs. {formatVES(totals.totalBs)}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Principal de Emisión */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onGuardar}
                disabled={loading || !formularioValido}
                className={`w-full py-3.5 rounded-2xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  formularioValido
                    ? 'btn-gradient-red shadow-lg active:scale-98'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span>Guardando Comprobante...</span>
                ) : (
                  <>
                    <span>Emitir {tipoDocumento === 'factura_fiscal' ? 'Factura Fiscal' : 'Nota de Entrega'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onImprimir}
                disabled={loading || !formularioValido}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Emitir e Imprimir Directo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA FLOTANTE EN TELÉFONO PARA COBRAR                                    */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 p-2.5">
        <button
          type="button"
          onClick={() => setDrawerCarritoAbierto(!drawerCarritoAbierto)}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-3 shadow-2xl flex items-center justify-between font-bold text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-mono font-black">
              {totalItemsEnCarrito}
            </span>
            <span>{drawerCarritoAbierto ? 'Ocultar Ticket' : 'Ver Ticket / Cobrar'}</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-red-400 dark:text-red-600 font-extrabold">${formatUSD(totals.totalUSD)}</span>
            <span className="text-[10px] text-emerald-400 dark:text-emerald-600">(Bs. {formatVES(totals.totalBs)})</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>
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

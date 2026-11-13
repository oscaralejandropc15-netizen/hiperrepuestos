import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  RotateCcw, 
  Printer, 
  Receipt, 
  User, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Layers, 
  ShoppingBag, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X,
  Package,
  Car,
  Tag,
  Coins,
  Users,
  Filter,
  Eye,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { formatUSD, formatVES, formatNumber, parseVenezuelanNumber, generarVariantesCedula } from '../lib/formatters';
import { obtenerSublineasParaLinea } from '../lib/clasificacionesRepuestos';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import { desglosarModelosVehiculo } from '../lib/vehiculosMarcas';
import ModalZoomRepuesto from './ModalZoomRepuesto';

/**
 * Componente Selector Inteligente con Búsqueda Escribible Integrada (Combobox / Autocomplete)
 * Permite al usuario tanto desplegar la lista como ESCRIBIR DIRECTAMENTE para filtrar opciones y el inventario en tiempo real.
 */
function SearchableFilterSelect({
  label,
  icon: Icon,
  placeholder = 'Buscar o seleccionar...',
  allLabel = 'Todos',
  value,
  onChange,
  options = []
}) {
  const [abierto, setAbierto] = useState(false);
  const [textoFiltro, setTextoFiltro] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sincronizar texto cuando cambia el valor externo
  useEffect(() => {
    setTextoFiltro(value || '');
  }, [value]);

  // Manejar clic fuera para cerrar el menú desplegable
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAbierto(false);
        setTextoFiltro(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Filtrado reactivo de las opciones disponibles mientras el usuario tipea
  const opcionesFiltradas = useMemo(() => {
    const query = textoFiltro.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => opt && opt.toLowerCase().includes(query));
  }, [options, textoFiltro]);

  const seleccionarOpcion = (opcion) => {
    onChange(opcion);
    setTextoFiltro(opcion);
    setAbierto(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setTextoFiltro(val);
    setAbierto(true);
    onChange(val); // Filtra reactivamente la tabla de inventario
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (opcionesFiltradas.length > 0) {
        seleccionarOpcion(opcionesFiltradas[0]);
      } else {
        setAbierto(false);
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const limpiarSeleccion = (e) => {
    e.stopPropagation();
    onChange('');
    setTextoFiltro('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3 text-red-500 flex-shrink-0" />}
          {label}
        </span>
        {value ? (
          <span className="text-[9px] font-mono font-black text-red-600 dark:text-red-400">
            Filtro Activo
          </span>
        ) : null}
      </label>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={textoFiltro}
          onChange={handleInputChange}
          onFocus={() => setAbierto(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-9 pl-3 pr-14 bg-white dark:bg-[#0B0F19] border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-red-600 transition-all ${
            value
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-500/[0.02]'
              : 'border-slate-300 dark:border-white/[0.12]'
          }`}
        />

        <div className="absolute right-2 flex items-center gap-0.5">
          {value ? (
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Borrar este filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setAbierto((prev) => !prev);
              if (!abierto && inputRef.current) inputRef.current.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            title={abierto ? 'Cerrar opciones' : 'Desplegar opciones'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                abierto ? 'rotate-180 text-red-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menú flotante desplegable con opciones filtradas en tiempo real */}
      {abierto && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-white/[0.15] rounded-xl shadow-2xl py-1 text-xs divide-y divide-slate-100 dark:divide-white/[0.04] backdrop-blur-sm animate-in fade-in duration-100">
          
          {/* Opción 'Todos / Sin Filtro' */}
          <button
            type="button"
            onClick={() => seleccionarOpcion('')}
            className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors ${
              !value
                ? 'text-red-600 dark:text-red-400 bg-red-500/[0.06]'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{allLabel}</span>
              <span className="text-[10px] font-normal text-slate-400 opacity-80">(Mostrar todo)</span>
            </span>
            {!value && <Check className="w-3.5 h-3.5 text-red-500" />}
          </button>

          {/* Opciones filtradas en tiempo real */}
          {opcionesFiltradas.length > 0 ? (
            opcionesFiltradas.map((opt) => {
              const estaSeleccionado =
                value && value.trim().toLowerCase() === opt.trim().toLowerCase();

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => seleccionarOpcion(opt)}
                  className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors ${
                    estaSeleccionado
                      ? 'text-red-600 dark:text-red-400 bg-red-500/[0.08]'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {estaSeleccionado && (
                    <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-slate-400 text-[11px] font-mono">
              <div>No coincide con ninguna opción</div>
              <div className="text-[10px] text-red-500 font-bold mt-0.5">
                Filtrando inventario por "{textoFiltro}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FacturadorForm({
  cliente,
  setCliente,
  items,
  setItems,
  tasaBCV,
  setTasaBCV,
  bcvInfo,
  onActualizarBCV,
  cargandoBCV,
  observaciones,
  setObservaciones,
  condicionPago = 'CONTADO',
  setCondicionPago,
  formaPago = 'EFECTIVO',
  setFormaPago,
  monedaIngreso = 'USD',
  setMonedaIngreso,
  tipoDocumento = 'nota_entrega',
  setTipoDocumento,
  proximoCorrelativo = '000001',
  numeroFacturaManual = '',
  setNumeroFacturaManual,
  totals,
  onGuardar,
  onImprimir,
  onLimpiar,
  loading,
  error
}) {

  // =========================================================================
  // ESTADOS DE LA BÚSQUEDA Y FILTROS DE INVENTARIO (SECCIÓN SUPERIOR)
  // =========================================================================
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroSublinea, setFiltroSublinea] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroSoloStock, setFiltroSoloStock] = useState(false);
  const [repuestoParaZoom, setRepuestoParaZoom] = useState(null);

  const [listaLineas, setListaLineas] = useState([
    'Tren Delantero y Dirección', 'Suspensión', 'Motor', 'Frenos', 
    'Eléctrico y Encendido', 'Tracción y Transmisión', 'Refrigeración', 'General'
  ]);
  const [listaMarcas, setListaMarcas] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [ultimoAgregadoId, setUltimoAgregadoId] = useState(null);

  // Sublíneas disponibles dinámicas según la línea seleccionada (Línea -> Sublínea en cascada tipo AutoZone)
  const sublineasDisponibles = useMemo(() => {
    return obtenerSublineasParaLinea(filtroLinea, productosEncontrados);
  }, [filtroLinea, productosEncontrados]);

  // Selector rápido y registro de clientes
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [listaClientesRegistrados, setListaClientesRegistrados] = useState([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [guardandoClienteManual, setGuardandoClienteManual] = useState(false);
  const [clienteGuardadoExitoso, setClienteGuardadoExitoso] = useState(false);
  const clientSelectorRef = useRef(null);
  const inputBusquedaRef = useRef(null);

  // Cargar dinámicamente opciones de líneas, marcas y vehículos existentes en la base de datos
  useEffect(() => {
    async function cargarOpcionesFiltros() {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('linea, sublinea, marca_producto, marca, modelo_vehiculo');
        if (data && !error) {
          const lins = Array.from(new Set(data.map(d => d.linea).filter(Boolean)))
            .filter(l => l.toLowerCase() !== 'tren delantero')
            .sort();
          const marcas = Array.from(new Set(data.map(d => (d.marca_producto || d.marca || '').trim().toUpperCase()).filter(Boolean))).sort();
          const vehs = Array.from(new Set(data.flatMap(d => desglosarModelosVehiculo(d.modelo_vehiculo)))).sort();

          if (lins.length > 0) {
            setListaLineas(Array.from(new Set([...lins, 'Frenos', 'Carrocería', 'Accesorios'])).sort());
          }
          if (marcas.length > 0) setListaMarcas(marcas);
          if (vehs.length > 0) setListaVehiculos(vehs);
        }
      } catch (err) {
        console.warn('Error cargando opciones de filtros:', err);
      }
    }
    cargarOpcionesFiltros();
  }, []);

  // Tasa numérica activa limpia para cálculos reactivos en tiempo real
  const tasaActivaNum = useMemo(() => {
    const parsed = parseVenezuelanNumber(tasaBCV);
    return parsed > 0 ? parsed : 1;
  }, [tasaBCV]);

  // Cerrar selector de clientes al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (clientSelectorRef.current && !clientSelectorRef.current.contains(event.target)) {
        setMostrarListaClientes(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar clientes registrados en Supabase
  const cargarClientesRegistrados = async () => {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true })
        .limit(30);
      setListaClientesRegistrados(data || []);
      setMostrarListaClientes(true);
    } catch (err) {
      console.warn('Error consultando clientes registrados:', err);
    }
  };

  // =========================================================================
  // CONSULTA DE PRODUCTOS (FILTRADO JERÁRQUICO TIPO AUTOZONE)
  // =========================================================================
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

      // 1. Filtro de Línea / Sistema (Tren Delantero, Frenos, Motor, Suspensión...)
      if (linea && linea !== '') {
        query = query.ilike('linea', `%${linea}%`);
      }

      // 2. Filtro de Sub-Línea dependiente
      if (sublinea && sublinea !== '') {
        // Soporta formatos numéricos "0289-BASE MOTOR" o texto "Base Motor"
        const cleanSub = sublinea.replace(/^\d+[-_ ]*/, '').trim();
        query = query.or(`sublinea.ilike.%${sublinea}%,sublinea.ilike.%${cleanSub}%,descripcion.ilike.%${cleanSub}%`);
      }

      // 3. Filtro de Marca (555, BOSCH, WAGNER, GABRIEL, ATS...)
      if (marca && marca !== '') {
        query = query.or(`marca.ilike.%${marca}%,marca_producto.ilike.%${marca}%`);
      }

      // 4. Filtro de Modelo de Vehículo (Toyota Corolla, Chevrolet Aveo, Ford Fiesta...)
      if (vehiculo && vehiculo !== '') {
        query = query.ilike('modelo_vehiculo', `%${vehiculo}%`);
      }

      // 5. Búsqueda de texto libre cruzada
      if (term.length > 0) {
        query = query.or(
          `codigo_corto.ilike.%${term}%,referencia.ilike.%${term}%,descripcion.ilike.%${term}%,marca.ilike.%${term}%,marca_producto.ilike.%${term}%,modelo_vehiculo.ilike.%${term}%,linea.ilike.%${term}%,sublinea.ilike.%${term}%`
        );
      }

      query = query.order('codigo_corto', { ascending: true }).limit(60);

      const { data, error: errQuery } = await query;
      if (errQuery) throw errQuery;

      setProductosEncontrados(data || []);
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Cargar productos al inicio y al cambiar término o cualquiera de los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarProductos(busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo);
    }, 150);
    return () => clearTimeout(timer);
  }, [busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo]);

  // Productos a mostrar directamente del inventario consultado
  const productosFiltradosParaMostrar = productosEncontrados;

  // Limpiar todos los filtros y búsqueda
  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroLinea('');
    setFiltroSublinea('');
    setFiltroMarca('');
    setFiltroVehiculo('');
    if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
  };

  const hayFiltrosActivos = Boolean(
    busquedaTexto || 
    filtroLinea || 
    filtroSublinea || 
    filtroMarca || 
    filtroVehiculo
  );

  // =========================================================================
  // CÁLCULO REACTIVO DE PRECIOS SEGÚN LA TASA EDITABLE ACTIVA
  // =========================================================================
  const calcularPrecios = (prod) => {
    const baseUSD = parseFloat(prod.precio_detal_usd) || 0;
    const aplicaIva = prod.aplica_iva !== false;

    // 1. Divisa ($ USD neto en efectivo, 0% IVA)
    const pDivisa = baseUSD;

    // 2. Pago Móvil / Punto (Bolívares calculados con la tasa editable activa + 16% IVA si aplica)
    const pBs = aplicaIva ? (baseUSD * tasaActivaNum) * 1.16 : (baseUSD * tasaActivaNum);
    const pBsUSD = aplicaIva ? baseUSD * 1.16 : baseUSD;

    // 3. Cashea (USD con 12% de recargo integrado + 16% IVA si aplica)
    const factorCashea = 1.12;
    const factorIva = aplicaIva ? 1.16 : 1.0;
    const pCashea = baseUSD * factorCashea * factorIva;
    const pCasheaBs = pCashea * tasaActivaNum;

    return { pDivisa, pBs, pBsUSD, pCashea, pCasheaBs, aplicaIva };
  };

  // =========================================================================
  // AGREGAR AL CARRITO INFERIOR
  // =========================================================================
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
        costo_usd: parseFloat(prod.costo_usd) || 0,
        precio_detal_usd: parseFloat(prod.precio_detal_usd) || 0,
        tipo_tarifa: 'detal',
        aplica_iva: precios.aplicaIva,
        stock_disponible: prod.stock ?? 0,
        cantidad: 1,
        precio_divisa: precios.pDivisa,
        precio_bs: precios.pBs,
        precio_cashea: precios.pCashea,
        subtotal_usd: precios.pDivisa,
        subtotal_bs: precios.pBs,
        subtotal_cashea: precios.pCashea,
        precio: precios.pDivisa,
        precio_unitario_usd: precios.pDivisa
      };

      return [nuevoItem, ...prev];
    });

    setUltimoAgregadoId(prod.id);
    setTimeout(() => setUltimoAgregadoId(null), 1000);
  };

  const modificarCantidad = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const nuevaCantidad = Math.max(1, (item.cantidad || 1) + delta);
      item.cantidad = nuevaCantidad;
      item.subtotal_usd = nuevaCantidad * (item.precio_divisa || 0);
      item.subtotal_bs = nuevaCantidad * (item.precio_bs || 0);
      item.subtotal_cashea = nuevaCantidad * (item.precio_cashea || 0);
      next[index] = item;
      return next;
    });
  };

  const eliminarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // REGLAS ESTRICTAS DE CIERRE DE VENTA
  // =========================================================================
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
      if (!cliente.id && !clienteEncontrado) {
        cargarClientesRegistrados();
      }
    }
  };

  // Manejador inteligente y ultrarrápido de Cédula/RIF
  useEffect(() => {
    const doc = (cliente.documento || '').trim();
    const soloDigitos = doc.replace(/\D/g, '');
    if (soloDigitos.length < 5) {
      setClienteEncontrado(null);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const variantes = generarVariantesCedula(doc);
        const orClause = variantes.map(v => `cedula_rif.eq.${v}`).join(',');

        // 1. Buscar en la tabla principal de clientes
        const { data: clientData } = await supabase
          .from('clientes')
          .select('*')
          .or(orClause)
          .limit(1)
          .maybeSingle();

        if (clientData && clientData.nombre) {
          setClienteEncontrado(clientData);
          setCliente(prev => ({
            ...prev,
            id: clientData.id,
            nombre: clientData.nombre,
            telefono: clientData.telefono || prev.telefono || '',
            direccion: clientData.direccion || prev.direccion || ''
          }));
          return;
        }

        // 2. Si aún no está en clientes, buscar en ventas anteriores (guias_despacho)
        const orGuias = variantes.map(v => `cliente_documento.eq.${v}`).join(',');
        const { data: guiaData } = await supabase
          .from('guias_despacho')
          .select('cliente_nombre, cliente_telefono, cliente_direccion, cliente_documento')
          .or(orGuias)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (guiaData && guiaData.cliente_nombre) {
          const clienteRecuperado = {
            id: null,
            cedula_rif: guiaData.cliente_documento || doc,
            nombre: guiaData.cliente_nombre,
            telefono: guiaData.cliente_telefono || '',
            direccion: guiaData.cliente_direccion || ''
          };
          setClienteEncontrado(clienteRecuperado);
          setCliente(prev => ({
            ...prev,
            id: null,
            nombre: guiaData.cliente_nombre,
            telefono: guiaData.cliente_telefono || prev.telefono || '',
            direccion: guiaData.cliente_direccion || prev.direccion || ''
          }));
          return;
        }

        // No encontrado en ningún registro
        setClienteEncontrado(null);
        setCliente(prev => ({ ...prev, id: null }));
      } catch (err) {
        console.warn('Error consultando cliente:', err);
      } finally {
        setBuscandoCliente(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [cliente.documento]);

  const registrarClienteManual = async () => {
    if (!cliente.documento?.trim() || !cliente.nombre?.trim()) return;
    setGuardandoClienteManual(true);
    try {
      const { data } = await supabase
        .from('clientes')
        .upsert({
          cedula_rif: cliente.documento.trim(),
          nombre: cliente.nombre.trim(),
          telefono: cliente.telefono?.trim() || null,
          direccion: cliente.direccion?.trim() || null
        }, { onConflict: 'cedula_rif' })
        .select('*')
        .maybeSingle();

      if (data) {
        setClienteEncontrado(data);
        setCliente(prev => ({ ...prev, id: data.id }));
        setClienteGuardadoExitoso(true);
        setTimeout(() => setClienteGuardadoExitoso(false), 3500);
      }
    } catch (e) {
      console.warn('Error al registrar cliente:', e);
    } finally {
      setGuardandoClienteManual(false);
    }
  };

  const handleDocumentoChange = (raw) => {
    const prev = cliente.documento || '';
    let val = raw.toUpperCase().replace(/\s+/g, '');

    if (prev.endsWith('-') && ['V', 'J', 'E', 'G', 'P'].includes(val)) {
      setCliente(prev => ({ ...prev, documento: '' }));
      return;
    }

    if (!val) {
      setCliente(prev => ({ ...prev, documento: '' }));
      return;
    }

    let prefix = 'V';
    let rest = val;

    const match = val.match(/^([VJEGP])(-?)(.*)$/);
    if (match) {
      prefix = match[1];
      const hasDash = match[2];
      rest = match[3];

      if (!hasDash && !rest) {
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
      if (digits.length === 9) {
        const base = digits.slice(0, 8).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        formattedDoc = `${prefix}-${base}-${digits.slice(8)}`;
      } else {
        const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        formattedDoc = `${prefix}-${withDots}`;
      }
    }

    setCliente(prev => ({ ...prev, documento: formattedDoc }));
  };

  const seleccionarPrefijo = (prefijo) => {
    const docActual = cliente.documento || '';
    const numPart = docActual.replace(/^[VJEGP]-\s*/i, '');
    if (!numPart) {
      setCliente(prev => ({ ...prev, documento: `${prefijo}-` }));
    } else {
      handleDocumentoChange(`${prefijo}-${numPart}`);
    }
  };

  const handleTelefonoChange = (raw) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('58') && digits.length >= 12) {
      digits = '0' + digits.slice(2);
    }
    digits = digits.slice(0, 11);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    setCliente(prev => ({ ...prev, telefono: formatted }));
  };

  const seleccionarClienteRegistrado = (c) => {
    setCliente({
      id: c.id,
      nombre: c.nombre,
      documento: c.cedula_rif,
      telefono: c.telefono || '',
      direccion: c.direccion || ''
    });
    setClienteEncontrado(c);
    setMostrarListaClientes(false);
  };

  // Validación de cierre
  const esCreditoTienda = formaPago === 'CREDITO_TIENDA';
  const clienteValidoParaCredito = !esCreditoTienda || Boolean(cliente.id || clienteEncontrado?.id);
  const formularioValido =
    cliente.nombre?.trim().length > 0 &&
    cliente.documento?.trim().length > 0 &&
    clienteValidoParaCredito &&
    items.length > 0;

  const totalItemsEnCarrito = items.reduce((acc, it) => acc + (it.cantidad || 1), 0);

  return (
    <div className="space-y-5 font-sans text-slate-900 dark:text-slate-100 pb-16">

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs sm:text-sm flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: CONTROL MANUAL DE TASA DE CAMBIO + NRO. DE CONTROL        */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* TASA DE CAMBIO EDITABLE (MANUAL PARA FINES DE SEMANA O AJUSTE LIBRE) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-1 flex items-center justify-center flex-shrink-0">
            <img src="/bcv_logo.svg" alt="BCV" className="w-full h-full object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tasa de Cambio:
            </span>

            {/* INPUT NUMÉRICO TOTALMENTE EDITABLE CON 2 DECIMALES */}
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                value={tasaBCV}
                onChange={(e) => setTasaBCV(e.target.value)}
                onBlur={() => {
                  if (tasaBCV) {
                    const n = parseVenezuelanNumber(tasaBCV);
                    if (!isNaN(n) && n > 0) {
                      setTasaBCV(n.toFixed(2));
                    }
                  }
                }}
                placeholder="0.00"
                className="w-28 sm:w-36 h-9 px-2.5 bg-slate-50 dark:bg-[#06080F] border-2 border-emerald-500/60 focus:border-emerald-500 rounded-xl font-mono font-black text-sm sm:text-base text-emerald-700 dark:text-emerald-300 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/25 shadow-inner"
                title="Tasa editable con 2 decimales: puedes escribir cualquier tasa (ej. 68.57) y todos los precios se actualizarán de inmediato"
              />
              <span className="text-xs font-mono font-bold text-slate-500 ml-1.5">Bs. / $</span>
            </div>

            {/* BOTÓN RESTABLECER A TASA OFICIAL DE LA API */}
            {onActualizarBCV && (
              <button
                type="button"
                onClick={onActualizarBCV}
                disabled={cargandoBCV}
                title="Restablecer a Tasa Oficial BCV del día"
                className="p-2 text-slate-400 hover:text-emerald-500 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${cargandoBCV ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
            · Editable manualmente (fines de semana / cortes)
          </span>
        </div>

        {/* NÚMERO DE CONTROL CORRELATIVO */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Nº de Venta:
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={numeroFacturaManual !== '' ? numeroFacturaManual : proximoCorrelativo}
              onChange={(e) => setNumeroFacturaManual && setNumeroFacturaManual(e.target.value)}
              placeholder={proximoCorrelativo}
              className="w-24 h-9 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-mono font-black text-xs sm:text-sm text-center text-red-600 dark:text-red-400 focus:outline-none focus:border-red-600"
            />
            {numeroFacturaManual !== '' && numeroFacturaManual !== proximoCorrelativo && (
              <button
                type="button"
                onClick={() => setNumeroFacturaManual && setNumeroFacturaManual('')}
                className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-white/10 rounded-lg"
              >
                Auto
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN SUPERIOR: BÚSQUEDA Y RESULTADOS A ANCHO COMPLETO (DESAMONTONADO)  */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-4">
        
        {/* Cabecera de búsqueda y contador */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Búsqueda Rápida de Inventario (Mostrador)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Escribe cualquier referencia para consultar precios y existencias en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {cargandoProductos ? 'Consultando...' : `${productosEncontrados.length} repuestos encontrados`}
            </span>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                title="Limpiar búsqueda y filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* INPUT DE BÚSQUEDA A ANCHO COMPLETO */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputBusquedaRef}
            type="text"
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            placeholder="Escribe código corto, OEM, repuesto, marca o vehículo (ej: Corolla, Pastillas, 555, Amortiguador)..."
            className="w-full h-12 sm:h-14 pl-12 pr-10 bg-slate-50 dark:bg-[#06080F] border-2 border-slate-300 dark:border-white/[0.12] focus:border-red-600 dark:focus:border-red-500 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-red-600/15 shadow-inner transition-all uppercase"
            autoFocus
          />
          {busquedaTexto && (
            <button
              type="button"
              onClick={() => {
                setBusquedaTexto('');
                if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SELECTORES DE FILTRO JERÁRQUICO: LÍNEA -> SUB-LÍNEA -> MARCA -> VEHÍCULO   */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#06080F]/80 border border-slate-200 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. SELECTOR DE LÍNEA / SISTEMA */}
            <SearchableFilterSelect
              label="1. Línea / Sistema:"
              icon={Layers}
              placeholder="Elige o busca línea (Frenos, Motor...)..."
              allLabel="Todas las Líneas"
              value={filtroLinea}
              onChange={(val) => {
                setFiltroLinea(val);
                setFiltroSublinea(''); // Reiniciar sublínea cuando se cambia de línea
              }}
              options={listaLineas}
            />

            {/* 2. SELECTOR DE TIPO DE PIEZA / SUB-LÍNEA */}
            <SearchableFilterSelect
              label="2. Tipo de Pieza (Sub-Línea):"
              icon={Tag}
              placeholder={filtroLinea ? `Piezas de ${filtroLinea}...` : 'Elige o busca tipo de pieza...'}
              allLabel={filtroLinea ? `Todas las piezas de ${filtroLinea}` : 'Todas las Sub-Líneas'}
              value={filtroSublinea}
              onChange={(val) => setFiltroSublinea(val)}
              options={sublineasDisponibles}
            />

            {/* 3. SELECTOR DE MARCA DE REPUESTO */}
            <SearchableFilterSelect
              label="3. Marca de Repuesto:"
              icon={Tag}
              placeholder="Escribe marca (BOSCH, ATS, GABRIEL...)..."
              allLabel="Todas las Marcas"
              value={filtroMarca}
              onChange={(val) => setFiltroMarca(val)}
              options={listaMarcas}
            />

            {/* 4. SELECTOR DE MODELO / VEHÍCULO */}
            <SearchableFilterSelect
              label="4. Vehículo / Compatibilidad:"
              icon={Car}
              placeholder="Vehículo (Corolla, Aveo, Hilux...)..."
              allLabel="Todos los Vehículos"
              value={filtroVehiculo}
              onChange={(val) => setFiltroVehiculo(val)}
              options={listaVehiculos}
            />
          </div>
        </div>

        {/* TABLA DE RESULTADOS A ANCHO COMPLETO CON FOTO DE REFERENCIA AUTOZONE */}
        <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#06080F]/95">
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            {/* VISTA TABLA PARA COMPUTADORA Y PANTALLAS GRANDES */}
            <table className="hidden md:table w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b-2 border-slate-300 dark:border-white/[0.12] sticky top-0 z-10 font-mono font-black text-slate-600 dark:text-slate-300 select-none">
                <tr>
                  <th className="w-12 px-2 py-2.5 text-center whitespace-nowrap">FOTO</th>
                  <th className="px-2.5 py-2.5 whitespace-nowrap">CÓDIGO / OEM</th>
                  <th className="px-3 py-2.5 min-w-[220px]">REPUESTO / COMPATIBILIDAD</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">STOCK</th>
                  <th className="px-2.5 py-2.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <div>DIVISA ($)</div>
                    <div className="text-[9px] font-normal text-slate-400 font-sans">Efectivo 0% IVA</div>
                  </th>
                  <th className="px-2.5 py-2.5 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    <div>P. MÓVIL (BS)</div>
                    <div className="text-[9px] font-normal text-slate-400 font-sans">con 16% IVA</div>
                  </th>
                  <th className="px-2.5 py-2.5 text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">
                    <div>CASHEA ($)</div>
                    <div className="text-[9px] font-normal text-slate-400 font-sans">+12% rec. e IVA</div>
                  </th>
                  <th className="px-2.5 py-2.5 text-center whitespace-nowrap">
                    ACCIÓN
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {productosFiltradosParaMostrar.length > 0 ? (
                  productosFiltradosParaMostrar.map((prod) => {
                    const precios = calcularPrecios(prod);
                    const agotado = (prod.stock ?? 0) <= 0;
                    const esUltimoAgregado = ultimoAgregadoId === prod.id;
                    const fotoProd = obtenerFotoRepuesto(prod);

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-red-500/[0.04] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* 0. FOTO DE REFERENCIA AUTOZONE (CLIC PARA ZOOM) */}
                        <td className="w-12 px-2 py-1.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setRepuestoParaZoom(prod)}
                            className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-red-500 transition-all shadow-sm hover:scale-105 cursor-pointer bg-white dark:bg-black/40 group/foto inline-flex items-center justify-center p-0.5"
                            title="Ver foto del repuesto"
                          >
                            <img
                              src={fotoProd}
                              alt={prod.descripcion}
                              className="w-full h-full object-contain drop-shadow"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/foto:opacity-100 flex items-center justify-center transition-opacity text-white rounded-xl">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        </td>

                        {/* 1. CÓDIGO CORTO + REF. OEM EN UNA SOLA CELDA COMPACTA */}
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 inline-block">
                            {prod.codigo_corto}
                          </span>
                          {prod.referencia && prod.referencia !== '—' && (
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 font-bold" title={`OEM: ${prod.referencia}`}>
                              OEM: {prod.referencia}
                            </div>
                          )}
                        </td>

                        {/* 2. DESCRIPCIÓN DEL REPUESTO + MARCA + VEHÍCULO + CATEGORÍAS */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {prod.linea && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                {prod.linea}
                              </span>
                            )}
                            {prod.sublinea && prod.sublinea !== 'General' && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                                {prod.sublinea}
                              </span>
                            )}
                            {/* BADGE MARCA */}
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-white/15">
                              {prod.marca_producto || prod.marca || 'ATS'}
                            </span>
                            {/* COMPATIBILIDAD VEHÍCULO */}
                            {(prod.modelo_vehiculo || prod.vehiculo) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.06]">
                                <Car className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{prod.modelo_vehiculo || prod.vehiculo}</span>
                              </span>
                            )}
                          </div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase leading-snug group-hover:text-red-600 dark:group-hover:text-rose-400 transition-colors">
                            {prod.descripcion}
                          </div>
                          {prod.medidas && (
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {prod.medidas}
                            </div>
                          )}
                        </td>

                        {/* 6. STOCK (MUESTRA 0 CON ALTA VISIBILIDAD) */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {agotado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35 shadow-sm">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>0</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/35 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{prod.stock}</span>
                              <span className="text-[10px] font-sans font-normal opacity-80">disp.</span>
                            </span>
                          )}
                        </td>

                        {/* 7. PRECIO DIVISA ($) */}
                        <td className="px-2.5 py-2 text-right whitespace-nowrap font-mono text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          <div className="font-black">{formatUSD(precios.pDivisa)}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ≈ {formatVES(precios.pDivisa * tasaActivaNum)}
                          </div>
                        </td>

                        {/* 8. PRECIO PAGO MÓVIL (BS RECALCULADO CON TASA EDITABLE) */}
                        <td className="px-2.5 py-2 text-right whitespace-nowrap font-mono text-xs text-blue-600 dark:text-blue-400">
                          <div className="font-black">{formatVES(precios.pBs)}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {formatUSD(precios.pBsUSD)}
                          </div>
                        </td>

                        {/* 9. PRECIO CASHEA ($) */}
                        <td className="px-2.5 py-2 text-right whitespace-nowrap font-mono text-xs text-purple-600 dark:text-purple-400">
                          <div className="font-black">{formatUSD(precios.pCashea)}</div>
                          <div className="text-[10px] text-purple-400/80 font-normal">
                            ≈ {formatVES(precios.pCasheaBs)}
                          </div>
                        </td>

                        {/* 10. BOTÓN AGREGAR */}
                        <td className="px-2.5 py-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => agregarAlCarrito(prod)}
                            title={agotado ? `Agregar ${prod.descripcion} (Stock en 0 - Para cotización/pedido)` : `Agregar ${prod.descripcion} al carrito`}
                            className={`px-2.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer mx-auto ${
                              esUltimoAgregado
                                ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 scale-105'
                                : agotado
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/20'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                            }`}
                          >
                            {esUltimoAgregado ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>¡Listo!</span>
                              </>
                            ) : agotado ? (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Cotizar</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Agregar</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="max-w-md mx-auto space-y-2">
                        <Package className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          No se encontraron repuestos con "{busquedaTexto}"
                        </p>
                        <button
                          type="button"
                          onClick={() => setBusquedaTexto('')}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Ver todo el inventario
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* VISTA TARJETAS TÁCTILES PARA CELULARES Y PANTALLAS PEQUEÑAS (MD:HIDDEN) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.08] p-2 space-y-2.5">
              {productosFiltradosParaMostrar.length > 0 ? (
                productosFiltradosParaMostrar.map((prod) => {
                  const precios = calcularPrecios(prod);
                  const agotado = (prod.stock ?? 0) <= 0;
                  const esUltimoAgregado = ultimoAgregadoId === prod.id;
                  const fotoProd = obtenerFotoRepuesto(prod);

                  return (
                    <div 
                      key={prod.id} 
                      className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Foto zoomable */}
                        <button
                          type="button"
                          onClick={() => setRepuestoParaZoom(prod)}
                          className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-black/40 flex items-center justify-center p-0.5 cursor-pointer shadow-xs"
                          title="Ver foto del repuesto"
                        >
                          <img
                            src={fotoProd}
                            alt={prod.descripcion}
                            className="w-full h-full object-contain drop-shadow"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 active:opacity-100 flex items-center justify-center text-white rounded-xl">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Badges de Código, Marca y Stock */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                              {prod.codigo_corto}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                              {prod.marca_producto || prod.marca || 'ATS'}
                            </span>
                            {agotado ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35">
                                Stock: 0
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/35">
                                Stock: {prod.stock}
                              </span>
                            )}
                          </div>

                          {/* Nombre del Repuesto */}
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase leading-snug mt-1">
                            {prod.descripcion}
                          </div>

                          {/* Compatibilidad Vehículo */}
                          {(prod.modelo_vehiculo || prod.vehiculo) && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                              <Car className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{prod.modelo_vehiculo || prod.vehiculo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fila Inferior: Precios y Botón de Acción Táctil */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.06] gap-2">
                        <div className="space-y-0.5">
                          <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {formatUSD(precios.pDivisa)}
                            <span className="text-[10px] text-slate-400 font-normal ml-1">Efectivo</span>
                          </div>
                          <div className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {formatVES(precios.pBs)}
                            <span className="text-[9px] text-slate-400 font-normal ml-1">P. Móvil</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => agregarAlCarrito(prod)}
                          className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[38px] ${
                            esUltimoAgregado
                              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                              : agotado
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {esUltimoAgregado ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>¡Listo!</span>
                            </>
                          ) : agotado ? (
                            <>
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>Cotizar</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>Agregar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No se encontraron repuestos con "{busquedaTexto}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setBusquedaTexto('')}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Ver todo el inventario
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INFERIOR: CLIENTE, CARRITO Y CIERRE A ANCHO COMPLETO             */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-5">
        
        {/* FILA 1: DATOS DEL CLIENTE (RECEPTOR) EN FORMATO HORIZONTAL HOLGADO */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-600" />
                <span>Datos del Cliente / Receptor</span>
              </span>

              {/* Indicadores inteligentes de estado del cliente */}
              {buscandoCliente && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 animate-pulse border border-blue-200 dark:border-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  Buscando cédula...
                </span>
              )}

              {clienteEncontrado && !buscandoCliente && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>✓ Registrado: <strong className="font-extrabold">{clienteEncontrado.nombre}</strong> (Datos cargados)</span>
                </span>
              )}

              {!clienteEncontrado && !buscandoCliente && (cliente.documento || '').replace(/\D/g, '').length >= 5 && (cliente.nombre || '').trim().length >= 2 && (
                <div className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    ℹ️ Nuevo: Se guardará con la venta
                  </span>
                  <button
                    type="button"
                    onClick={registrarClienteManual}
                    disabled={guardandoClienteManual}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                    title="Guardar este cliente en la base de datos ahora mismo"
                  >
                    {guardandoClienteManual ? 'Guardando...' : '+ Registrar Ahora'}
                  </button>
                </div>
              )}

              {clienteGuardadoExitoso && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm">
                  ✓ ¡Cliente registrado con éxito!
                </span>
              )}
            </div>

            {/* Selector de Clientes Registrados */}
            <div ref={clientSelectorRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (mostrarListaClientes) setMostrarListaClientes(false);
                  else cargarClientesRegistrados();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>Clientes Registrados</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {mostrarListaClientes && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/[0.15] rounded-xl shadow-2xl z-50 p-2 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {listaClientesRegistrados.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => seleccionarClienteRegistrado(c)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.nombre}</p>
                      <p className="text-[10px] font-mono text-slate-400">{c.cedula_rif}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid de 4 campos del cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Cédula/RIF */}
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Cédula / RIF *
              </label>
              <div className="flex gap-1">
                <div className="flex bg-slate-100 dark:bg-[#06080F] rounded-lg p-0.5 border border-slate-300 dark:border-white/10">
                  {['V', 'J'].map((tipo) => {
                    const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => seleccionarPrefijo(tipo)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          activo ? 'bg-red-600 text-white' : 'text-slate-500'
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
                  placeholder="26.946.393"
                  className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Nombre */}
            <div className="lg:col-span-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                value={cliente.nombre || ''}
                onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Cliente Mostrador o Razón Social"
                className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={cliente.telefono || ''}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="Ej. 0414-1234567"
                className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* FILA 2: TABLA DEL CARRITO DE COMPRAS A ANCHO COMPLETO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span>Carrito de Compras ({totalItemsEnCarrito} {totalItemsEnCarrito === 1 ? 'repuesto' : 'repuestos'})</span>
            </span>

            {items.length > 0 && (
              <button
                type="button"
                onClick={onLimpiar}
                className="text-xs font-mono font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Carrito</span>
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">El carrito de venta está vacío</p>
              <p className="text-xs text-slate-400">
                Presiona el botón verde <strong>[ + Agregar ]</strong> en la tabla de búsqueda superior para cargar productos.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#06080F]/95">
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                {/* VISTA TABLA PARA COMPUTADORA */}
                <table className="hidden md:table w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-white/[0.1] font-mono font-black text-slate-600 dark:text-slate-300 sticky top-0 select-none">
                    <tr>
                      <th className="px-2.5 py-2">CÓDIGO</th>
                      <th className="px-3 py-2 min-w-[180px]">DESCRIPCIÓN</th>
                      <th className="px-2.5 py-2 text-right">PRECIO UNITARIO ($)</th>
                      <th className="px-2 py-2 text-center">CANTIDAD</th>
                      <th className="px-2.5 py-2 text-right text-emerald-600 dark:text-emerald-400">SUBTOTAL ($)</th>
                      <th className="px-2.5 py-2 text-right text-blue-600 dark:text-blue-400">SUBTOTAL (BS)</th>
                      <th className="px-2 py-2 text-center w-10">QUITAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {items.map((item, index) => {
                      const pDivisa = item.precio_divisa || item.precio || 0;
                      const qty = item.cantidad || 1;
                      const aplicaIva = item.aplica_iva !== false;

                      // Cálculo dinámico según modalidad de pago activa en el carrito
                      let precioUnitarioUSD = pDivisa;
                      let subTotalUSD = qty * pDivisa;
                      let subTotalBs = subTotalUSD * tasaActivaNum;

                      if (formaPago === 'CASHEA') {
                        // Cashea: 12% recargo + 16% IVA
                        const factorCashea = 1.12;
                        const factorIva = aplicaIva ? 1.16 : 1.0;
                        precioUnitarioUSD = pDivisa * factorCashea * factorIva;
                        subTotalUSD = qty * precioUnitarioUSD;
                        subTotalBs = subTotalUSD * tasaActivaNum;
                      } else if (formaPago === 'PAGO_MOVIL' || formaPago === 'CREDITO_TIENDA') {
                        // Pago Móvil y Crédito: 16% IVA
                        const factorIva = aplicaIva ? 1.16 : 1.0;
                        precioUnitarioUSD = pDivisa * factorIva;
                        subTotalUSD = qty * precioUnitarioUSD;
                        subTotalBs = subTotalUSD * tasaActivaNum;
                      } else {
                        // Efectivo: 0% IVA
                        precioUnitarioUSD = pDivisa;
                        subTotalUSD = qty * pDivisa;
                        subTotalBs = subTotalUSD * tasaActivaNum;
                      }

                      return (
                        <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="px-2.5 py-2 whitespace-nowrap font-mono font-bold text-red-600 dark:text-red-400">
                            {item.codigo_corto}
                          </td>
                          <td className="px-3 py-2 font-bold uppercase text-slate-900 dark:text-white">
                            {item.descripcion}
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {formatUSD(precioUnitarioUSD)}
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center bg-slate-100 dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => modificarCantidad(index, -1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                                {item.cantidad || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => modificarCantidad(index, 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                            {formatUSD(subTotalUSD)}
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {formatVES(subTotalBs)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarItem(index)}
                              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Eliminar producto del carrito"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* VISTA TARJETAS TÁCTILES PARA CELULARES (MD:HIDDEN) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.08] p-2 space-y-2.5">
                  {items.map((item, index) => {
                    const pDivisa = item.precio_divisa || item.precio || 0;
                    const qty = item.cantidad || 1;
                    const aplicaIva = item.aplica_iva !== false;

                    let precioUnitarioUSD = pDivisa;
                    let subTotalUSD = qty * pDivisa;
                    let subTotalBs = subTotalUSD * tasaActivaNum;

                    if (formaPago === 'CASHEA') {
                      const factorCashea = 1.12;
                      const factorIva = aplicaIva ? 1.16 : 1.0;
                      precioUnitarioUSD = pDivisa * factorCashea * factorIva;
                      subTotalUSD = qty * precioUnitarioUSD;
                      subTotalBs = subTotalUSD * tasaActivaNum;
                    } else if (formaPago === 'PAGO_MOVIL' || formaPago === 'CREDITO_TIENDA') {
                      const factorIva = aplicaIva ? 1.16 : 1.0;
                      precioUnitarioUSD = pDivisa * factorIva;
                      subTotalUSD = qty * precioUnitarioUSD;
                      subTotalBs = subTotalUSD * tasaActivaNum;
                    } else {
                      precioUnitarioUSD = pDivisa;
                      subTotalUSD = qty * pDivisa;
                      subTotalBs = subTotalUSD * tasaActivaNum;
                    }

                    return (
                      <div
                        key={item.id || index}
                        className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono font-black text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 inline-block">
                              {item.codigo_corto}
                            </span>
                            <div className="font-bold uppercase text-xs text-slate-900 dark:text-white mt-1 leading-snug">
                              {item.descripcion}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              P. Unit: {formatUSD(precioUnitarioUSD)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarItem(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer transition-colors shrink-0"
                            title="Eliminar producto del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Fila inferior: Controles de Cantidad + Subtotales */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.06] gap-2">
                          <div className="inline-flex items-center bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => modificarCantidad(index, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                              {item.cantidad || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => modificarCantidad(index, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right space-y-0.5">
                            <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {formatUSD(subTotalUSD)}
                            </div>
                            <div className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                              {formatVES(subTotalBs)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASO 1: SELECCIONA LA MODALIDAD DE PAGO (ANTES DE TOTALES)                */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">1</span>
              <span>Selecciona la Modalidad de Pago:</span>
            </span>
            <span className="text-[11px] font-sans text-slate-400 font-medium">
              Ajusta automáticamente impuestos, recargos y tipo de documento
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* EFECTIVO */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('EFECTIVO')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'EFECTIVO'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-lg scale-[1.02] ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Banknote className="w-5 h-5" />
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                  formaPago === 'EFECTIVO' ? 'bg-white text-emerald-900 shadow-sm' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>0% IVA</span>
              </div>
              <div>
                <div className="font-extrabold text-sm">Efectivo ($ / Bs)</div>
                <div className={`text-xs mt-0.5 ${formaPago === 'EFECTIVO' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Nota de Entrega · Sin formato fiscal
                </div>
              </div>
              {formaPago === 'EFECTIVO' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
            </button>

            {/* PAGO MÓVIL / PUNTO */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('PAGO_MOVIL')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'PAGO_MOVIL'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400 shadow-lg scale-[1.02] ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-5 h-5" />
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                  formaPago === 'PAGO_MOVIL' ? 'bg-white text-blue-900 shadow-sm' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                }`}>+16% IVA</span>
              </div>
              <div>
                <div className="font-extrabold text-sm">Pago Móvil / Punto</div>
                <div className={`text-xs mt-0.5 ${formaPago === 'PAGO_MOVIL' ? 'text-blue-100' : 'text-slate-400'}`}>
                  Factura Fiscal SENIAT
                </div>
              </div>
              {formaPago === 'PAGO_MOVIL' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
            </button>

            {/* CASHEA */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('CASHEA')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'CASHEA'
                  ? 'bg-gradient-to-br from-purple-600 to-violet-800 text-white border-purple-400 shadow-lg scale-[1.02] ring-2 ring-purple-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-purple-500/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-5 h-5" />
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                  formaPago === 'CASHEA' ? 'bg-white text-purple-900 shadow-sm' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                }`}>+12% Rec.</span>
              </div>
              <div>
                <div className="font-extrabold text-sm">Cashea (3 Cuotas)</div>
                <div className={`text-xs mt-0.5 ${formaPago === 'CASHEA' ? 'text-purple-100' : 'text-slate-400'}`}>
                  12% Recargo Integrado + IVA
                </div>
              </div>
              {formaPago === 'CASHEA' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
            </button>

            {/* CRÉDITO TIENDA */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('CREDITO_TIENDA')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'CREDITO_TIENDA'
                  ? 'bg-gradient-to-br from-amber-600 to-yellow-700 text-white border-amber-400 shadow-lg scale-[1.02] ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-5 h-5" />
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                  formaPago === 'CREDITO_TIENDA' ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>+16% IVA</span>
              </div>
              <div>
                <div className="font-extrabold text-sm">Crédito Tienda</div>
                <div className={`text-xs mt-0.5 ${formaPago === 'CREDITO_TIENDA' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Cuentas por Cobrar · Con IVA
                </div>
              </div>
              {formaPago === 'CREDITO_TIENDA' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PASO 2: TICKET DE LIQUIDACIÓN UNIFICADO + TOTAL A PAGAR Y EMISIÓN         */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-50/90 dark:bg-[#06080F] border-2 border-slate-200 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LADO IZQUIERDO: DETALLE DE LIQUIDACIÓN FISCAL (TICKET ORDENADO) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Detalle de Liquidación Fiscal
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full ${
                    formaPago === 'CASHEA'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : formaPago === 'PAGO_MOVIL'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : formaPago === 'EFECTIVO'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {formaPago === 'CASHEA' ? 'Cashea (3 Cuotas)' : formaPago === 'PAGO_MOVIL' ? 'Factura Fiscal SENIAT' : formaPago === 'EFECTIVO' ? 'Nota de Entrega (0% IVA)' : 'Crédito Tienda'}
                  </span>
                </div>

                {/* Filas del desglose */}
                <div className="space-y-2 pt-2 text-xs font-mono">
                  {/* Subtotal neto */}
                  <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span className="font-sans font-medium">Subtotal neto (Base imponible):</span>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white font-black">{formatVES(totals.subtotalBs)}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-sans font-normal">({formatUSD(totals.subtotalUSD)})</span>
                    </div>
                  </div>

                  {/* Recargo Cashea si aplica */}
                  {totals.recargoCasheaUSD > 0 && (
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-purple-500/[0.08] text-purple-600 dark:text-purple-400 -mx-2">
                      <span className="font-sans font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Recargo Financiamiento Cashea (12%):
                      </span>
                      <div className="text-right font-black">
                        <span>+{formatVES(totals.recargoCasheaBs)}</span>
                        <span className="text-purple-400/80 text-[11px] ml-1.5 font-sans font-normal">(+{formatUSD(totals.recargoCasheaUSD)})</span>
                      </div>
                    </div>
                  )}

                  {/* IVA SENIAT */}
                  <div className="flex items-center justify-between py-1">
                    {totals.montoIvaUSD > 0 ? (
                      <>
                        <span className="font-sans font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          I.V.A. SENIAT (16%):
                        </span>
                        <div className="text-right font-black text-blue-600 dark:text-blue-400">
                          <span>+{formatVES(totals.ivaBs)}</span>
                          <span className="text-blue-400/80 text-[11px] ml-1.5 font-sans font-normal">(+{formatUSD(totals.montoIvaUSD)})</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-sans font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          I.V.A. (0%):
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] font-sans">
                          Exento / Nota de Entrega
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasa activa oficial */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <img src="/bcv_logo.svg" alt="BCV" className="w-3.5 h-3.5 object-contain" />
                  Tasa oficial aplicada:
                </span>
                <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                  {formatVES(tasaActivaNum).replace('Bs.', '').trim()} Bs / $
                </strong>
              </div>
            </div>

            {/* LADO DERECHO: TOTAL FINAL A COBRAR Y BOTÓN DE EMISIÓN */}
            <div className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border-2 flex flex-col justify-between shadow-sm transition-all ${
              formaPago === 'CASHEA'
                ? 'bg-purple-500/[0.05] border-purple-500/30 dark:bg-purple-950/20'
                : formaPago === 'PAGO_MOVIL'
                  ? 'bg-blue-500/[0.05] border-blue-500/30 dark:bg-blue-950/20'
                  : formaPago === 'EFECTIVO'
                    ? 'bg-emerald-500/[0.05] border-emerald-500/30 dark:bg-emerald-950/20'
                    : 'bg-amber-500/[0.05] border-amber-500/30 dark:bg-amber-950/20'
            }`}>
              {/* Montos */}
              <div className="space-y-1 text-center sm:text-right">
                <div className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-wider">
                  TOTAL FINAL A COBRAR
                </div>
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none drop-shadow-sm ${
                  formaPago === 'CASHEA'
                    ? 'text-purple-600 dark:text-purple-400'
                    : formaPago === 'PAGO_MOVIL'
                      ? 'text-blue-600 dark:text-blue-400'
                      : formaPago === 'EFECTIVO'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {formatVES(totals.totalBs)}
                </div>
                <div className="text-xs sm:text-sm font-mono flex items-center justify-center sm:justify-end gap-1.5 pt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">Equivalente:</span>
                  <span className="px-2.5 py-0.5 rounded-lg font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {formatUSD(totals.totalUSD)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onImprimir}
                  disabled={!formularioValido || loading}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    formularioValido && !loading
                      ? formaPago === 'EFECTIVO'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/30'
                        : formaPago === 'PAGO_MOVIL'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-950/30'
                          : formaPago === 'CASHEA'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/30'
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/30'
                      : 'bg-slate-200 dark:bg-white/[0.05] text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Printer className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {loading 
                      ? 'Emitiendo Venta...' 
                      : formaPago === 'EFECTIVO'
                        ? 'Emitir Nota de Entrega (Efectivo)'
                        : formaPago === 'PAGO_MOVIL'
                          ? 'Emitir Factura Fiscal SENIAT'
                          : formaPago === 'CASHEA'
                            ? 'Emitir Factura Cashea'
                            : 'Registrar Venta a Crédito'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onLimpiar}
                  className="w-full py-1.5 px-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nueva Venta / Limpiar Carrito</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL ZOOM DE FOTO DE REFERENCIA AUTOZONE */}
      {repuestoParaZoom && (
        <ModalZoomRepuesto
          producto={repuestoParaZoom}
          onClose={() => setRepuestoParaZoom(null)}
          onAgregarCarrito={agregarAlCarrito}
          tasaBCV={tasaBCV}
        />
      )}

    </div>
  );
}

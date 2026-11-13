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
  Eye,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Phone
} from 'lucide-react';
import { formatUSD, formatVES, formatNumber, parseVenezuelanNumber, generarVariantesCedula } from '../lib/formatters';
import { obtenerSublineasParaLinea } from '../lib/clasificacionesRepuestos';
import { obtenerFotoRepuesto } from '../lib/repuestosImagenes';
import { desglosarModelosVehiculo } from '../lib/vehiculosMarcas';
import ModalZoomRepuesto from './ModalZoomRepuesto';

/**
 * Componente Selector Inteligente con Búsqueda Escribible Integrada (Combobox / Autocomplete)
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

  useEffect(() => {
    setTextoFiltro(value || '');
  }, [value]);

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
    onChange(val);
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
            Activo
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

      {abierto && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-white/[0.15] rounded-xl shadow-2xl py-1 text-xs divide-y divide-slate-100 dark:divide-white/[0.04] backdrop-blur-sm animate-in fade-in duration-100">
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
  // ESTADOS DE LA BÚSQUEDA Y FILTROS DE INVENTARIO
  // =========================================================================
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroSublinea, setFiltroSublinea] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
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

  // Sublíneas disponibles dinámicas según la línea seleccionada
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

  // Cargar dinámicamente opciones de líneas, marcas y vehículos
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

  // Tasa numérica activa limpia (con exactamente 2 decimales de precisión)
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

  // Determinar si la búsqueda está activa
  const hayFiltrosActivos = Boolean(
    busquedaTexto.trim().length > 0 || 
    filtroLinea || 
    filtroSublinea || 
    filtroMarca || 
    filtroVehiculo
  );

  const busquedaActiva = Boolean(
    busquedaTexto.trim().length > 0 || 
    filtroLinea || 
    filtroSublinea || 
    filtroMarca || 
    filtroVehiculo
  );

  // Consulta de productos en Supabase (solo se ejecuta cuando el usuario busca o filtra)
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

      if (linea && linea !== '') {
        query = query.ilike('linea', `%${linea}%`);
      }
      if (sublinea && sublinea !== '') {
        const cleanSub = sublinea.replace(/^\d+[-_ ]*/, '').trim();
        query = query.or(`sublinea.ilike.%${sublinea}%,sublinea.ilike.%${cleanSub}%,descripcion.ilike.%${cleanSub}%`);
      }
      if (marca && marca !== '') {
        query = query.or(`marca.ilike.%${marca}%,marca_producto.ilike.%${marca}%`);
      }
      if (vehiculo && vehiculo !== '') {
        query = query.ilike('modelo_vehiculo', `%${vehiculo}%`);
      }
      if (term.length > 0) {
        query = query.or(
          `codigo_corto.ilike.%${term}%,referencia.ilike.%${term}%,descripcion.ilike.%${term}%,marca.ilike.%${term}%,marca_producto.ilike.%${term}%,modelo_vehiculo.ilike.%${term}%,linea.ilike.%${term}%,sublinea.ilike.%${term}%`
        );
      }

      query = query.order('codigo_corto', { ascending: true }).limit(50);

      const { data, error: errQuery } = await query;
      if (errQuery) throw errQuery;

      setProductosEncontrados(data || []);
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Cargar productos reactivamente al escribir o cambiar filtros
  useEffect(() => {
    if (!busquedaActiva && !mostrarFiltrosAvanzados) {
      setProductosEncontrados([]);
      return;
    }
    const timer = setTimeout(() => {
      buscarProductos(busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo);
    }, 150);
    return () => clearTimeout(timer);
  }, [busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo, busquedaActiva, mostrarFiltrosAvanzados]);

  // Limpiar todos los filtros y repliegue de búsqueda
  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroLinea('');
    setFiltroSublinea('');
    setFiltroMarca('');
    setFiltroVehiculo('');
    setMostrarFiltrosAvanzados(false);
    setProductosEncontrados([]);
    if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
  };

  // Cálculo reactivo de precios
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

  // Agregar renglón manual para servicios o repuestos personalizados
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
      if (field === 'descripcion') {
        it.descripcion = value;
      } else if (field === 'precio_divisa' || field === 'precio') {
        const numVal = parseVenezuelanNumber(value);
        it.precio_divisa = value;
        it.precio = value;
        it.precio_bs = numVal > 0 ? (numVal * tasaActivaNum).toFixed(2) : '';
        it.subtotal_usd = (it.cantidad || 1) * (numVal > 0 ? numVal : 0);
        it.subtotal_bs = it.subtotal_usd * tasaActivaNum;
        it.subtotal_cashea = it.subtotal_usd * 1.12 * 1.16;
      } else if (field === 'cantidad') {
        const cant = parseInt(value) || 1;
        it.cantidad = Math.max(1, cant);
        const pUSD = parseFloat(it.precio_divisa || it.precio) || 0;
        it.subtotal_usd = it.cantidad * pUSD;
        it.subtotal_bs = it.subtotal_usd * tasaActivaNum;
        it.subtotal_cashea = it.subtotal_usd * 1.12 * 1.16;
      }
      next[index] = it;
      return next;
    });
  };

  const modificarCantidad = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const nuevaCantidad = Math.max(1, (item.cantidad || 1) + delta);
      item.cantidad = nuevaCantidad;
      item.subtotal_usd = nuevaCantidad * (item.precio_divisa || item.precio || 0);
      item.subtotal_bs = nuevaCantidad * (item.precio_bs || 0);
      item.subtotal_cashea = nuevaCantidad * (item.precio_cashea || 0);
      next[index] = item;
      return next;
    });
  };

  const eliminarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Modalidades de cierre
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

  // Autocompletado inteligente de Cédula/RIF
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

        // 1. Buscar en tabla clientes
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

        // 2. Buscar en guias_despacho anteriores
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

  // Validación de formulario para habilitar emisión
  const esCreditoTienda = formaPago === 'CREDITO_TIENDA';
  const clienteValidoParaCredito = !esCreditoTienda || Boolean(cliente.id || clienteEncontrado?.id);
  const formularioValido =
    cliente.nombre?.trim().length > 0 &&
    cliente.documento?.trim().length > 0 &&
    clienteValidoParaCredito &&
    items.length > 0;

  const totalItemsEnCarrito = items.reduce((acc, it) => acc + (it.cantidad || 1), 0);

  return (
    <div className="space-y-4 sm:space-y-5 font-sans text-slate-900 dark:text-slate-100 pb-16">

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs sm:text-sm flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: CONTROL DE TASA OFICIAL BCV + NÚMERO DE FACTURA           */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* TASA DE CAMBIO EDITABLE (EXACTAMENTE 2 DECIMALES) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-1 flex items-center justify-center flex-shrink-0">
            <img src="/bcv_logo.svg" alt="BCV" className="w-full h-full object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tasa de Cambio:
            </span>

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
                title="Tasa editable con 2 decimales oficiales BCV"
              />
              <span className="text-xs font-mono font-bold text-slate-500 ml-1.5">Bs. / $</span>
            </div>

            {onActualizarBCV && (
              <button
                type="button"
                onClick={onActualizarBCV}
                disabled={cargandoBCV}
                title="Actualizar tasa oficial BCV del día"
                className="p-2 text-slate-400 hover:text-emerald-500 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${cargandoBCV ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
            · Editable manualmente (2 decimales)
          </span>
        </div>

        {/* NÚMERO CORRELATIVO DE VENTA */}
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
                className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
                title="Restablecer al correlativo automático"
              >
                Auto
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. DATOS DEL CLIENTE / RECEPTOR                                           */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-4">
        
        {/* Encabezado del Cliente y Estado */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-600" />
              <span>Datos del Cliente / Receptor</span>
            </span>

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

          {/* Menú de Clientes Registrados */}
          <div ref={clientSelectorRef} className="relative self-start sm:self-auto">
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

        {/* Campos del cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Cédula/RIF */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Cédula / RIF *
            </label>
            <div className="flex gap-1">
              <div className="flex bg-slate-100 dark:bg-[#06080F] rounded-lg p-0.5 border border-slate-300 dark:border-white/10">
                {['V', 'J', 'E', 'G'].map((tipo) => {
                  const activo = (cliente.documento || '').startsWith(`${tipo}-`);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => seleccionarPrefijo(tipo)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black cursor-pointer transition-colors ${
                        activo ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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

          {/* Nombre o Razón Social */}
          <div className="lg:col-span-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Nombre o Razón Social *
            </label>
            <input
              type="text"
              value={cliente.nombre || ''}
              onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Taller Los Andes C.A. o Juan Pérez"
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
              placeholder="0414-1234567"
              className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Dirección de Despacho / Entrega (opcional)
            </label>
            <input
              type="text"
              value={cliente.direccion || ''}
              onChange={(e) => setCliente(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Ej. Av. Principal, Local 4, Charallave"
              className="w-full h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RENGLONES DE LA FACTURA / CARRITO DE VENTAS                            */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-4">
        
        {/* Cabecera del Carrito */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Renglones de la Factura ({totalItemsEnCarrito} {totalItemsEnCarrito === 1 ? 'repuesto' : 'repuestos'})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Escribe en el buscador para consultar inventario o agrega renglones manuales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={agregarItemManual}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Agregar un renglón manual para escribir un repuesto o servicio personalizado"
            >
              <Plus className="w-3.5 h-3.5 text-red-500" />
              <span>+ Renglón Manual</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={onLimpiar}
                className="px-3 py-1.5 text-xs font-mono font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                title="Vaciar todos los productos del carrito"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Carrito</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA RÁPIDA DE INVENTARIO */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="🔍 Escribe código corto, OEM, repuesto, marca o vehículo (ej: Corolla, Pastilla, 05143)..."
              className="w-full h-11 pl-10 pr-9 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 focus:border-red-600 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 transition-all uppercase"
            />
            {busquedaTexto && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvanzados(prev => !prev)}
            className={`px-3 h-11 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              mostrarFiltrosAvanzados || filtroLinea || filtroMarca || filtroVehiculo
                ? 'bg-red-500/10 text-red-600 border-red-500/30'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Mostrar u ocultar filtros por Línea, Sub-línea, Marca y Vehículo"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PANEL DESGLOSABLE DE BÚSQUEDA: SOLO SE MUESTRA SI ESTÁ BUSCANDO           */}
        {/* ========================================================================= */}
        {(busquedaActiva || mostrarFiltrosAvanzados) && (
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#06080F]/90 border-2 border-red-500/30 space-y-3 animate-in fade-in duration-200">
            
            {/* Filtros avanzados si están desplegados */}
            {mostrarFiltrosAvanzados && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pb-2 border-b border-slate-200 dark:border-white/[0.08]">
                <SearchableFilterSelect
                  label="1. Línea / Sistema:"
                  icon={Layers}
                  placeholder="Línea..."
                  allLabel="Todas las Líneas"
                  value={filtroLinea}
                  onChange={(val) => {
                    setFiltroLinea(val);
                    setFiltroSublinea('');
                  }}
                  options={listaLineas}
                />
                <SearchableFilterSelect
                  label="2. Tipo de Pieza:"
                  icon={Tag}
                  placeholder="Sub-línea..."
                  allLabel="Todos los Tipos"
                  value={filtroSublinea}
                  onChange={(val) => setFiltroSublinea(val)}
                  options={sublineasDisponibles}
                />
                <SearchableFilterSelect
                  label="3. Marca:"
                  icon={Sparkles}
                  placeholder="Marca..."
                  allLabel="Todas las Marcas"
                  value={filtroMarca}
                  onChange={(val) => setFiltroMarca(val)}
                  options={listaMarcas}
                />
                <SearchableFilterSelect
                  label="4. Vehículo:"
                  icon={Car}
                  placeholder="Vehículo..."
                  allLabel="Todos los Vehículos"
                  value={filtroVehiculo}
                  onChange={(val) => setFiltroVehiculo(val)}
                  options={listaVehiculos}
                />
              </div>
            )}

            {/* Cabecera de resultados */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>{cargandoProductos ? 'Buscando en inventario...' : `${productosEncontrados.length} repuestos encontrados`}</span>
              </span>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-red-600 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-lg hover:border-red-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Cerrar resultados de búsqueda"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar búsqueda</span>
              </button>
            </div>

            {/* Tabla de resultados desglosados con scroll suave */}
            <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19] shadow-inner">
              
              {/* Vista Desktop */}
              <table className="hidden md:table w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-[#06080F] border-b border-slate-200 dark:border-white/[0.08] text-[10px] font-mono font-black text-slate-500 uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-center w-12">FOTO</th>
                    <th className="px-2.5 py-2 w-28">CÓDIGO / OEM</th>
                    <th className="px-3 py-2">REPUESTO / COMPATIBILIDAD</th>
                    <th className="px-2 py-2 text-center w-20">STOCK</th>
                    <th className="px-2.5 py-2 text-right w-24 text-emerald-600 dark:text-emerald-400">DIVISA ($)</th>
                    <th className="px-2.5 py-2 text-right w-28 text-blue-600 dark:text-blue-400">P. MÓVIL (BS)</th>
                    <th className="px-2.5 py-2 text-right w-24 text-purple-600 dark:text-purple-400">CASHEA ($)</th>
                    <th className="px-2.5 py-2 text-center w-24">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {productosEncontrados.length > 0 ? (
                    productosEncontrados.map((prod) => {
                      const precios = calcularPrecios(prod);
                      const agotado = (prod.stock ?? 0) <= 0;
                      const esUltimoAgregado = ultimoAgregadoId === prod.id;
                      const fotoProd = obtenerFotoRepuesto(prod);

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => setRepuestoParaZoom(prod)}
                              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-black/30 inline-flex items-center justify-center cursor-pointer hover:border-red-500 transition-colors"
                              title="Ver foto del repuesto"
                            >
                              <img src={fotoProd} alt={prod.descripcion} className="w-full h-full object-contain" />
                            </button>
                          </td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span className="font-mono font-black text-xs text-red-600 dark:text-red-400">
                              {prod.codigo_corto}
                            </span>
                            {prod.referencia && prod.referencia !== '—' && (
                              <div className="text-[10px] font-mono text-slate-400">
                                OEM: {prod.referencia}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {prod.linea && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  {prod.linea}
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                {prod.marca_producto || prod.marca || 'ATS'}
                              </span>
                              {(prod.modelo_vehiculo || prod.vehiculo) && (
                                <span className="text-[10px] text-slate-500">
                                  • {prod.modelo_vehiculo || prod.vehiculo}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-xs uppercase text-slate-900 dark:text-white leading-tight">
                              {prod.descripcion}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center whitespace-nowrap">
                            {agotado ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                0
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                {prod.stock}
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {formatUSD(precios.pDivisa)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {formatVES(precios.pBs)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                            {formatUSD(precios.pCashea)}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => agregarAlCarrito(prod)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                esUltimoAgregado
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : agotado
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'btn-gradient-red text-white shadow-xs'
                              }`}
                            >
                              {esUltimoAgregado ? '¡Listo!' : agotado ? '+ Cotizar' : '+ Agregar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-400">
                        {cargandoProductos ? 'Consultando repuestos...' : `No se encontraron repuestos con "${busquedaTexto}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Vista Móvil */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06] p-2 space-y-2">
                {productosEncontrados.map((prod) => {
                  const precios = calcularPrecios(prod);
                  const agotado = (prod.stock ?? 0) <= 0;
                  const esUltimoAgregado = ultimoAgregadoId === prod.id;
                  const fotoProd = obtenerFotoRepuesto(prod);

                  return (
                    <div key={prod.id} className="p-2.5 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl space-y-2">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setRepuestoParaZoom(prod)}
                          className="w-12 h-12 rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-white shrink-0"
                        >
                          <img src={fotoProd} alt={prod.descripcion} className="w-full h-full object-contain" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs text-red-600">{prod.codigo_corto}</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">{prod.marca_producto || prod.marca}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${agotado ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                              Stock: {prod.stock ?? 0}
                            </span>
                          </div>
                          <div className="font-bold text-xs uppercase text-slate-900 dark:text-white mt-0.5 leading-snug">
                            {prod.descripcion}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                        <div className="font-mono text-xs">
                          <span className="font-black text-emerald-600">{formatUSD(precios.pDivisa)}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({formatVES(precios.pBs)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => agregarAlCarrito(prod)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            esUltimoAgregado ? 'bg-emerald-500 text-white' : 'btn-gradient-red text-white'
                          }`}
                        >
                          {esUltimoAgregado ? '¡Listo!' : '+ Agregar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* TABLA PRINCIPAL DEL CARRITO / RENGLONES FACTURADOS */}
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl space-y-2 bg-slate-50/50 dark:bg-white/[0.01]">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">El carrito de facturación está listo</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Escribe en el buscador para consultar y agregar repuestos del inventario, o presiona <strong>+ Renglón Manual</strong> para ingresar un concepto personalizado.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#06080F]/95">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              
              {/* Tabla Desktop del Carrito */}
              <table className="hidden md:table w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-white/[0.1] font-mono font-black text-slate-600 dark:text-slate-300 sticky top-0 z-10 select-none">
                  <tr>
                    <th className="px-3 py-2 w-28">CÓDIGO</th>
                    <th className="px-3 py-2 min-w-[200px]">DESCRIPCIÓN</th>
                    <th className="px-2.5 py-2 text-right w-28">PRECIO ($)</th>
                    <th className="px-2 py-2 text-center w-28">CANTIDAD</th>
                    <th className="px-2.5 py-2 text-right text-emerald-600 dark:text-emerald-400 w-28">SUBTOTAL ($)</th>
                    <th className="px-2.5 py-2 text-right text-blue-600 dark:text-blue-400 w-32">SUBTOTAL (BS)</th>
                    <th className="px-2 py-2 text-center w-12">QUITAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {items.map((item, index) => {
                    const pDivisa = item.precio_divisa !== undefined && item.precio_divisa !== '' ? parseFloat(item.precio_divisa) : (parseFloat(item.precio) || 0);
                    const qty = item.cantidad || 1;
                    const aplicaIva = item.aplica_iva !== false;
                    const esManual = item.codigo_corto === 'MANUAL';

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
                    }

                    return (
                      <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="px-3 py-2 whitespace-nowrap font-mono font-bold text-red-600 dark:text-red-400">
                          {item.codigo_corto}
                        </td>
                        <td className="px-3 py-2">
                          {esManual ? (
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) => handleItemManualChange(index, 'descripcion', e.target.value)}
                              placeholder="Escribe la descripción del repuesto o servicio..."
                              className="w-full h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-lg text-xs font-semibold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                            />
                          ) : (
                            <div className="font-bold uppercase text-slate-900 dark:text-white leading-tight">
                              {item.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="px-2.5 py-2 text-right">
                          {esManual ? (
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={item.precio_divisa || ''}
                                onChange={(e) => handleItemManualChange(index, 'precio_divisa', e.target.value)}
                                placeholder="0.00"
                                className="w-24 h-8 px-2 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                              />
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatUSD(precioUnitarioUSD)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center bg-slate-100 dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => modificarCantidad(index, -1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                              {item.cantidad || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => modificarCantidad(index, 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Eliminar renglón"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Vista Móvil del Carrito */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.08] p-2 space-y-2.5">
                {items.map((item, index) => {
                  const pDivisa = item.precio_divisa !== undefined && item.precio_divisa !== '' ? parseFloat(item.precio_divisa) : (parseFloat(item.precio) || 0);
                  const qty = item.cantidad || 1;
                  const aplicaIva = item.aplica_iva !== false;
                  const esManual = item.codigo_corto === 'MANUAL';

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
                  }

                  return (
                    <div
                      key={item.id || index}
                      className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono font-black text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md">
                            {item.codigo_corto}
                          </span>
                          {esManual ? (
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) => handleItemManualChange(index, 'descripcion', e.target.value)}
                              placeholder="Descripción del repuesto..."
                              className="w-full h-8 px-2 mt-1 bg-white dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-lg text-xs font-semibold uppercase"
                            />
                          ) : (
                            <div className="font-bold uppercase text-xs text-slate-900 dark:text-white mt-1 leading-snug">
                              {item.descripcion}
                            </div>
                          )}
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            P. Unit: {formatUSD(precioUnitarioUSD)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.06] gap-2">
                        <div className="inline-flex items-center bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-white/10 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => modificarCantidad(index, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                            {item.cantidad || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => modificarCantidad(index, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-black text-sm text-emerald-600">
                            {formatUSD(subTotalUSD)}
                          </div>
                          <div className="font-mono font-bold text-[11px] text-blue-600">
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
      {/* 3. MODALIDAD DE PAGO Y LIQUIDACIÓN                                        */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-4">
        
        {/* PASO 1: SELECCIONA LA MODALIDAD DE PAGO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">1</span>
              <span>Modalidad de Pago:</span>
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
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 hover:bg-emerald-50/30'
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
            </button>

            {/* PAGO MÓVIL / PUNTO */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('PAGO_MOVIL')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'PAGO_MOVIL'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400 shadow-lg scale-[1.02] ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-blue-500/50 hover:bg-blue-50/30'
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
            </button>

            {/* CASHEA */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('CASHEA')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'CASHEA'
                  ? 'bg-gradient-to-br from-purple-600 to-violet-800 text-white border-purple-400 shadow-lg scale-[1.02] ring-2 ring-purple-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-purple-500/50 hover:bg-purple-50/30'
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
            </button>

            {/* CRÉDITO TIENDA */}
            <button
              type="button"
              onClick={() => seleccionarModalidadCierre('CREDITO_TIENDA')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                formaPago === 'CREDITO_TIENDA'
                  ? 'bg-gradient-to-br from-amber-600 to-yellow-700 text-white border-amber-400 shadow-lg scale-[1.02] ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-[#06080F] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 hover:bg-amber-50/30'
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
            </button>
          </div>
        </div>

        {/* PASO 2: TICKET DE LIQUIDACIÓN FISCAL & TOTALES A PAGAR Y EMISIÓN */}
        <div className="rounded-2xl bg-slate-50/90 dark:bg-[#06080F] border-2 border-slate-200 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LADO IZQUIERDO: DETALLE DE LIQUIDACIÓN FISCAL */}
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

              {/* Tasa activa oficial aplicada */}
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

              {/* Botones de Emisión */}
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

      {/* MODAL ZOOM DE FOTO DE REFERENCIA */}
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

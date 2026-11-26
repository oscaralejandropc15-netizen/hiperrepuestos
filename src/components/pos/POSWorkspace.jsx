import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  getCatalogoCached,
  getCachedCatalogoSync,
  buscarClientesCached,
  PRODUCTOS_LIST_COLUMNS,
} from '../../lib/queryCache';
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
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Package,
  Car,
  Tag,
  SlidersHorizontal,
  Phone,
  MapPin,
  ArrowRight,
  Printer,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import {
  formatUSD,
  formatVES,
  parseVenezuelanNumber,
  generarVariantesCedula,
} from '../../lib/formatters';
import { obtenerFotoRepuesto } from '../../lib/repuestosImagenes';
import { desglosarModelosVehiculo } from '../../lib/vehiculosMarcas';
import ModalZoomRepuesto from '../ModalZoomRepuesto';
import SearchableCombobox from '../admin/SearchableCombobox';

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
  observaciones = '',
  setObservaciones,
  numeroFacturaManual = '',
  setNumeroFacturaManual,
  proximoCorrelativo = '000001',
  totals,
  onGuardar,
  onImprimir,
  onLimpiar,
  loading,
  error,
  setError,
}) {
  const [sugerenciasCedula, setSugerenciasCedula] = useState([]);
  const [mostrarSugerenciasCedula, setMostrarSugerenciasCedula] = useState(false);
  const [sugerenciasNombre, setSugerenciasNombre] = useState([]);
  const [mostrarSugerenciasNombre, setMostrarSugerenciasNombre] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [mostrarExtraCliente, setMostrarExtraCliente] = useState(false);
  const [mostrarOpcionesDoc, setMostrarOpcionesDoc] = useState(false);

  const cedulaContainerRef = useRef(null);
  const nombreContainerRef = useRef(null);
  const inputBusquedaRef = useRef(null);

  // Catálogo y filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroSublinea, setFiltroSublinea] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [repuestoParaZoom, setRepuestoParaZoom] = useState(null);

  const cachedInit = getCachedCatalogoSync();
  const [catalogoCompleto, setCatalogoCompleto] = useState(() => cachedInit?.items || []);
  const [catalogoTruncado, setCatalogoTruncado] = useState(() => Boolean(cachedInit?.isTruncated));
  const [productosRemotos, setProductosRemotos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(!cachedInit);
  const [ultimoAgregadoId, setUltimoAgregadoId] = useState(null);

  const tasaActivaNum = useMemo(() => {
    const parsed = parseVenezuelanNumber(tasaBCV);
    return parsed > 0 ? parsed : 1;
  }, [tasaBCV]);

  // Carga única compartida de productos (mínimo consumo de Egress en Supabase Free Tier)
  const cargarCatalogoPOS = async (force = false) => {
    if (force || catalogoCompleto.length === 0) setCargandoProductos(true);
    try {
      const res = await getCatalogoCached({ force });
      setCatalogoCompleto(res.items || []);
      setCatalogoTruncado(Boolean(res.isTruncated));
    } catch (e) {
      console.warn('Error cargando catálogo en POS:', e);
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    cargarCatalogoPOS(false);
  }, []);

  const listaLineas = useMemo(() => {
    const lins = Array.from(new Set(catalogoCompleto.map((d) => d.linea).filter(Boolean)))
      .filter((l) => l.toLowerCase() !== 'tren delantero')
      .sort();
    return lins.length > 0
      ? lins
      : [
        'Tren Delantero y Dirección',
        'Suspensión',
        'Motor',
        'Frenos',
        'Eléctrico y Encendido',
        'Tracción y Transmisión',
        'Refrigeración',
        'General',
      ];
  }, [catalogoCompleto]);

  const sublineasDisponibles = useMemo(() => {
    let prods = catalogoCompleto;
    if (filtroLinea) {
      prods = prods.filter((p) => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    return Array.from(new Set(prods.map((d) => d.sublinea).filter(Boolean))).sort();
  }, [filtroLinea, catalogoCompleto]);

  const marcasDisponibles = useMemo(() => {
    let prods = catalogoCompleto;
    if (filtroLinea) {
      prods = prods.filter((p) => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    if (filtroSublinea) {
      prods = prods.filter((p) => p.sublinea && p.sublinea.toLowerCase().includes(filtroSublinea.toLowerCase()));
    }
    return Array.from(
      new Set(prods.map((d) => (d.marca_producto || d.marca || '').trim().toUpperCase()).filter(Boolean))
    ).sort();
  }, [filtroLinea, filtroSublinea, catalogoCompleto]);

  const vehiculosDisponibles = useMemo(() => {
    let prods = catalogoCompleto;
    if (filtroLinea) {
      prods = prods.filter((p) => p.linea && p.linea.toLowerCase().includes(filtroLinea.toLowerCase()));
    }
    if (filtroSublinea) {
      prods = prods.filter((p) => p.sublinea && p.sublinea.toLowerCase().includes(filtroSublinea.toLowerCase()));
    }
    if (filtroMarca) {
      prods = prods.filter((p) =>
        (p.marca_producto || p.marca || '').toUpperCase().includes(filtroMarca.toUpperCase())
      );
    }
    return Array.from(new Set(prods.flatMap((d) => desglosarModelosVehiculo(d.modelo_vehiculo)))).sort();
  }, [filtroLinea, filtroSublinea, filtroMarca, catalogoCompleto]);

  const hayFiltrosActivos = Boolean(
    busquedaTexto.trim().length > 0 || filtroLinea || filtroSublinea || filtroMarca || filtroVehiculo
  );

  // Filtrado instantáneo en memoria (0 consultas Supabase; solo devuelve resultados cuando hay búsqueda o filtro activo)
  const productosFiltradosLocal = useMemo(() => {
    const term = busquedaTexto.trim().toLowerCase();
    const lin = filtroLinea.trim().toLowerCase();
    const sub = filtroSublinea.trim().toLowerCase();
    const cleanSub = sub.replace(/^\d+[-_ ]*/, '').trim();
    const mar = filtroMarca.trim().toLowerCase();
    const veh = filtroVehiculo.trim().toLowerCase();

    if (!term && !lin && !sub && !mar && !veh) {
      return [];
    }

    const coincidencias = catalogoCompleto.filter((p) => {
      if (lin && !(p.linea || '').toLowerCase().includes(lin)) return false;
      if (sub) {
        const pSub = (p.sublinea || '').toLowerCase();
        const pDesc = (p.descripcion || '').toLowerCase();
        if (!pSub.includes(sub) && !pSub.includes(cleanSub) && !pDesc.includes(cleanSub)) return false;
      }
      if (mar) {
        const pMarca = `${p.marca_producto || ''} ${p.marca || ''}`.toLowerCase();
        if (!pMarca.includes(mar)) return false;
      }
      if (veh && !(p.modelo_vehiculo || '').toLowerCase().includes(veh)) return false;

      if (term) {
        const blob = `${p.codigo_corto || ''} ${p.referencia || ''} ${p.descripcion || ''} ${
          p.marca || ''
        } ${p.marca_producto || ''} ${p.modelo_vehiculo || ''} ${p.linea || ''} ${
          p.sublinea || ''
        }`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });

    return coincidencias
      .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0) || String(a.codigo_corto || '').localeCompare(String(b.codigo_corto || '')))
      .slice(0, 48);
  }, [catalogoCompleto, busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo]);

  // Fallback remoto solo si el catálogo excede 1000 repuestos en el futuro
  useEffect(() => {
    if (!catalogoTruncado || !hayFiltrosActivos) {
      setProductosRemotos([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCargandoProductos(true);
      try {
        const term = busquedaTexto.trim();
        let query = supabase.from('productos').select(PRODUCTOS_LIST_COLUMNS);

        if (filtroLinea) query = query.ilike('linea', `%${filtroLinea}%`);
        if (filtroSublinea) {
          const cleanSub = filtroSublinea.replace(/^\d+[-_ ]*/, '').trim();
          query = query.or(
            `sublinea.ilike.%${filtroSublinea}%,sublinea.ilike.%${cleanSub}%,descripcion.ilike.%${cleanSub}%`
          );
        }
        if (filtroMarca) query = query.or(`marca.ilike.%${filtroMarca}%,marca_producto.ilike.%${filtroMarca}%`);
        if (filtroVehiculo) query = query.ilike('modelo_vehiculo', `%${filtroVehiculo}%`);
        if (term.length > 0) {
          query = query.or(
            `codigo_corto.ilike.%${term}%,referencia.ilike.%${term}%,descripcion.ilike.%${term}%,marca.ilike.%${term}%,marca_producto.ilike.%${term}%,modelo_vehiculo.ilike.%${term}%,linea.ilike.%${term}%,sublinea.ilike.%${term}%`
          );
        }

        const { data } = await query.order('codigo_corto', { ascending: true }).limit(48);
        setProductosRemotos(data || []);
      } catch (err) {
        console.error('Error buscando productos:', err);
      } finally {
        setCargandoProductos(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [catalogoTruncado, hayFiltrosActivos, busquedaTexto, filtroLinea, filtroSublinea, filtroMarca, filtroVehiculo]);

  const productosEncontrados =
    catalogoTruncado && hayFiltrosActivos ? productosRemotos : productosFiltradosLocal;

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

  const seleccionarCliente = (c) => {
    const docNormalizado = c.cedula_rif || c.cliente_documento || '';
    setCliente({
      id: c.id || null,
      documento: docNormalizado,
      nombre: c.nombre || c.cliente_nombre || '',
      telefono: c.telefono || c.cliente_telefono || '',
      direccion: c.direccion || c.cliente_direccion || '',
    });
    setClienteEncontrado(c);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  const limpiarDatosCliente = () => {
    setCliente({ id: null, documento: '', nombre: '', telefono: '', direccion: '' });
    setClienteEncontrado(null);
    setSugerenciasCedula([]);
    setSugerenciasNombre([]);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  const setConsumidorFinal = () => {
    setCliente({
      id: null,
      documento: 'V-00000000',
      nombre: 'CLIENTE DE CONTADO',
      telefono: '0414-0000000',
      direccion: 'TIENDA MOSTRADOR',
    });
    setClienteEncontrado(null);
    setSugerenciasCedula([]);
    setSugerenciasNombre([]);
    setMostrarSugerenciasCedula(false);
    setMostrarSugerenciasNombre(false);
  };

  // Búsqueda por cédula (cacheada + debounced)
  useEffect(() => {
    const doc = (cliente.documento || '').trim();
    const soloDigitos = doc.replace(/\D/g, '');

    if (soloDigitos.length < 5 || doc === 'V-00000000') {
      setSugerenciasCedula([]);
      setMostrarSugerenciasCedula(false);
      if (soloDigitos.length === 0) setClienteEncontrado(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const variantes = generarVariantesCedula(doc);
        const { exacto, matches } = await buscarClientesCached('doc', soloDigitos, {
          variantesCedula: variantes,
        });

        if (exacto && exacto.nombre) {
          setClienteEncontrado(exacto);
          setCliente((prev) => ({
            ...prev,
            id: exacto.id,
            documento: exacto.cedula_rif || prev.documento,
            nombre: exacto.nombre,
            telefono: exacto.telefono || prev.telefono || '',
            direccion: exacto.direccion || prev.direccion || '',
          }));
          setSugerenciasCedula([]);
          setMostrarSugerenciasCedula(false);
          return;
        }

        setSugerenciasCedula(matches || []);
        setMostrarSugerenciasCedula((matches || []).length > 0);
      } catch (err) {
        console.warn('Error consultando cliente por cédula:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cliente.documento]);

  // Búsqueda por nombre (cacheada + debounced)
  useEffect(() => {
    const nombreQuery = (cliente.nombre || '').trim();
    if (
      nombreQuery.length < 3 ||
      nombreQuery === 'CLIENTE DE CONTADO' ||
      (clienteEncontrado && clienteEncontrado.nombre === nombreQuery)
    ) {
      setSugerenciasNombre([]);
      setMostrarSugerenciasNombre(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { matches } = await buscarClientesCached('nombre', nombreQuery);
        setSugerenciasNombre(matches || []);
        setMostrarSugerenciasNombre((matches || []).length > 0);
      } catch (err) {
        console.warn('Error consultando cliente por nombre:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cliente.nombre]);

  const docMatch = (cliente.documento || '').match(/^([VJEGP])-(.*)$/i);
  const docPrefijoActual = docMatch ? docMatch[1].toUpperCase() : 'V';
  const docNumeroActual = docMatch ? docMatch[2] : cliente.documento || '';

  const handleDocumentoNumeroChange = (raw, prefijoForzado = docPrefijoActual) => {
    const cleanRaw = raw.toUpperCase().replace(/\s+/g, '');
    // Si pegaron el prefijo completo tipo V-12345678
    const fullMatch = cleanRaw.match(/^([VJEGP])-?(.*)$/);
    const prefix = fullMatch ? fullMatch[1] : prefijoForzado;
    const rest = fullMatch ? fullMatch[2] : cleanRaw;

    let digits = rest.replace(/\D/g, '');
    if (!digits) {
      setCliente((prev) => ({ ...prev, documento: '' }));
      return;
    }

    digits = ['V', 'E'].includes(prefix) ? digits.slice(0, 8) : digits.slice(0, 9);
    const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setCliente((prev) => ({ ...prev, documento: `${prefix}-${withDots}` }));
  };

  const handlePrefijoSelect = (nuevoPrefijo) => {
    if (!docNumeroActual) {
      setCliente((prev) => ({ ...prev, documento: `${nuevoPrefijo}-` }));
    } else {
      handleDocumentoNumeroChange(docNumeroActual, nuevoPrefijo);
    }
  };

  const handleTelefonoChange = (raw) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('58') && digits.length >= 12) digits = '0' + digits.slice(2);
    digits = digits.slice(0, 11);
    const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    setCliente((prev) => ({ ...prev, telefono: formatted }));
  };

  const calcularPrecios = (prod) => {
    const baseUSD = parseFloat(prod.precio_detal_usd) || 0;
    const aplicaIva = prod.aplica_iva !== false;
    const pDivisa = baseUSD;
    const pBs = aplicaIva ? baseUSD * tasaActivaNum * 1.16 : baseUSD * tasaActivaNum;
    const pBsUSD = aplicaIva ? baseUSD * 1.16 : baseUSD;
    const factorCashea = 1.12;
    const factorIva = aplicaIva ? 1.16 : 1.0;
    const pCashea = baseUSD * factorCashea * factorIva;
    const pCasheaBs = pCashea * tasaActivaNum;
    return { pDivisa, pBs, pBsUSD, pCashea, pCasheaBs, aplicaIva };
  };

  const agregarAlCarrito = (prod) => {
    const precios = calcularPrecios(prod);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.producto_id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        const itemActual = next[idx];
        const nuevaCant = (itemActual.cantidad || 1) + 1;
        next[idx] = {
          ...itemActual,
          cantidad: nuevaCant,
          subtotal_usd: nuevaCant * precios.pDivisa,
          subtotal_bs: nuevaCant * precios.pBs,
          subtotal_cashea: nuevaCant * precios.pCashea,
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
        aplica_iva: precios.aplicaIva,
      };
      return [nuevoItem, ...prev];
    });

    setUltimoAgregadoId(prod.id);
    setTimeout(() => setUltimoAgregadoId(null), 1200);
    limpiarBusquedaCatalogo();
    setMostrarFiltrosAvanzados(false);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      inputBusquedaRef.current?.focus();
    }
  };

  const modificarCantidad = (index, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[index] };
      const nueva = Math.max(1, (parseFloat(it.cantidad) || 1) + delta);
      it.cantidad = nueva;
      it.subtotal_usd = nueva * (parseVenezuelanNumber(it.precio_divisa ?? it.precio) || 0);
      it.subtotal_bs = nueva * (parseVenezuelanNumber(it.precio_bs) || 0);
      it.subtotal_cashea = nueva * (parseVenezuelanNumber(it.precio_cashea) || 0);
      next[index] = it;
      return next;
    });
  };

  const eliminarItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarItemManual = () => {
    setItems((prev) => [
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
        aplica_iva: formaPago !== 'EFECTIVO',
      },
      ...prev,
    ]);
  };

  const handleItemManualChange = (index, field, value) => {
    setItems((prev) => {
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

  const limpiarBusquedaCatalogo = () => {
    setBusquedaTexto('');
    setFiltroLinea('');
    setFiltroSublinea('');
    setFiltroMarca('');
    setFiltroVehiculo('');
  };

  const totalItemsEnCarrito = items.reduce((acc, it) => acc + (parseFloat(it.cantidad) || 1), 0);
  const formularioValido =
    (cliente.nombre || '').trim().length > 0 &&
    (cliente.documento || '').trim().length > 0 &&
    items.length > 0;

  const paymentOptions = [
    {
      id: 'PAGO_MOVIL',
      title: 'Pago Móvil / Punto',
      subtitle: 'Factura · Tasa BCV',
      icon: Smartphone,
      activeClass:
        'bg-blue-50 dark:bg-blue-500/15 border-blue-600 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20',
      iconActive: 'bg-blue-600 text-white',
    },
    {
      id: 'EFECTIVO',
      title: 'Efectivo ($)',
      subtitle: 'Nota · Divisa',
      icon: Banknote,
      activeClass:
        'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-600 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20',
      iconActive: 'bg-emerald-600 text-white',
    },
    {
      id: 'CASHEA',
      title: 'Cashea (+12%)',
      subtitle: 'Factura · Cuotas',
      icon: CreditCard,
      activeClass:
        'bg-violet-50 dark:bg-violet-500/15 border-violet-600 text-violet-950 dark:text-violet-100 ring-2 ring-violet-500/20',
      iconActive: 'bg-violet-600 text-white',
    },
    {
      id: 'CREDITO_TIENDA',
      title: 'Crédito Tienda',
      subtitle: 'Nota · Por cobrar',
      icon: Tag,
      activeClass:
        'bg-amber-50 dark:bg-amber-500/15 border-amber-600 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20',
      iconActive: 'bg-amber-600 text-white',
    },
  ];

  const itemsByProductId = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      if (it.producto_id) {
        map.set(it.producto_id, (map.get(it.producto_id) || 0) + (parseFloat(it.cantidad) || 1));
      }
    });
    return map;
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {error && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium leading-snug">{error}</span>
          </div>
          {setError && (
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Cerrar error"
              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-white rounded-lg cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* PASO 1: CLIENTE / RECEPTOR */}
      <section className="surface-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-heading font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Datos del cliente
              </h2>
              {clienteEncontrado && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Registrado
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setConsumidorFinal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Contado rápido</span>
            </button>

            {(cliente.documento || cliente.nombre) && (
              <button
                type="button"
                onClick={limpiarDatosCliente}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          {/* Cédula / RIF con selector compacto */}
          <div ref={cedulaContainerRef} className="sm:col-span-4 relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cédula o RIF <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#090d16] focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/15 overflow-hidden transition-all">
              <select
                aria-label="Tipo de documento"
                value={docPrefijoActual}
                onChange={(e) => handlePrefijoSelect(e.target.value)}
                className="h-10 pl-2.5 pr-1 bg-slate-100 dark:bg-white/[0.06] border-r border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer shrink-0"
              >
                <option value="V">V-</option>
                <option value="J">J-</option>
                <option value="E">E-</option>
                <option value="G">G-</option>
              </select>
              <input
                type="text"
                value={docNumeroActual}
                onChange={(e) => handleDocumentoNumeroChange(e.target.value)}
                onFocus={() => {
                  if (sugerenciasCedula.length > 0) setMostrarSugerenciasCedula(true);
                }}
                placeholder="26.946.393"
                className="w-full h-10 px-3 bg-transparent text-base sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {mostrarSugerenciasCedula && sugerenciasCedula.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl p-1.5 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                {sugerenciasCedula.map((c, i) => (
                  <button
                    key={c.id || i}
                    type="button"
                    onMouseDown={() => seleccionarCliente(c)}
                    className="w-full text-left p-2.5 hover:bg-red-50 dark:hover:bg-white/[0.06] rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-red-600 dark:text-red-400 mr-2 tabular-nums">
                        {c.cedula_rif}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {c.nombre}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">Cargar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nombre o Razón Social */}
          <div ref={nombreContainerRef} className="sm:col-span-8 relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre o razón social <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={cliente.nombre || ''}
              onChange={(e) => {
                setCliente((prev) => ({ ...prev, nombre: e.target.value }));
                if (clienteEncontrado && clienteEncontrado.nombre !== e.target.value) {
                  setClienteEncontrado(null);
                }
              }}
              onFocus={() => {
                if (sugerenciasNombre.length > 0) setMostrarSugerenciasNombre(true);
              }}
              placeholder="Ej. Taller Los Andes C.A. o Juan Pérez"
              className="input-field h-10 px-3.5 font-medium"
            />

            {mostrarSugerenciasNombre && sugerenciasNombre.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl p-1.5 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                {sugerenciasNombre.map((c, i) => (
                  <button
                    key={c.id || i}
                    type="button"
                    onMouseDown={() => seleccionarCliente(c)}
                    className="w-full text-left p-2.5 hover:bg-red-50 dark:hover:bg-white/[0.06] rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {c.nombre}
                      </p>
                      <p className="text-[11px] font-medium text-red-600 dark:text-red-400 tabular-nums">
                        {c.cedula_rif}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">Cargar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setMostrarExtraCliente(!mostrarExtraCliente)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            {mostrarExtraCliente ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              {mostrarExtraCliente
                ? 'Ocultar teléfono y dirección'
                : 'Agregar teléfono o dirección fiscal'}
            </span>
          </button>

          {mostrarExtraCliente && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] animate-fade-in">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={cliente.telefono || ''}
                    onChange={(e) => handleTelefonoChange(e.target.value)}
                    placeholder="0414-1234567"
                    className="input-field h-10 pl-9 pr-3 tabular-nums"
                  />
                </div>
              </div>
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección fiscal / entrega
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cliente.direccion || ''}
                    onChange={(e) =>
                      setCliente((prev) => ({ ...prev, direccion: e.target.value }))
                    }
                    placeholder="Charallave, Edo. Miranda"
                    className="input-field h-10 pl-9 pr-3"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PASO 2: BUSCADOR DE REPUESTOS Y ARTÍCULOS EN VENTA */}
      <section className="surface-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white/15 text-white font-heading font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Repuestos y detalle de venta
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {items.length} {items.length === 1 ? 'renglón' : 'renglones'} · {totalItemsEnCarrito}{' '}
                  {totalItemsEnCarrito === 1 ? 'pieza' : 'piezas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Busca repuestos del inventario para agregarlos o crea un renglón manual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => cargarCatalogoPOS(true)}
              disabled={cargandoProductos}
              title="Sincronizar inventario"
              aria-label="Sincronizar inventario"
              className="min-h-[38px] w-9 inline-flex items-center justify-center btn-secondary text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cargandoProductos ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={agregarItemManual}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 btn-secondary text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Renglón manual</span>
            </button>
          </div>
        </div>

        {/* Buscador y filtros bajo demanda */}
        <div className="space-y-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && hayFiltrosActivos) {
                  limpiarBusquedaCatalogo();
                }
              }}
              placeholder="Buscar código, descripción o vehículo..."
              className="input-field h-11 pl-10 pr-20 sm:pr-28 font-medium"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarBusquedaCatalogo}
                  aria-label="Cerrar búsqueda"
                  title="Cerrar resultados de búsqueda"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${mostrarFiltrosAvanzados || filtroSublinea || filtroMarca || filtroVehiculo
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
          </div>

          {/* Categorías rápidas (solo filtran al hacer clic; no muestran nada por defecto) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">
              Filtrar por línea:
            </span>
            {listaLineas.slice(0, 7).map((linea) => {
              const activa = filtroLinea === linea;
              return (
                <button
                  key={linea}
                  type="button"
                  onClick={() => {
                    setFiltroLinea(activa ? '' : linea);
                    setFiltroSublinea('');
                    setFiltroMarca('');
                    setFiltroVehiculo('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${activa
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#090d16] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                >
                  {linea}
                </button>
              );
            })}
          </div>

          {mostrarFiltrosAvanzados && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3.5 surface-muted animate-fade-in">
              <SearchableCombobox
                label="Línea / Sistema"
                value={filtroLinea}
                onChange={(val) => {
                  setFiltroLinea(val);
                  setFiltroSublinea('');
                  setFiltroMarca('');
                  setFiltroVehiculo('');
                }}
                options={listaLineas}
                emptyOptionLabel="Todas las líneas"
                placeholder="Todas las líneas"
                compact
                hideStatusBadge
              />

              <SearchableCombobox
                label="Sublínea / Pieza"
                value={filtroSublinea}
                onChange={(val) => {
                  setFiltroSublinea(val);
                  setFiltroMarca('');
                  setFiltroVehiculo('');
                }}
                options={sublineasDisponibles}
                emptyOptionLabel="Todas las sublíneas"
                placeholder="Todas las sublíneas"
                compact
                hideStatusBadge
              />

              <SearchableCombobox
                label="Marca del repuesto"
                value={filtroMarca}
                onChange={(val) => {
                  setFiltroMarca(val);
                  setFiltroVehiculo('');
                }}
                options={marcasDisponibles}
                emptyOptionLabel="Todas las marcas"
                placeholder="Todas las marcas"
                compact
                hideStatusBadge
              />

              <SearchableCombobox
                label="Modelo del vehículo"
                value={filtroVehiculo}
                onChange={setFiltroVehiculo}
                options={vehiculosDisponibles}
                emptyOptionLabel="Todos los modelos"
                placeholder="Todos los modelos"
                compact
                hideStatusBadge
              />
            </div>
          )}

          {/* Panel de resultados: SOLO visible cuando el usuario busca o aplica algún filtro */}
          {hayFiltrosActivos && (
            <div className="p-3.5 rounded-2xl bg-slate-50/95 dark:bg-[#090d16] border border-red-200/80 dark:border-red-500/25 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {cargandoProductos
                    ? 'Buscando repuestos...'
                    : `${productosEncontrados.length} repuesto${productosEncontrados.length === 1 ? '' : 's'} encontrado${productosEncontrados.length === 1 ? '' : 's'}`}
                </span>
                <button
                  type="button"
                  onClick={limpiarBusquedaCatalogo}
                  className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cerrar resultados</span>
                </button>
              </div>

              {cargandoProductos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-24 rounded-xl bg-white dark:bg-white/[0.04] animate-pulse"
                    />
                  ))}
                </div>
              ) : productosEncontrados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {productosEncontrados.map((prod) => {
                    const precios = calcularPrecios(prod);
                    const sinStock = (prod.stock ?? 0) <= 0;
                    const agregadoReciente = ultimoAgregadoId === prod.id;
                    const cantEnCarrito = itemsByProductId.get(prod.id) || 0;
                    const fotoUrl = obtenerFotoRepuesto(prod);

                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-2.5 ${agregadoReciente
                          ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-white dark:bg-[#0e1422] border-slate-200 dark:border-white/[0.08] hover:border-red-300 dark:hover:border-white/20'
                          }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => setRepuestoParaZoom(prod)}
                            className="group relative w-11 h-11 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-white/10 shrink-0 overflow-hidden flex items-center justify-center p-1 cursor-pointer"
                            title="Ampliar foto del repuesto"
                          >
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={prod.descripcion}
                                loading="lazy"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </span>
                          </button>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-[11px] tabular-nums text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-2 py-0.5 rounded-md truncate">
                                {prod.codigo_corto || 'S/C'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {cantEnCarrito > 0 && (
                                  <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                    En lista: {cantEnCarrito}
                                  </span>
                                )}
                                <span
                                  className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full ${sinStock
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    }`}
                                >
                                  Stock: {prod.stock ?? 0}
                                </span>
                              </div>
                            </div>

                            <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {prod.descripcion}
                            </h3>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {(prod.marca_producto || prod.marca) && (
                                <span className="font-semibold uppercase truncate">
                                  {prod.marca_producto || prod.marca}
                                </span>
                              )}
                              {prod.modelo_vehiculo && (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Car className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{prod.modelo_vehiculo}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                          <div className="tabular-nums flex items-baseline gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatUSD(precios.pDivisa)}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatVES(precios.pBs)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => agregarAlCarrito(prod)}
                            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${agregadoReciente
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                              }`}
                          >
                            {agregadoReciente ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Agregado</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center px-4 space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No se encontraron repuestos con esa búsqueda
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prueba con otro término o usa «Renglón manual».
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de renglones en la venta */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((it, idx) => {
                const esManual = it.codigo_corto === 'MANUAL';
                const esRecienAgregado = Boolean(it.producto_id && ultimoAgregadoId === it.producto_id);
                return (
                  <div
                    key={it.id || idx}
                    className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      esRecienAgregado
                        ? 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-50/90 dark:bg-[#090d16] border-slate-200/90 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold tabular-nums">
                          #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 font-bold text-[11px] tabular-nums">
                          {it.codigo_corto}
                        </span>
                        {it.marca && !esManual && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase truncate">
                            · {it.marca}
                          </span>
                        )}
                      </div>

                      {esManual ? (
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) =>
                            handleItemManualChange(idx, 'descripcion', e.target.value)
                          }
                          placeholder="Descripción del producto o servicio..."
                          className="input-field h-9 px-3 text-xs font-medium"
                        />
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                          {it.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 dark:border-white/[0.06]">
                      <div className="inline-flex items-center bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/10 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => modificarCantidad(idx, -1)}
                          aria-label="Disminuir cantidad"
                          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                          {it.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => modificarCantidad(idx, 1)}
                          aria-label="Aumentar cantidad"
                          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {esManual ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              $
                            </span>
                            <input
                              type="text"
                              value={it.precio_divisa || ''}
                              onChange={(e) =>
                                handleItemManualChange(idx, 'precio_divisa', e.target.value)
                              }
                              placeholder="0.00"
                              className="input-field h-9 pl-6 pr-2 text-right font-bold tabular-nums text-xs"
                            />
                          </div>
                          <div className="text-right font-bold tabular-nums text-xs text-slate-900 dark:text-white min-w-[68px]">
                            {formatUSD(it.subtotal_usd || 0)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right tabular-nums min-w-[100px]">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatUSD(it.subtotal_usd || 0)}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatVES(it.subtotal_bs || 0)}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => eliminarItem(idx)}
                        aria-label="Eliminar renglón"
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 px-4 rounded-xl border border-dashed border-slate-300 dark:border-white/15 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
              <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aún no hay repuestos en esta venta. Busca arriba por código o descripción para agregarlos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* PASO 3: PAGO Y CIERRE */}
      <section id="pos-checkout" className="surface-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-heading font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Cobro y emisión
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/15 text-xs font-bold tabular-nums text-red-700 dark:text-red-300">
                #{numeroFacturaManual || proximoCorrelativo}
              </span>
            </div>
          </div>

          {(items.length > 0 || cliente.nombre) && (
            <button
              type="button"
              onClick={onLimpiar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva venta</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Izquierda: tipo de comprobante, modalidad de cobro y notas */}
          <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo de comprobante
                </span>
                <div className="grid grid-cols-2 bg-slate-100 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setTipoDocumento('factura_fiscal')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tipoDocumento === 'factura_fiscal'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Factura Fiscal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDocumento('nota_entrega')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tipoDocumento === 'nota_entrega'
                      ? 'bg-white dark:bg-[#1a2234] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Nota de Entrega
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Modalidad de cobro
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paymentOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = formaPago === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => seleccionarModalidadCierre(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${active
                          ? opt.activeClass
                          : 'bg-slate-50 dark:bg-[#090d16] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active
                            ? opt.iconActive
                            : 'bg-white dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{opt.title}</div>
                          <div className="text-[11px] opacity-80 leading-tight mt-0.5">
                            {opt.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {(setObservaciones || setNumeroFacturaManual) && (
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarOpcionesDoc(!mostrarOpcionesDoc)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {mostrarOpcionesDoc
                      ? 'Ocultar notas y número manual'
                      : 'Agregar notas o número manual'}
                  </span>
                </button>

                {mostrarOpcionesDoc && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 surface-muted animate-fade-in">
                    {setNumeroFacturaManual && (
                      <input
                        type="text"
                        value={numeroFacturaManual}
                        onChange={(e) =>
                          setNumeroFacturaManual(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder={`Nº manual (auto: ${proximoCorrelativo})`}
                        className="input-field h-9 px-3 text-xs tabular-nums"
                      />
                    )}
                    {setObservaciones && (
                      <input
                        type="text"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones (placa, garantía)..."
                        className="input-field h-9 px-3 text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Derecha: Bloque ejecutivo oscuro de totales y emisión */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0f172a] dark:bg-[#090d16] text-white p-4 sm:p-5 border border-slate-800 dark:border-white/10 flex flex-col justify-between gap-4">
            <div className="space-y-2 pb-3 border-b border-white/10 text-xs tabular-nums">
              <div className="flex justify-between text-slate-300">
                <span>{formaPago === 'EFECTIVO' ? 'Subtotal (0% IVA)' : 'Subtotal Neto'}</span>
                <span className="font-semibold text-white">
                  {formaPago === 'PAGO_MOVIL'
                    ? `${formatVES(totals.baseImponibleBs)} / ${formatUSD(totals.baseImponible)}`
                    : `${formatUSD(totals.baseImponible)} / ${formatVES(totals.baseImponibleBs)}`}
                </span>
              </div>

              {formaPago !== 'EFECTIVO' && (
                <div className="flex justify-between text-slate-300">
                  <span>IVA (16%)</span>
                  <span className="font-semibold text-white">
                    {formaPago === 'PAGO_MOVIL'
                      ? `+${formatVES(totals.ivaBs)}`
                      : `+${formatUSD(totals.iva)}`}
                  </span>
                </div>
              )}

              {formaPago === 'CASHEA' && (
                <div className="flex justify-between text-violet-300 font-semibold">
                  <span>Recargo Cashea (12%)</span>
                  <span>+{formatUSD(totals.recargoCasheaUSD)}</span>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  {formaPago === 'PAGO_MOVIL'
                    ? 'Total a cobrar (Bs.)'
                    : formaPago === 'CASHEA'
                      ? 'Total Cashea ($)'
                      : formaPago === 'EFECTIVO'
                        ? 'Total efectivo ($)'
                        : 'Total a cobrar ($)'}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  Tasa BCV: {formatVES(tasaActivaNum)}
                </span>
              </div>

              <div className="text-right tabular-nums">
                {formaPago === 'PAGO_MOVIL' ? (
                  <>
                    <div className="font-heading text-2xl sm:text-3xl font-bold text-sky-400 leading-tight">
                      {formatVES(totals.totalBs)}
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Ref: {formatUSD(totals.totalUSD)}
                    </div>
                  </>
                ) : formaPago === 'CASHEA' ? (
                  <>
                    <div className="font-heading text-2xl sm:text-3xl font-bold text-violet-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                ) : formaPago === 'EFECTIVO' ? (
                  <>
                    <div className="font-heading text-2xl sm:text-3xl font-bold text-emerald-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-heading text-2xl sm:text-3xl font-bold text-amber-400 leading-tight">
                      {formatUSD(totals.totalUSD)}
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      {formatVES(totals.totalBs)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onGuardar}
                disabled={loading || !formularioValido}
                className="min-h-[46px] px-4 btn-gradient-red font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Emitiendo...</span>
                ) : (
                  <>
                    <span>
                      Emitir {tipoDocumento === 'factura_fiscal' ? 'Factura' : 'Nota'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onImprimir}
                disabled={loading || !formularioValido}
                className="min-h-[46px] px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>Emitir y PDF</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-[72px] left-3 z-30">
          <a
            href="#pos-checkout"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 dark:bg-red-600 text-white text-xs font-semibold shadow-xl border border-white/15 tabular-nums"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cobrar ({totalItemsEnCarrito})</span>
            <span className="font-bold">· {formatUSD(totals.totalUSD)}</span>
          </a>
        </div>
      )}

      {repuestoParaZoom && (
        <ModalZoomRepuesto
          producto={repuestoParaZoom}
          tasaBCV={tasaBCV}
          onAgregarCarrito={agregarAlCarrito}
          onClose={() => setRepuestoParaZoom(null)}
        />
      )}
    </div>
  );
}

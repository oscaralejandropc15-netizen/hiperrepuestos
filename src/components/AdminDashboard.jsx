import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getCatalogoCached,
  invalidateCatalogoCache,
  getCuentasCobrarCached,
  invalidateCuentasCobrarCache,
} from '../lib/queryCache';
import {
  Package,
  Truck,
  CreditCard,
  ArrowRight,
  Boxes,
  Layers,
  Tag,
  Car,
  Camera,
  DollarSign,
} from 'lucide-react';
import { parseVenezuelanNumber } from '../lib/formatters';
import { obtenerSublineasParaLinea } from '../lib/clasificacionesRepuestos';
import {
  obtenerMarcaVehiculo,
  desglosarModelosVehiculo,
  contarRepuestosPorModelo,
} from '../lib/vehiculosMarcas';
import ModalZoomRepuesto from './ModalZoomRepuesto';
import ToastNotification from './ui/ToastNotification';
import ConfirmModal from './ui/ConfirmModal';
import InventarioTab from './admin/InventarioTab';
import ClasificacionesTab from './admin/ClasificacionesTab';
import CuentasCobrarTab from './admin/CuentasCobrarTab';
import RepuestoModal from './admin/RepuestoModal';
import AdminModals from './admin/AdminModals';

const ModuloIngresoMercancia = lazy(() => import('./ModuloIngresoMercancia'));

const PASOS_MODAL_REPUESTO = [
  { id: 1, label: 'Clasificación', hint: 'Línea y vehículo', icon: Layers },
  { id: 2, label: 'Identificación', hint: 'Descripción y códigos', icon: Tag },
  { id: 3, label: 'Fotografía', hint: 'Catálogo o archivo', icon: Camera },
  { id: 4, label: 'Precios & Stock', hint: 'Costo, venta y almacén', icon: DollarSign },
];

const LINEAS_BASE = [
  'Tren Delantero y Dirección',
  'Suspensión',
  'Motor',
  'Frenos',
  'Eléctrico y Encendido',
  'Tracción y Transmisión',
  'Refrigeración',
  'Carrocería',
  'Accesorios',
  'General',
];

const MARCAS_BASE = [
  '555',
  'AISIN',
  'ATS',
  'ATS PREMIUM',
  'BOSCH',
  'CHEVROLET GENUINE',
  'DENSO',
  'FORD MOTORCRAFT',
  'GABRIEL',
  'GATES',
  'GENÉRICO',
  'MITSUKI',
  'NGK',
  'TOYOTA GENUINE',
  'VALVOLINE',
  'WAGNER',
];

const MODELOS_BASE = [
  '4Runner',
  'Corolla',
  'Hilux',
  'Yaris',
  'Fortuner',
  'Meru',
  'Prado',
  'Camry',
  'Aveo',
  'Optra',
  'Spark',
  'Silverado',
  'Cruze',
  'Corsa',
  'Blazer',
  'Fiesta',
  'Explorer',
  'EcoSport',
  'F-150',
  'F-250',
  'Accent',
  'Elantra',
  'Getz',
  'Tucson',
  'Santa Fe',
  'Arauca',
  'Orinoco',
  'X1',
  'Tiggo',
  'Lancer',
  'Montero',
  'Signo',
  'Civic',
  'Accord',
  'CR-V',
];

export default function AdminDashboard({ tasaBCV, onVolverAlMostrador }) {
  const [tabActiva, setTabActiva] = useState('inventario');

  // Inventario
  const [productos, setProductos] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTextoDebounced, setFiltroTextoDebounced] = useState('');
  const [filtroLineaInv, setFiltroLineaInv] = useState('');
  const [filtroSublineaInv, setFiltroSublineaInv] = useState('');
  const [filtroMarcaInv, setFiltroMarcaInv] = useState('');
  const [repuestoParaZoom, setRepuestoParaZoom] = useState(null);
  const [repuestoAEliminar, setRepuestoAEliminar] = useState(null);
  const [eliminandoRepuesto, setEliminandoRepuesto] = useState(false);

  // Modal Crear / Editar Repuesto
  const [modalRepuestoAbierto, setModalRepuestoAbierto] = useState(false);
  const [repuestoEditandoId, setRepuestoEditandoId] = useState(null);
  const [guardandoRepuesto, setGuardandoRepuesto] = useState(false);
  const [notifCRUD, setNotifCRUD] = useState(null);

  const [formRepuesto, setFormRepuesto] = useState({
    codigo_corto: '',
    referencia: '',
    descripcion: '',
    linea: '',
    sublinea: '',
    marca_producto: '',
    modelo_vehiculo: '',
    unidad: 'UND',
    medidas: '',
    imagen_url: '',
    costo_usd: '',
    margen_detal: '40',
    precio_detal_usd: '',
    aplica_iva: true,
    stock: '',
    ubicacion_fisica: '',
  });

  // Búsquedas e inputs de clasificaciones
  const [inputTabNuevaLinea, setInputTabNuevaLinea] = useState('');
  const [inputTabNuevaSublinea, setInputTabNuevaSublinea] = useState('');
  const [inputTabNuevaMarca, setInputTabNuevaMarca] = useState('');
  const [inputTabNuevoModelo, setInputTabNuevoModelo] = useState('');
  const [lineaActivaMaster, setLineaActivaMaster] = useState('Tren Delantero y Dirección');
  const [busquedaLineas, setBusquedaLineas] = useState('');
  const [busquedaMarcas, setBusquedaMarcas] = useState('');
  const [busquedaModelos, setBusquedaModelos] = useState('');
  const [busquedaSublineas, setBusquedaSublineas] = useState('');

  // Paginación
  const [paginaModelos, setPaginaModelos] = useState(1);
  const [itemsPorPaginaModelos, setItemsPorPaginaModelos] = useState(16);
  const [paginaMarcas, setPaginaMarcas] = useState(1);
  const [itemsPorPaginaMarcas, setItemsPorPaginaMarcas] = useState(16);
  const [paginaInventario, setPaginaInventario] = useState(1);
  const [itemsPorPaginaInventario, setItemsPorPaginaInventario] = useState(25);

  const inputLineaRef = useRef(null);
  const inputSublineaRef = useRef(null);
  const inputMarcaRef = useRef(null);
  const inputModeloRef = useRef(null);
  const fileInputFotoRef = useRef(null);
  const [ultimoItemCreado, setUltimoItemCreado] = useState(null);
  const [pasoModalRepuesto, setPasoModalRepuesto] = useState(1);
  const [isDraggingFoto, setIsDraggingFoto] = useState(false);

  // Modales auxiliares
  const [modalRapido, setModalRapido] = useState({
    abierto: false,
    tipo: 'linea',
    valor: '',
    lineaPadre: '',
  });
  const [modalEditar, setModalEditar] = useState({
    abierto: false,
    tipo: 'linea',
    nombreActual: '',
    lineaPadre: '',
    nuevoNombre: '',
    conteoAfectados: 0,
  });
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState({
    abierto: false,
    tipo: 'linea',
    nombre: '',
    lineaPadre: '',
    conteoAfectados: 0,
  });

  // Persistencia localStorage
  const readStorage = (key, fallback) => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : fallback;
    } catch {
      return fallback;
    }
  };

  const [lineasAdicionales, setLineasAdicionales] = useState(() =>
    readStorage('familycar_custom_lineas', [])
  );
  const [sublineasAdicionales, setSublineasAdicionales] = useState(() =>
    readStorage('familycar_custom_sublineas', [])
  );
  const [marcasAdicionales, setMarcasAdicionales] = useState(() =>
    readStorage('familycar_custom_marcas', [])
  );
  const [modelosAdicionales, setModelosAdicionales] = useState(() =>
    readStorage('familycar_custom_modelos', [])
  );

  const [lineasEliminadas, setLineasEliminadas] = useState(() =>
    readStorage('familycar_eliminadas_lineas', [])
  );
  const [sublineasEliminadas, setSublineasEliminadas] = useState(() =>
    readStorage('familycar_eliminadas_sublineas', [])
  );
  const [marcasEliminadas, setMarcasEliminadas] = useState(() =>
    readStorage('familycar_eliminadas_marcas', [])
  );
  const [modelosEliminadas, setModelosEliminadas] = useState(() =>
    readStorage('familycar_eliminadas_modelos', [])
  );

  const [renombresLineas, setRenombresLineas] = useState(() =>
    readStorage('familycar_renombres_lineas', {})
  );
  const [renombresSublineas, setRenombresSublineas] = useState(() =>
    readStorage('familycar_renombres_sublineas', {})
  );
  const [renombresMarcas, setRenombresMarcas] = useState(() =>
    readStorage('familycar_renombres_marcas', {})
  );
  const [renombresModelos, setRenombresModelos] = useState(() =>
    readStorage('familycar_renombres_modelos', {})
  );

  useEffect(() => localStorage.setItem('familycar_custom_lineas', JSON.stringify(lineasAdicionales)), [lineasAdicionales]);
  useEffect(() => localStorage.setItem('familycar_custom_sublineas', JSON.stringify(sublineasAdicionales)), [sublineasAdicionales]);
  useEffect(() => localStorage.setItem('familycar_custom_marcas', JSON.stringify(marcasAdicionales)), [marcasAdicionales]);
  useEffect(() => localStorage.setItem('familycar_custom_modelos', JSON.stringify(modelosAdicionales)), [modelosAdicionales]);
  useEffect(() => localStorage.setItem('familycar_eliminadas_lineas', JSON.stringify(lineasEliminadas)), [lineasEliminadas]);
  useEffect(() => localStorage.setItem('familycar_eliminadas_sublineas', JSON.stringify(sublineasEliminadas)), [sublineasEliminadas]);
  useEffect(() => localStorage.setItem('familycar_eliminadas_marcas', JSON.stringify(marcasEliminadas)), [marcasEliminadas]);
  useEffect(() => localStorage.setItem('familycar_eliminadas_modelos', JSON.stringify(modelosEliminadas)), [modelosEliminadas]);
  useEffect(() => localStorage.setItem('familycar_renombres_lineas', JSON.stringify(renombresLineas)), [renombresLineas]);
  useEffect(() => localStorage.setItem('familycar_renombres_sublineas', JSON.stringify(renombresSublineas)), [renombresSublineas]);
  useEffect(() => localStorage.setItem('familycar_renombres_marcas', JSON.stringify(renombresMarcas)), [renombresMarcas]);
  useEffect(() => localStorage.setItem('familycar_renombres_modelos', JSON.stringify(renombresModelos)), [renombresModelos]);

  // Debounce en filtro de texto del inventario
  useEffect(() => {
    const t = setTimeout(() => setFiltroTextoDebounced(filtroTexto), 150);
    return () => clearTimeout(t);
  }, [filtroTexto]);

  useEffect(() => setPaginaModelos(1), [busquedaModelos]);
  useEffect(() => setPaginaMarcas(1), [busquedaMarcas]);
  useEffect(
    () => setPaginaInventario(1),
    [filtroTextoDebounced, filtroLineaInv, filtroSublineaInv, filtroMarcaInv]
  );

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotifCRUD({ mensaje, tipo });
    setTimeout(() => setNotifCRUD(null), 4500);
  };

  // Listas deduplicadas
  const listaLineas = useMemo(() => {
    const raw = Array.from(
      new Set([
        ...LINEAS_BASE,
        ...productos.map((p) => (p.linea || '').trim()).filter(Boolean),
        ...lineasAdicionales,
        (formRepuesto.linea || '').trim(),
      ])
    )
      .map((l) => renombresLineas[l] || l)
      .filter(
        (l) =>
          Boolean(l) &&
          l.toLowerCase() !== 'tren delantero' &&
          !lineasEliminadas.map((e) => e.toLowerCase()).includes(l.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b));

    if (
      ultimoItemCreado?.tipo === 'linea' &&
      raw.some((l) => l.toLowerCase() === ultimoItemCreado.valor.toLowerCase())
    ) {
      const match = raw.find((l) => l.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter((l) => l.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, lineasAdicionales, formRepuesto.linea, ultimoItemCreado, renombresLineas, lineasEliminadas]);

  const listaMarcas = useMemo(() => {
    const raw = Array.from(
      new Set([
        ...MARCAS_BASE,
        ...productos.map((p) => (p.marca_producto || p.marca || '').trim().toUpperCase()).filter(Boolean),
        ...marcasAdicionales,
        (formRepuesto.marca_producto || '').trim().toUpperCase(),
      ])
    )
      .map((m) => renombresMarcas[m] || m)
      .filter(
        (m) => Boolean(m) && !marcasEliminadas.map((e) => e.toLowerCase()).includes(m.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b));

    if (
      ultimoItemCreado?.tipo === 'marca' &&
      raw.some((m) => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase())
    ) {
      const match = raw.find((m) => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter((m) => m.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, marcasAdicionales, formRepuesto.marca_producto, ultimoItemCreado, renombresMarcas, marcasEliminadas]);

  const listaModelos = useMemo(() => {
    const modelosDeProductos = productos.flatMap((p) => desglosarModelosVehiculo(p.modelo_vehiculo));
    const modelosDeFormulario = desglosarModelosVehiculo(formRepuesto.modelo_vehiculo);

    const raw = Array.from(
      new Set([
        ...MODELOS_BASE,
        ...modelosDeProductos,
        ...modelosAdicionales.flatMap((m) => desglosarModelosVehiculo(m)),
        ...modelosDeFormulario,
      ])
    )
      .map((m) => renombresModelos[m] || m)
      .filter(
        (m) => Boolean(m) && !modelosEliminadas.map((e) => e.toLowerCase()).includes(m.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b));

    if (
      ultimoItemCreado?.tipo === 'modelo' &&
      raw.some((m) => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase())
    ) {
      const match = raw.find((m) => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter((m) => m.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, modelosAdicionales, formRepuesto.modelo_vehiculo, ultimoItemCreado, renombresModelos, modelosEliminadas]);

  const conteoPorLinea = useMemo(() => {
    const map = {};
    productos.forEach((p) => {
      const l = renombresLineas[(p.linea || 'Sin Línea').trim()] || (p.linea || 'Sin Línea').trim();
      map[l] = (map[l] || 0) + 1;
    });
    return map;
  }, [productos, renombresLineas]);

  const conteoPorMarca = useMemo(() => {
    const map = {};
    productos.forEach((p) => {
      const raw = (p.marca_producto || p.marca || 'Sin Marca').trim().toUpperCase();
      const m = renombresMarcas[raw] || raw;
      map[m] = (map[m] || 0) + 1;
    });
    return map;
  }, [productos, renombresMarcas]);

  const conteoPorModelo = useMemo(() => {
    const map = {};
    listaModelos.forEach((m) => {
      map[m] = contarRepuestosPorModelo(m, productos);
    });
    return map;
  }, [listaModelos, productos]);

  const conteoPorSublinea = useMemo(() => {
    const map = {};
    productos.forEach((p) => {
      const raw = (p.sublinea || 'General').trim();
      const s = renombresSublineas[raw] || raw;
      map[s] = (map[s] || 0) + 1;
      map[s.toLowerCase()] = (map[s.toLowerCase()] || 0) + 1;
      map[raw] = (map[raw] || 0) + 1;
      map[raw.toLowerCase()] = (map[raw.toLowerCase()] || 0) + 1;
    });
    return map;
  }, [productos, renombresSublineas]);

  const sublineasParaMaster = useMemo(() => {
    const subs = obtenerSublineasParaLinea(lineaActivaMaster, productos, sublineasAdicionales);
    const renombradas = subs.map((s) => renombresSublineas[s] || s);
    let filtradas = renombradas.filter(
      (s) => Boolean(s) && !sublineasEliminadas.map((e) => e.toLowerCase()).includes(s.toLowerCase())
    );
    if (busquedaSublineas.trim()) {
      const q = busquedaSublineas.toLowerCase();
      filtradas = filtradas.filter((s) => s.toLowerCase().includes(q));
    }
    if (
      ultimoItemCreado?.tipo === 'sublinea' &&
      filtradas.some((s) => s.toLowerCase() === ultimoItemCreado.valor.toLowerCase())
    ) {
      const match = filtradas.find((s) => s.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...filtradas.filter((s) => s.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return filtradas;
  }, [lineaActivaMaster, productos, sublineasAdicionales, busquedaSublineas, ultimoItemCreado, renombresSublineas, sublineasEliminadas]);

  const lineasFiltradas = useMemo(() => {
    let filtradas = listaLineas;
    if (busquedaLineas.trim()) {
      const q = busquedaLineas.toLowerCase().trim();
      filtradas = listaLineas.filter((l) => l.toLowerCase().includes(q));
    }
    return filtradas;
  }, [listaLineas, busquedaLineas]);

  const marcasFiltradas = useMemo(() => {
    if (!busquedaMarcas.trim()) return listaMarcas;
    const q = busquedaMarcas.toLowerCase();
    return listaMarcas.filter((m) => m.toLowerCase().includes(q));
  }, [listaMarcas, busquedaMarcas]);

  const modelosFiltrados = useMemo(() => {
    if (!busquedaModelos.trim()) return listaModelos;
    const q = busquedaModelos.toLowerCase();
    return listaModelos.filter((m) => {
      const marca = obtenerMarcaVehiculo(m).toLowerCase();
      return m.toLowerCase().includes(q) || marca.includes(q);
    });
  }, [listaModelos, busquedaModelos]);

  const totalPaginasModelos = Math.max(
    1,
    Math.ceil(
      modelosFiltrados.length /
        (itemsPorPaginaModelos === 'todos'
          ? modelosFiltrados.length || 1
          : parseInt(itemsPorPaginaModelos, 10) || 16)
    )
  );
  const modelosPaginados = useMemo(() => {
    if (itemsPorPaginaModelos === 'todos') return modelosFiltrados;
    const num = parseInt(itemsPorPaginaModelos, 10) || 16;
    const inicio = (paginaModelos - 1) * num;
    return modelosFiltrados.slice(inicio, inicio + num);
  }, [modelosFiltrados, paginaModelos, itemsPorPaginaModelos]);

  const totalPaginasMarcas = Math.max(
    1,
    Math.ceil(
      marcasFiltradas.length /
        (itemsPorPaginaMarcas === 'todos'
          ? marcasFiltradas.length || 1
          : parseInt(itemsPorPaginaMarcas, 10) || 16)
    )
  );
  const marcasPaginadas = useMemo(() => {
    if (itemsPorPaginaMarcas === 'todos') return marcasFiltradas;
    const num = parseInt(itemsPorPaginaMarcas, 10) || 16;
    const inicio = (paginaMarcas - 1) * num;
    return marcasFiltradas.slice(inicio, inicio + num);
  }, [marcasFiltradas, paginaMarcas, itemsPorPaginaMarcas]);

  // Procesamiento y compresión ligera de imágenes (protege DB y Egress en plan gratuito)
  const procesarArchivoImagen = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      mostrarNotificacion('Selecciona un archivo de imagen válido (JPG, PNG, WEBP).', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 420;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/webp', 0.72);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.68);
        }
        if (dataUrl.length > 30000) {
          const fallbackUrl = canvas.toDataURL(
            dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
            0.55
          );
          if (fallbackUrl.length < dataUrl.length) dataUrl = fallbackUrl;
        }
        setFormRepuesto((prev) => ({ ...prev, imagen_url: dataUrl }));
        mostrarNotificacion('Foto comprimida y lista para guardar.', 'success');
      };
      img.onerror = () => mostrarNotificacion('No se pudo procesar la imagen.', 'error');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!modalRepuestoAbierto) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            procesarArchivoImagen(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [modalRepuestoAbierto]);

  const fotoActualMostrada = useMemo(() => {
    if (
      !formRepuesto.imagen_url ||
      formRepuesto.imagen_url === 'sin_foto' ||
      formRepuesto.imagen_url === 'none'
    ) {
      return null;
    }
    return formRepuesto.imagen_url.trim();
  }, [formRepuesto.imagen_url]);

  const esFotoPersonalizada = Boolean(fotoActualMostrada);

  // Creadores de clasificaciones
  const agregarNuevaLinea = (nombre) => {
    const val = (typeof nombre === 'string' ? nombre : inputTabNuevaLinea || '').trim();
    if (!val) {
      mostrarNotificacion('Escribe el nombre de la línea antes de crearla.', 'warning');
      inputLineaRef.current?.focus();
      return '';
    }
    if (!lineasAdicionales.map((l) => l.toLowerCase()).includes(val.toLowerCase())) {
      setLineasAdicionales((prev) => [...prev, val]);
    }
    setLineaActivaMaster(val);
    setUltimoItemCreado({ tipo: 'linea', valor: val });
    mostrarNotificacion(`Línea "${val}" creada.`, 'success');
    return val;
  };

  const agregarNuevaSublinea = (nombre, linea = lineaActivaMaster) => {
    const val = (typeof nombre === 'string' ? nombre : inputTabNuevaSublinea || '').trim();
    if (!val) {
      mostrarNotificacion('Escribe el nombre de la pieza antes de agregarla.', 'warning');
      inputSublineaRef.current?.focus();
      return '';
    }
    setSublineasAdicionales((prev) => {
      const existe = prev.some(
        (s) => (typeof s === 'string' ? s : s?.nombre || '').toLowerCase() === val.toLowerCase()
      );
      return existe ? prev : [...prev, { nombre: val, linea: linea || lineaActivaMaster }];
    });
    setUltimoItemCreado({ tipo: 'sublinea', valor: val });
    mostrarNotificacion(`Pieza "${val}" agregada.`, 'success');
    return val;
  };

  const agregarNuevaMarca = (nombre) => {
    const val = (typeof nombre === 'string' ? nombre : inputTabNuevaMarca || '')
      .trim()
      .toUpperCase();
    if (!val) {
      mostrarNotificacion('Escribe el nombre de la marca antes de registrarla.', 'warning');
      inputMarcaRef.current?.focus();
      return '';
    }
    if (!marcasAdicionales.map((m) => m.toLowerCase()).includes(val.toLowerCase())) {
      setMarcasAdicionales((prev) => [...prev, val]);
    }
    setUltimoItemCreado({ tipo: 'marca', valor: val });
    mostrarNotificacion(`Marca "${val}" registrada.`, 'success');
    return val;
  };

  const agregarNuevoModelo = (nombre) => {
    const val = (typeof nombre === 'string' ? nombre : inputTabNuevoModelo || '').trim();
    if (!val) {
      mostrarNotificacion('Escribe el modelo de vehículo antes de registrarlo.', 'warning');
      inputModeloRef.current?.focus();
      return '';
    }
    if (!modelosAdicionales.map((m) => m.toLowerCase()).includes(val.toLowerCase())) {
      setModelosAdicionales((prev) => [...prev, val]);
    }
    setUltimoItemCreado({ tipo: 'modelo', valor: val });
    mostrarNotificacion(`Vehículo "${val}" registrado.`, 'success');
    return val;
  };

  const abrirModalEditar = (tipo, nombreActual, lineaPadre = '', conteo = 0) => {
    setModalEditar({
      abierto: true,
      tipo,
      nombreActual,
      lineaPadre,
      nuevoNombre: nombreActual,
      conteoAfectados: conteo,
    });
  };

  const confirmarEdicion = async (e) => {
    e.preventDefault();
    const { tipo, nombreActual, nuevoNombre } = modalEditar;
    const nuevo = nuevoNombre.trim();
    if (!nuevo) {
      mostrarNotificacion('Ingresa un nombre válido.', 'warning');
      return;
    }
    if (nuevo.toLowerCase() === nombreActual.toLowerCase()) {
      setModalEditar({
        abierto: false,
        tipo: 'linea',
        nombreActual: '',
        lineaPadre: '',
        nuevoNombre: '',
        conteoAfectados: 0,
      });
      return;
    }

    try {
      if (tipo === 'linea') {
        setRenombresLineas((prev) => ({ ...prev, [nombreActual]: nuevo }));
        setLineasAdicionales((prev) =>
          prev.map((l) => (l.toLowerCase() === nombreActual.toLowerCase() ? nuevo : l))
        );
        await supabase.from('productos').update({ linea: nuevo }).eq('linea', nombreActual);
        if (lineaActivaMaster.toLowerCase() === nombreActual.toLowerCase()) {
          setLineaActivaMaster(nuevo);
        }
      } else if (tipo === 'sublinea') {
        setRenombresSublineas((prev) => ({ ...prev, [nombreActual]: nuevo }));
        setSublineasAdicionales((prev) =>
          prev.map((s) => {
            const nom = typeof s === 'string' ? s : s?.nombre || '';
            if (nom.toLowerCase() === nombreActual.toLowerCase()) {
              return typeof s === 'string' ? nuevo : { ...s, nombre: nuevo };
            }
            return s;
          })
        );
        await supabase.from('productos').update({ sublinea: nuevo }).eq('sublinea', nombreActual);
      } else if (tipo === 'marca') {
        const nuevoUpper = nuevo.toUpperCase();
        setRenombresMarcas((prev) => ({ ...prev, [nombreActual]: nuevoUpper }));
        setMarcasAdicionales((prev) =>
          prev.map((m) => (m.toLowerCase() === nombreActual.toLowerCase() ? nuevoUpper : m))
        );
        await supabase
          .from('productos')
          .update({ marca_producto: nuevoUpper })
          .eq('marca_producto', nombreActual);
      } else if (tipo === 'modelo') {
        setRenombresModelos((prev) => ({ ...prev, [nombreActual]: nuevo }));
        setModelosAdicionales((prev) =>
          prev.map((m) => (m.toLowerCase() === nombreActual.toLowerCase() ? nuevo : m))
        );
        await supabase
          .from('productos')
          .update({ modelo_vehiculo: nuevo })
          .eq('modelo_vehiculo', nombreActual);
      }

      mostrarNotificacion(`"${nombreActual}" actualizado a "${nuevo}".`, 'success');
      setModalEditar({
        abierto: false,
        tipo: 'linea',
        nombreActual: '',
        lineaPadre: '',
        nuevoNombre: '',
        conteoAfectados: 0,
      });
      invalidateCatalogoCache();
      cargarInventario(true);
    } catch (err) {
      mostrarNotificacion('Error al guardar cambios: ' + err.message, 'error');
    }
  };

  const abrirModalConfirmarEliminar = (tipo, nombre, lineaPadre = '', conteo = 0) => {
    setModalConfirmarEliminar({
      abierto: true,
      tipo,
      nombre,
      lineaPadre,
      conteoAfectados: conteo,
    });
  };

  const ejecutarEliminacion = async () => {
    const { tipo, nombre, conteoAfectados } = modalConfirmarEliminar;
    try {
      if (tipo === 'linea') {
        setLineasEliminadas((prev) => [
          ...prev.filter((l) => l.toLowerCase() !== nombre.toLowerCase()),
          nombre,
        ]);
        setLineasAdicionales((prev) => prev.filter((l) => l.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ linea: 'General' }).eq('linea', nombre);
        }
        if (lineaActivaMaster.toLowerCase() === nombre.toLowerCase()) {
          setLineaActivaMaster('Tren Delantero y Dirección');
        }
      } else if (tipo === 'sublinea') {
        setSublineasEliminadas((prev) => [
          ...prev.filter((s) => s.toLowerCase() !== nombre.toLowerCase()),
          nombre,
        ]);
        setSublineasAdicionales((prev) =>
          prev.filter((s) => (typeof s === 'string' ? s : s?.nombre || '').toLowerCase() !== nombre.toLowerCase())
        );
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ sublinea: 'General' }).eq('sublinea', nombre);
        }
      } else if (tipo === 'marca') {
        setMarcasEliminadas((prev) => [
          ...prev.filter((m) => m.toLowerCase() !== nombre.toLowerCase()),
          nombre,
        ]);
        setMarcasAdicionales((prev) => prev.filter((m) => m.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase
            .from('productos')
            .update({ marca_producto: 'GENÉRICO' })
            .eq('marca_producto', nombre);
        }
      } else if (tipo === 'modelo') {
        setModelosEliminadas((prev) => [
          ...prev.filter((m) => m.toLowerCase() !== nombre.toLowerCase()),
          nombre,
        ]);
        setModelosAdicionales((prev) => prev.filter((m) => m.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase
            .from('productos')
            .update({ modelo_vehiculo: 'Universal' })
            .eq('modelo_vehiculo', nombre);
        }
      }

      mostrarNotificacion(`"${nombre}" eliminado del catálogo.`, 'warning');
      setModalConfirmarEliminar({
        abierto: false,
        tipo: 'linea',
        nombre: '',
        lineaPadre: '',
        conteoAfectados: 0,
      });
      invalidateCatalogoCache();
      cargarInventario(true);
    } catch (err) {
      mostrarNotificacion('Error al eliminar: ' + err.message, 'error');
    }
  };

  const cargarInventario = async (force = false) => {
    setCargandoProd(true);
    try {
      const res = await getCatalogoCached({ force });
      const ordenados = [...(res.items || [])].sort((a, b) =>
        String(a.descripcion || '').localeCompare(String(b.descripcion || ''))
      );
      setProductos(ordenados);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setCargandoProd(false);
    }
  };

  useEffect(() => {
    cargarInventario(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalConfirmarEliminar.abierto) {
          setModalConfirmarEliminar({
            abierto: false,
            tipo: 'linea',
            nombre: '',
            lineaPadre: '',
            conteoAfectados: 0,
          });
        } else if (modalEditar.abierto) {
          setModalEditar({
            abierto: false,
            tipo: 'linea',
            nombreActual: '',
            lineaPadre: '',
            nuevoNombre: '',
            conteoAfectados: 0,
          });
        } else if (modalRapido.abierto) {
          setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' });
        } else if (modalRepuestoAbierto) {
          setModalRepuestoAbierto(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalRepuestoAbierto, modalRapido.abierto, modalEditar.abierto, modalConfirmarEliminar.abierto]);

  // Cálculos de precios en formulario
  const recalcularPrecioVenta = (costo, margen) => {
    const c = parseFloat(costo) || 0;
    const m = parseFloat(margen);
    const margenValido = isNaN(m) ? 40 : m;
    if (c <= 0) return;
    setFormRepuesto((prev) => ({
      ...prev,
      precio_detal_usd: (c * (1 + margenValido / 100)).toFixed(2),
    }));
  };

  const handleCostoChange = (val) => {
    setFormRepuesto((prev) => ({ ...prev, costo_usd: val }));
    const c = parseFloat(val) || 0;
    if (c > 0 && formRepuesto.margen_detal) {
      recalcularPrecioVenta(val, formRepuesto.margen_detal);
    }
  };

  const handleMargenChange = (val) => {
    const c = parseFloat(formRepuesto.costo_usd) || 0;
    setFormRepuesto((prev) => ({ ...prev, margen_detal: val }));
    if (c > 0) {
      recalcularPrecioVenta(formRepuesto.costo_usd, val);
    } else {
      mostrarNotificacion('Ingresa primero el Costo ($) para calcular por margen.', 'info');
    }
  };

  const handlePrecioVentaChange = (val) => {
    setFormRepuesto((prev) => {
      const c = parseFloat(prev.costo_usd) || 0;
      const p = parseFloat(val) || 0;
      let nuevoMargen = prev.margen_detal;
      if (c > 0 && p >= c) {
        nuevoMargen = String(Math.round(((p - c) / c) * 100));
      } else if (c <= 0) {
        nuevoMargen = '';
      }
      return { ...prev, precio_detal_usd: val, margen_detal: nuevoMargen };
    });
  };

  const sublineasDisponiblesInv = useMemo(
    () => obtenerSublineasParaLinea(filtroLineaInv, productos, sublineasAdicionales),
    [filtroLineaInv, productos, sublineasAdicionales]
  );

  const sublineasDisponiblesModal = useMemo(
    () => obtenerSublineasParaLinea(formRepuesto.linea, productos, sublineasAdicionales),
    [formRepuesto.linea, productos, sublineasAdicionales]
  );

  const validarPasoActual = (paso) => {
    if (paso === 1) {
      if (!formRepuesto.linea?.trim()) {
        mostrarNotificacion('Selecciona la Línea o Sistema del repuesto.', 'warning');
        return false;
      }
      if (!formRepuesto.marca_producto?.trim()) {
        mostrarNotificacion('Indica la Marca del repuesto.', 'warning');
        return false;
      }
      if (!formRepuesto.modelo_vehiculo?.trim()) {
        mostrarNotificacion('Selecciona o escribe el Vehículo compatible.', 'warning');
        return false;
      }
      return true;
    }
    if (paso === 2) {
      if (!(formRepuesto.descripcion || '').trim()) {
        mostrarNotificacion('Ingresa la descripción del repuesto.', 'warning');
        return false;
      }
      if (!(formRepuesto.codigo_corto || '').trim() && !(formRepuesto.referencia || '').trim()) {
        mostrarNotificacion('Ingresa al menos el Código Corto o la Referencia OEM.', 'warning');
        return false;
      }
      return true;
    }
    return true;
  };

  const avanzarPasoModal = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (validarPasoActual(pasoModalRepuesto)) {
      setPasoModalRepuesto((prev) => Math.min(4, prev + 1));
    }
  };

  const retrocederPasoModal = (e) => {
    if (e?.preventDefault) e.preventDefault();
    setPasoModalRepuesto((prev) => Math.max(1, prev - 1));
  };

  const saltarAPasoModal = (destinoId) => {
    if (destinoId > pasoModalRepuesto && !validarPasoActual(pasoModalRepuesto)) return;
    setPasoModalRepuesto(destinoId);
  };

  const abrirCrearRepuesto = () => {
    setPasoModalRepuesto(1);
    setRepuestoEditandoId(null);
    setFormRepuesto({
      codigo_corto: '',
      referencia: '',
      descripcion: '',
      linea: '',
      sublinea: '',
      marca_producto: '',
      modelo_vehiculo: '',
      unidad: 'UND',
      medidas: '',
      imagen_url: '',
      costo_usd: '',
      margen_detal: '40',
      precio_detal_usd: '',
      aplica_iva: true,
      stock: '0',
      ubicacion_fisica: '',
    });
    setModalRepuestoAbierto(true);
  };

  const abrirEditarRepuesto = (p) => {
    setPasoModalRepuesto(1);
    setRepuestoEditandoId(p.id);
    const costo = parseFloat(p.costo_usd) || 0;
    const detal = parseFloat(p.precio_detal_usd) || 0;
    const mDetal = costo > 0 && detal > costo ? Math.round(((detal - costo) / costo) * 100) : 40;

    setFormRepuesto({
      codigo_corto: p.codigo_corto || '',
      referencia: p.referencia || '',
      descripcion: p.descripcion || '',
      linea: p.linea || '',
      sublinea: p.sublinea || '',
      marca_producto: p.marca_producto || p.marca || '',
      modelo_vehiculo: p.modelo_vehiculo || '',
      unidad: p.unidad || 'UND',
      medidas: p.medidas || '',
      imagen_url: p.imagen_url || '',
      costo_usd: costo > 0 ? String(costo) : '',
      margen_detal: String(mDetal),
      precio_detal_usd: detal > 0 ? String(detal) : '',
      aplica_iva: p.aplica_iva !== false,
      stock: String(p.stock ?? 0),
      ubicacion_fisica: p.ubicacion_fisica || '',
    });
    setModalRepuestoAbierto(true);
  };

  const guardarRepuesto = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const codCorto = (formRepuesto.codigo_corto || '').trim();
    const refOEM = (formRepuesto.referencia || '').trim();
    const desc = (formRepuesto.descripcion || '').trim();

    if (!codCorto && !refOEM) {
      mostrarNotificacion('Ingresa al menos el Código Corto o la Referencia OEM.', 'warning');
      setPasoModalRepuesto(2);
      return;
    }
    if (!desc) {
      mostrarNotificacion('La descripción del repuesto es obligatoria.', 'warning');
      setPasoModalRepuesto(2);
      return;
    }

    const pVenta = parseFloat(formRepuesto.precio_detal_usd) || 0;
    if (pVenta <= 0) {
      mostrarNotificacion('Ingresa un precio de venta válido mayor a 0.', 'warning');
      setPasoModalRepuesto(4);
      return;
    }

    const codigoFinal = (codCorto || refOEM).toUpperCase();
    const oemFinal = refOEM ? refOEM.toUpperCase() : null;

    setGuardandoRepuesto(true);
    try {
      const lineaFinal = formRepuesto.linea.trim() || 'General';
      const marcaFinal = formRepuesto.marca_producto.trim().toUpperCase() || 'GENÉRICO';
      const modeloFinal = formRepuesto.modelo_vehiculo.trim() || 'Universal';

      const payload = {
        codigo_corto: codigoFinal,
        referencia: oemFinal,
        descripcion: desc.toUpperCase(),
        linea: lineaFinal,
        sublinea: formRepuesto.sublinea.trim() || null,
        marca: marcaFinal,
        marca_producto: marcaFinal,
        modelo_vehiculo: modeloFinal,
        unidad: formRepuesto.unidad.trim() || 'UND',
        medidas: formRepuesto.medidas.trim() || null,
        imagen_url: formRepuesto.imagen_url.trim() || null,
        costo_usd: parseFloat(formRepuesto.costo_usd) || 0,
        precio_detal_usd: pVenta,
        precio_taller_usd: pVenta,
        precio_mayor_usd: pVenta,
        aplica_iva: formRepuesto.aplica_iva,
        stock: parseInt(formRepuesto.stock, 10) || 0,
        ubicacion_fisica: formRepuesto.ubicacion_fisica.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (repuestoEditandoId) {
        const { error } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', repuestoEditandoId);
        if (error) throw error;
        mostrarNotificacion('Repuesto actualizado exitosamente.', 'success');
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) throw error;
        mostrarNotificacion('Nuevo repuesto registrado en el inventario.', 'success');
      }

      setModalRepuestoAbierto(false);
      invalidateCatalogoCache();
      cargarInventario(true);
    } catch (err) {
      mostrarNotificacion('Error al guardar en Supabase: ' + err.message, 'error');
    } finally {
      setGuardandoRepuesto(false);
    }
  };

  const confirmarEliminacionRepuesto = async () => {
    if (!repuestoAEliminar) return;
    setEliminandoRepuesto(true);
    try {
      const { error } = await supabase.from('productos').delete().eq('id', repuestoAEliminar.id);
      if (error) throw error;
      mostrarNotificacion(`Repuesto ${repuestoAEliminar.codigo_corto} eliminado.`, 'warning');
      setRepuestoAEliminar(null);
      invalidateCatalogoCache();
      cargarInventario(true);
    } catch (err) {
      mostrarNotificacion('Error eliminando repuesto: ' + err.message, 'error');
    } finally {
      setEliminandoRepuesto(false);
    }
  };

  // Filtrado de inventario
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (filtroTextoDebounced.trim()) {
        const t = filtroTextoDebounced.toLowerCase().trim();
        const marcaAuto = obtenerMarcaVehiculo(p.modelo_vehiculo || '').toLowerCase();
        const match =
          (p.codigo_corto || '').toLowerCase().includes(t) ||
          (p.referencia || '').toLowerCase().includes(t) ||
          (p.descripcion || '').toLowerCase().includes(t) ||
          (p.marca_producto || p.marca || '').toLowerCase().includes(t) ||
          (p.modelo_vehiculo || '').toLowerCase().includes(t) ||
          marcaAuto.includes(t) ||
          (p.linea || '').toLowerCase().includes(t) ||
          (p.sublinea || '').toLowerCase().includes(t);
        if (!match) return false;
      }

      if (filtroLineaInv && (p.linea || '').toLowerCase() !== filtroLineaInv.toLowerCase()) {
        return false;
      }
      if (filtroSublineaInv) {
        const cleanSub = filtroSublineaInv.replace(/^\d+[-_ ]*/, '').toLowerCase().trim();
        const pSub = (p.sublinea || '').toLowerCase();
        const pDesc = (p.descripcion || '').toLowerCase();
        if (!pSub.includes(cleanSub) && !pDesc.includes(cleanSub)) return false;
      }
      if (filtroMarcaInv) {
        const m = (p.marca_producto || p.marca || '').toLowerCase();
        if (m !== filtroMarcaInv.toLowerCase()) return false;
      }
      return true;
    });
  }, [productos, filtroTextoDebounced, filtroLineaInv, filtroSublineaInv, filtroMarcaInv]);

  const totalPaginasInventario = Math.max(
    1,
    Math.ceil(
      productosFiltrados.length /
        (itemsPorPaginaInventario === 'todos'
          ? productosFiltrados.length || 1
          : parseInt(itemsPorPaginaInventario, 10) || 25)
    )
  );
  const productosPaginados = useMemo(() => {
    if (itemsPorPaginaInventario === 'todos') return productosFiltrados;
    const num = parseInt(itemsPorPaginaInventario, 10) || 25;
    const inicio = (paginaInventario - 1) * num;
    return productosFiltrados.slice(inicio, inicio + num);
  }, [productosFiltrados, paginaInventario, itemsPorPaginaInventario]);

  // Cuentas por cobrar
  const [cuentasCobrar, setCuentasCobrar] = useState([]);
  const [cargandoCxC, setCargandoCxC] = useState(false);
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [cuentaActivaAbono, setCuentaActivaAbono] = useState(null);
  const [montoAbonoUSD, setMontoAbonoUSD] = useState('');
  const [metodoAbono, setMetodoAbono] = useState('EFECTIVO');
  const [guardandoAbono, setGuardandoAbono] = useState(false);

  const cargarCuentasCobrar = async (force = false) => {
    setCargandoCxC(true);
    try {
      const listaFinal = await getCuentasCobrarCached({ force });
      setCuentasCobrar(listaFinal || []);
    } catch (err) {
      console.warn('Error consultando cuentas por cobrar:', err);
    } finally {
      setCargandoCxC(false);
    }
  };

  useEffect(() => {
    if (tabActiva === 'cxc') {
      cargarCuentasCobrar(false);
    }
  }, [tabActiva]);

  const abrirRegistrarAbono = (cuenta) => {
    setCuentaActivaAbono(cuenta);
    setMontoAbonoUSD('');
    setMetodoAbono('EFECTIVO');
    setModalAbonoAbierto(true);
  };

  const confirmarAbono = async (e) => {
    e.preventDefault();
    if (!cuentaActivaAbono) return;
    const abonoUSD = parseFloat(montoAbonoUSD);
    if (!abonoUSD || abonoUSD <= 0) {
      mostrarNotificacion('Ingresa un monto de abono válido mayor a 0.', 'warning');
      return;
    }

    setGuardandoAbono(true);
    try {
      const totalOriginal = parseFloat(cuentaActivaAbono.monto_total_usd) || 0;
      const abonadoAnterior = parseFloat(cuentaActivaAbono.monto_abonado_usd) || 0;
      const nuevoAbonado = abonadoAnterior + abonoUSD;
      const nuevoSaldo = Math.max(0, totalOriginal - nuevoAbonado);
      const nuevoEstado = nuevoSaldo <= 0.01 ? 'pagado' : 'parcial';

      if (!String(cuentaActivaAbono.id).startsWith('v_')) {
        await supabase
          .from('cuentas_cobrar')
          .update({
            monto_abonado_usd: nuevoAbonado,
            saldo_pendiente_usd: nuevoSaldo,
            estado: nuevoEstado,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cuentaActivaAbono.id);
      }

      setModalAbonoAbierto(false);
      invalidateCuentasCobrarCache();
      cargarCuentasCobrar(true);
      mostrarNotificacion(
        `Abono de $${abonoUSD.toFixed(2)} registrado. Nuevo saldo: $${nuevoSaldo.toFixed(2)}`,
        'success'
      );
    } catch (err) {
      mostrarNotificacion('Error registrando abono: ' + err.message, 'error');
    } finally {
      setGuardandoAbono(false);
    }
  };

  const totalDeudaPendiente = cuentasCobrar
    .filter((c) => c.estado !== 'pagado')
    .reduce((acc, c) => acc + (parseFloat(c.saldo_pendiente_usd) || 0), 0);

  const totalAbonado = cuentasCobrar.reduce(
    (acc, c) => acc + (parseFloat(c.monto_abonado_usd) || 0),
    0
  );

  const tabs = [
    { id: 'inventario', label: 'Inventario', icon: Package, count: productos.length },
    { id: 'lineas', label: 'Líneas y Piezas', icon: Layers, count: listaLineas.length },
    { id: 'marcas', label: 'Marcas', icon: Tag, count: listaMarcas.length },
    { id: 'modelos', label: 'Vehículos', icon: Car, count: listaModelos.length },
    { id: 'compras', label: 'Ingreso Mercancía', icon: Truck },
    {
      id: 'cxc',
      label: 'Cuentas por Cobrar',
      icon: CreditCard,
      badge: totalDeudaPendiente > 0 ? `$${Math.round(totalDeudaPendiente)}` : null,
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <ToastNotification notification={notifCRUD} onClose={() => setNotifCRUD(null)} />

      {/* Cabecera */}
      <div className="surface-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Gestión e Inventario
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catálogo de repuestos, recepciones de mercancía y cuentas por cobrar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onVolverAlMostrador}
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 btn-gradient-red text-xs font-semibold whitespace-nowrap"
        >
          <span>Ir al mostrador</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Navegación de sub-módulos con paleta unificada */}
      <div className="surface-card p-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activa =
              tabActiva === tab.id || (tab.id === 'lineas' && tabActiva === 'clasificaciones');

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActiva(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activa
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      activa
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      activa
                        ? 'bg-black/20 text-white'
                        : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vistas por pestaña */}
      {tabActiva === 'inventario' && (
        <InventarioTab
          productos={productos}
          productosFiltrados={productosFiltrados}
          productosPaginados={productosPaginados}
          cargandoProd={cargandoProd}
          filtroTexto={filtroTexto}
          setFiltroTexto={setFiltroTexto}
          filtroLineaInv={filtroLineaInv}
          setFiltroLineaInv={setFiltroLineaInv}
          filtroSublineaInv={filtroSublineaInv}
          setFiltroSublineaInv={setFiltroSublineaInv}
          filtroMarcaInv={filtroMarcaInv}
          setFiltroMarcaInv={setFiltroMarcaInv}
          listaLineas={listaLineas}
          sublineasDisponiblesInv={sublineasDisponiblesInv}
          listaMarcas={listaMarcas}
          tasaBCV={tasaBCV}
          paginaInventario={paginaInventario}
          totalPaginasInventario={totalPaginasInventario}
          itemsPorPaginaInventario={itemsPorPaginaInventario}
          setPaginaInventario={setPaginaInventario}
          setItemsPorPaginaInventario={setItemsPorPaginaInventario}
          onAbrirCrear={abrirCrearRepuesto}
          onAbrirEditar={abrirEditarRepuesto}
          onSolicitarEliminar={(p) => setRepuestoAEliminar(p)}
          onZoomRepuesto={(p) => setRepuestoParaZoom(p)}
          onActualizarInventario={() => cargarInventario(true)}
        />
      )}

      {(tabActiva === 'lineas' ||
        tabActiva === 'clasificaciones' ||
        tabActiva === 'marcas' ||
        tabActiva === 'modelos') && (
        <ClasificacionesTab
          tabActiva={tabActiva}
          setTabActiva={setTabActiva}
          onNuevoRepuesto={abrirCrearRepuesto}
          lineasFiltradas={lineasFiltradas}
          conteoPorLinea={conteoPorLinea}
          lineaActivaMaster={lineaActivaMaster}
          setLineaActivaMaster={setLineaActivaMaster}
          busquedaLineas={busquedaLineas}
          setBusquedaLineas={setBusquedaLineas}
          inputTabNuevaLinea={inputTabNuevaLinea}
          setInputTabNuevaLinea={setInputTabNuevaLinea}
          inputLineaRef={inputLineaRef}
          agregarNuevaLinea={agregarNuevaLinea}
          sublineasParaMaster={sublineasParaMaster}
          conteoPorSublinea={conteoPorSublinea}
          busquedaSublineas={busquedaSublineas}
          setBusquedaSublineas={setBusquedaSublineas}
          inputTabNuevaSublinea={inputTabNuevaSublinea}
          setInputTabNuevaSublinea={setInputTabNuevaSublinea}
          inputSublineaRef={inputSublineaRef}
          agregarNuevaSublinea={agregarNuevaSublinea}
          marcasFiltradas={marcasFiltradas}
          marcasPaginadas={marcasPaginadas}
          conteoPorMarca={conteoPorMarca}
          busquedaMarcas={busquedaMarcas}
          setBusquedaMarcas={setBusquedaMarcas}
          inputTabNuevaMarca={inputTabNuevaMarca}
          setInputTabNuevaMarca={setInputTabNuevaMarca}
          inputMarcaRef={inputMarcaRef}
          agregarNuevaMarca={agregarNuevaMarca}
          paginaMarcas={paginaMarcas}
          totalPaginasMarcas={totalPaginasMarcas}
          itemsPorPaginaMarcas={itemsPorPaginaMarcas}
          setPaginaMarcas={setPaginaMarcas}
          setItemsPorPaginaMarcas={setItemsPorPaginaMarcas}
          modelosFiltrados={modelosFiltrados}
          modelosPaginados={modelosPaginados}
          conteoPorModelo={conteoPorModelo}
          busquedaModelos={busquedaModelos}
          setBusquedaModelos={setBusquedaModelos}
          inputTabNuevoModelo={inputTabNuevoModelo}
          setInputTabNuevoModelo={setInputTabNuevoModelo}
          inputModeloRef={inputModeloRef}
          agregarNuevoModelo={agregarNuevoModelo}
          paginaModelos={paginaModelos}
          totalPaginasModelos={totalPaginasModelos}
          itemsPorPaginaModelos={itemsPorPaginaModelos}
          setPaginaModelos={setPaginaModelos}
          setItemsPorPaginaModelos={setItemsPorPaginaModelos}
          ultimoItemCreado={ultimoItemCreado}
          setModalRapido={setModalRapido}
          abrirModalEditar={abrirModalEditar}
          abrirModalConfirmarEliminar={abrirModalConfirmarEliminar}
          setFiltroLineaInv={setFiltroLineaInv}
          setFiltroSublineaInv={setFiltroSublineaInv}
          setFiltroMarcaInv={setFiltroMarcaInv}
          setFiltroTexto={setFiltroTexto}
        />
      )}

      {tabActiva === 'compras' && (
        <Suspense
          fallback={
            <div className="surface-card p-10 text-center text-xs text-slate-500">
              Cargando módulo de recepción de mercancía...
            </div>
          }
        >
          <ModuloIngresoMercancia
            productos={productos}
            cargarInventario={() => cargarInventario(true)}
            tasaBCV={tasaBCV}
            abrirModalCrear={abrirCrearRepuesto}
          />
        </Suspense>
      )}

      {tabActiva === 'cxc' && (
        <CuentasCobrarTab
          cuentasCobrar={cuentasCobrar}
          cargandoCxC={cargandoCxC}
          totalDeudaPendiente={totalDeudaPendiente}
          totalAbonado={totalAbonado}
          tasaBCV={tasaBCV}
          abrirRegistrarAbono={abrirRegistrarAbono}
          modalAbonoAbierto={modalAbonoAbierto}
          setModalAbonoAbierto={setModalAbonoAbierto}
          cuentaActivaAbono={cuentaActivaAbono}
          montoAbonoUSD={montoAbonoUSD}
          setMontoAbonoUSD={setMontoAbonoUSD}
          metodoAbono={metodoAbono}
          setMetodoAbono={setMetodoAbono}
          guardandoAbono={guardandoAbono}
          confirmarAbono={confirmarAbono}
        />
      )}

      <RepuestoModal
        abierto={modalRepuestoAbierto}
        onClose={() => setModalRepuestoAbierto(false)}
        repuestoEditandoId={repuestoEditandoId}
        pasoModalRepuesto={pasoModalRepuesto}
        pasos={PASOS_MODAL_REPUESTO}
        saltarAPasoModal={saltarAPasoModal}
        avanzarPasoModal={avanzarPasoModal}
        retrocederPasoModal={retrocederPasoModal}
        guardarRepuesto={guardarRepuesto}
        guardandoRepuesto={guardandoRepuesto}
        formRepuesto={formRepuesto}
        setFormRepuesto={setFormRepuesto}
        listaLineas={listaLineas}
        sublineasDisponiblesModal={sublineasDisponiblesModal}
        listaMarcas={listaMarcas}
        listaModelos={listaModelos}
        agregarNuevaLinea={agregarNuevaLinea}
        agregarNuevaSublinea={agregarNuevaSublinea}
        agregarNuevaMarca={agregarNuevaMarca}
        agregarNuevoModelo={agregarNuevoModelo}
        fotoActualMostrada={fotoActualMostrada}
        esFotoPersonalizada={esFotoPersonalizada}
        isDraggingFoto={isDraggingFoto}
        setIsDraggingFoto={setIsDraggingFoto}
        fileInputFotoRef={fileInputFotoRef}
        procesarArchivoImagen={procesarArchivoImagen}
        handleCostoChange={handleCostoChange}
        handleMargenChange={handleMargenChange}
        handlePrecioVentaChange={handlePrecioVentaChange}
        tasaBCV={tasaBCV}
        mostrarNotificacion={mostrarNotificacion}
      />

      <AdminModals
        modalRapido={modalRapido}
        setModalRapido={setModalRapido}
        lineaActivaMaster={lineaActivaMaster}
        setLineaActivaMaster={setLineaActivaMaster}
        agregarNuevaLinea={agregarNuevaLinea}
        agregarNuevaSublinea={agregarNuevaSublinea}
        agregarNuevaMarca={agregarNuevaMarca}
        agregarNuevoModelo={agregarNuevoModelo}
        mostrarNotificacion={mostrarNotificacion}
        modalEditar={modalEditar}
        setModalEditar={setModalEditar}
        confirmarEdicion={confirmarEdicion}
        modalConfirmarEliminar={modalConfirmarEliminar}
        setModalConfirmarEliminar={setModalConfirmarEliminar}
        ejecutarEliminacion={ejecutarEliminacion}
      />

      <ConfirmModal
        open={!!repuestoAEliminar}
        title="¿Eliminar este repuesto?"
        description="Se eliminará permanentemente del catálogo de inventario."
        details={
          repuestoAEliminar
            ? [
                { label: 'Código', value: repuestoAEliminar.codigo_corto },
                { label: 'Descripción', value: repuestoAEliminar.descripcion },
                { label: 'Stock actual', value: `${repuestoAEliminar.stock ?? 0} un.` },
              ]
            : []
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={eliminandoRepuesto}
        onConfirm={confirmarEliminacionRepuesto}
        onCancel={() => setRepuestoAEliminar(null)}
      />

      {repuestoParaZoom && (
        <ModalZoomRepuesto
          repuesto={repuestoParaZoom}
          tasaBCV={tasaBCV}
          onCerrar={() => setRepuestoParaZoom(null)}
        />
      )}
    </div>
  );
}

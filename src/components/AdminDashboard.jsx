import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Package, 
  Truck, 
  CreditCard, 
  Plus, 
  Search, 
  Edit, 
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
  User, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Boxes,
  Calendar,
  Layers,
  ArrowUpRight,
  Tag,
  Car,
  Filter,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Eye,
  Camera,
  CameraOff,
  Upload,
  Image as ImageIcon,
  ClipboardPaste,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { formatUSD, formatVES, formatNumber, parseVenezuelanNumber } from '../lib/formatters';
import { obtenerSublineasParaLinea, obtenerLineaParaSublinea } from '../lib/clasificacionesRepuestos';
import { obtenerFotoRepuesto, FOTOS_CATALOGO } from '../lib/repuestosImagenes';
import ModalZoomRepuesto from './ModalZoomRepuesto';
import ModuloIngresoMercancia from './ModuloIngresoMercancia';
import { obtenerMarcaVehiculo, desglosarModelosVehiculo, contarRepuestosPorModelo } from '../lib/vehiculosMarcas';

// Componente Reutilizable de Control de Paginación Holgada
function ControlPaginacion({
  paginaActual,
  totalPaginas,
  totalItems,
  itemsPorPagina,
  onChangePagina,
  onChangeItemsPorPagina,
  opcionesItemsPorPagina = [12, 16, 24, 32, 'todos'],
  colorTema = 'purple',
  etiquetaItem = 'elementos'
}) {
  if (totalItems === 0) return null;

  const esTodos = itemsPorPagina === 'todos';
  const numPorPagina = esTodos ? totalItems : parseInt(itemsPorPagina, 10) || 16;
  const inicio = esTodos ? (totalItems > 0 ? 1 : 0) : Math.min((paginaActual - 1) * numPorPagina + 1, totalItems);
  const fin = esTodos ? totalItems : Math.min(paginaActual * numPorPagina, totalItems);

  // Paleta temática
  const temaColores = {
    purple: {
      activeBg: 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500/50',
      activeText: 'text-purple-600 dark:text-purple-400',
      hoverBg: 'hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400',
      borderRing: 'focus:border-purple-500 focus:ring-purple-500/20'
    },
    emerald: {
      activeBg: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/50',
      activeText: 'text-emerald-600 dark:text-emerald-400',
      hoverBg: 'hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
      borderRing: 'focus:border-emerald-500 focus:ring-emerald-500/20'
    },
    red: {
      activeBg: 'bg-red-600 text-white shadow-sm ring-1 ring-red-500/50',
      activeText: 'text-red-600 dark:text-red-400',
      hoverBg: 'hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400',
      borderRing: 'focus:border-red-500 focus:ring-red-500/20'
    },
    blue: {
      activeBg: 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/50',
      activeText: 'text-blue-600 dark:text-blue-400',
      hoverBg: 'hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400',
      borderRing: 'focus:border-blue-500 focus:ring-blue-500/20'
    }
  }[colorTema] || {
    activeBg: 'bg-purple-600 text-white shadow-sm',
    activeText: 'text-purple-600',
    hoverBg: 'hover:bg-purple-500/10 hover:text-purple-600',
    borderRing: 'focus:border-purple-500'
  };

  // Generar lista de números con elipsis inteligente
  const generarPaginas = () => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const paginas = [1];
    if (paginaActual > 3) {
      paginas.push('...');
    }
    const start = Math.max(2, paginaActual - 1);
    const end = Math.min(totalPaginas - 1, paginaActual + 1);
    for (let i = start; i <= end; i++) {
      paginas.push(i);
    }
    if (paginaActual < totalPaginas - 2) {
      paginas.push('...');
    }
    paginas.push(totalPaginas);
    return paginas;
  };

  const paginasMostradas = generarPaginas();

  return (
    <div className="glass-card rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Información del rango */}
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
        <span>Mostrando</span>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {inicio} - {fin}
        </span>
        <span>de</span>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {totalItems}
        </span>
        <span>{etiquetaItem}</span>
      </div>

      {/* Controles de Navegación de Páginas */}
      <div className="flex items-center gap-1">
        {/* Ir a Primera */}
        <button
          type="button"
          onClick={() => onChangePagina(1)}
          disabled={paginaActual <= 1 || esTodos}
          title="Primera página"
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Anterior */}
        <button
          type="button"
          onClick={() => onChangePagina(Math.max(1, paginaActual - 1))}
          disabled={paginaActual <= 1 || esTodos}
          title="Página anterior"
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 mx-1">
          {esTodos ? (
            <span className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs ${temaColores.activeBg}`}>
              Todos
            </span>
          ) : (
            paginasMostradas.map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold select-none">
                    ...
                  </span>
                );
              }
              const esActiva = num === paginaActual;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChangePagina(num)}
                  className={`min-w-[34px] h-8 px-2 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
                    esActiva
                      ? temaColores.activeBg
                      : `border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 ${temaColores.hoverBg}`
                  }`}
                >
                  {num}
                </button>
              );
            })
          )}
        </div>

        {/* Siguiente */}
        <button
          type="button"
          onClick={() => onChangePagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual >= totalPaginas || esTodos}
          title="Página siguiente"
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ir a Última */}
        <button
          type="button"
          onClick={() => onChangePagina(totalPaginas)}
          disabled={paginaActual >= totalPaginas || esTodos}
          title="Última página"
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de Items por Página */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          Mostrar:
        </span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200 dark:border-white/10">
          {opcionesItemsPorPagina.map((opcion) => {
            const esActiva = itemsPorPagina === opcion;
            return (
              <button
                key={String(opcion)}
                type="button"
                onClick={() => {
                  onChangeItemsPorPagina(opcion);
                  onChangePagina(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  esActiva
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opcion === 'todos' ? 'Todos' : opcion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Normaliza textos para búsqueda ignorando acentos/tildes y mayúsculas
 * (ej: "baterías" -> "baterias", "Dirección" -> "direccion", "Eléctrico" -> "electrico")
 */
export const normalizarBusqueda = (str) => {
  if (str == null) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const defaultGetLabel = (item) => (item != null ? String(item) : '');
const defaultGetFilterText = (item) => (item != null ? String(item) : '');
const defaultCreateNewLabel = (query) => `Crear "${query}"`;

/**
 * Componente Selector Inteligente Desplegable y Escribible (Combobox con Buscador en tiempo real)
 * Permite al usuario buscar escribiendo directamente, seleccionar con clic o Enter, y crear nuevos elementos al vuelo.
 * Totalmente insensible a acentos/tildes y mayúsculas.
 */
function SearchableComboboxModal({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Buscar o escribir...',
  getLabel = defaultGetLabel,
  getFilterText = defaultGetFilterText,
  onCreateNew,
  createNewLabel = defaultCreateNewLabel,
  required = false,
  uppercase = false
}) {
  const [abierto, setAbierto] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState(() => (value ? (getLabel ? getLabel(value) : value) : ''));
  const [haTipeado, setHaTipeado] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;

  const getFilterTextRef = useRef(getFilterText);
  getFilterTextRef.current = getFilterText;

  // Sincronizar el texto mostrado SOLAMENTE cuando cambia el valor externo y el usuario no está tipeando
  useEffect(() => {
    if (!haTipeado) {
      setFiltroTexto(value ? (getLabelRef.current ? getLabelRef.current(value) : value) : '');
    }
  }, [value]);

  // Cerrar al hacer clic fuera del componente y consolidar la selección
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);

        if (haTipeado) {
          const textoLimpio = filtroTexto.trim();
          if (!textoLimpio) {
            onChange('');
            setFiltroTexto('');
          } else {
            const qNorm = normalizarBusqueda(textoLimpio);
            // Buscar coincidencia exacta insensible a mayúsculas y acentos
            const match = options.find(
              (opt) =>
                normalizarBusqueda(opt) === qNorm ||
                (getLabelRef.current && normalizarBusqueda(getLabelRef.current(opt)) === qNorm)
            );
            if (match) {
              onChange(match);
              setFiltroTexto(getLabelRef.current ? getLabelRef.current(match) : match);
            } else {
              // Si no coincide exactamente con ninguna opción existente, restaurar el valor anterior sin crear basura
              setFiltroTexto(value ? (getLabelRef.current ? getLabelRef.current(value) : value) : '');
            }
          }
          setHaTipeado(false);
        } else {
          setFiltroTexto(value ? (getLabelRef.current ? getLabelRef.current(value) : value) : '');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, haTipeado, filtroTexto, options, uppercase, onCreateNew]);

  // Opciones filtradas en tiempo real mientras el usuario escribe (insensible a acentos)
  const opcionesFiltradas = useMemo(() => {
    if (!haTipeado) return options;
    const qNorm = normalizarBusqueda(filtroTexto);
    if (!qNorm) return options;

    const palabras = qNorm.split(/\s+/).filter(Boolean);
    return options.filter((opt) => {
      const fText = normalizarBusqueda(getFilterTextRef.current(opt));
      const lText = normalizarBusqueda(getLabelRef.current(opt));
      const rawText = normalizarBusqueda(opt);
      return palabras.every(
        (palabra) =>
          fText.includes(palabra) ||
          lText.includes(palabra) ||
          rawText.includes(palabra)
      );
    });
  }, [options, filtroTexto, haTipeado]);

  const seleccionarOpcion = (opt) => {
    onChange(opt);
    setFiltroTexto(getLabelRef.current ? getLabelRef.current(opt) : opt);
    setHaTipeado(false);
    setAbierto(false);
  };

  const handleInputChange = (e) => {
    const val = uppercase ? e.target.value.toUpperCase() : e.target.value;
    setFiltroTexto(val);
    setHaTipeado(true);
    setAbierto(true);
  };

  const handleCrearNuevo = (nuevoTexto) => {
    const textoFinal = (nuevoTexto || filtroTexto).trim();
    if (!textoFinal) return;
    if (onCreateNew) {
      const creado = onCreateNew(uppercase ? textoFinal.toUpperCase() : textoFinal);
      if (creado) {
        onChange(creado);
        setFiltroTexto(getLabelRef.current ? getLabelRef.current(creado) : creado);
      }
    }
    setHaTipeado(false);
    setAbierto(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (opcionesFiltradas.length > 0) {
        seleccionarOpcion(opcionesFiltradas[0]);
      } else if (onCreateNew && filtroTexto.trim()) {
        handleCrearNuevo(filtroTexto.trim());
      } else {
        setAbierto(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAbierto(false);
      setHaTipeado(false);
      setFiltroTexto(value ? (getLabelRef.current ? getLabelRef.current(value) : value) : '');
    }
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
    setFiltroTexto('');
    setHaTipeado(false);
    setAbierto(true);
    if (inputRef.current) inputRef.current.focus();
  };

  // Verificar si ya existe una opción con exactamente el mismo nombre (insensible a acentos)
  const esCoincidenciaExacta = useMemo(() => {
    const qNorm = normalizarBusqueda(filtroTexto);
    if (!qNorm) return false;
    return options.some(
      (opt) =>
        normalizarBusqueda(opt) === qNorm ||
        (getLabelRef.current && normalizarBusqueda(getLabelRef.current(opt)) === qNorm)
    );
  }, [filtroTexto, options]);

  return (
    <div className={`relative ${abierto ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[10px] flex items-center justify-between">
          <span>{label}</span>
          {value ? (
            <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Seleccionado
            </span>
          ) : required ? (
            <span className="text-[9px] font-mono text-amber-500">
              Obligatorio
            </span>
          ) : null}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Ícono de búsqueda indicando que es un buscador interactivo */}
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={filtroTexto}
          onChange={handleInputChange}
          onFocus={() => {
            setAbierto(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-8.5 pl-8 pr-14 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-[#070A12] dark:hover:bg-[#0B0F19] dark:focus:bg-[#0B0F19] border rounded-lg font-bold text-xs text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
            abierto
              ? 'border-red-500 ring-2 ring-red-500/20'
              : 'border-slate-200 dark:border-white/10 focus:border-red-500'
          }`}
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {filtroTexto ? (
            <button
              type="button"
              onClick={limpiar}
              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
              title="Borrar selección"
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
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            title={abierto ? 'Cerrar opciones' : 'Desplegar opciones'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                abierto ? 'rotate-180 text-red-500' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menú flotante con resultados filtrados en tiempo real */}
      {abierto && (
        <div className="absolute z-[70] left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl py-1 text-xs divide-y divide-slate-100 dark:divide-white/[0.04] backdrop-blur-md animate-in fade-in duration-100">
          
          {/* Opciones coincidentes filtradas - SIEMPRE DE PRIMERO */}
          {opcionesFiltradas.length > 0 ? (
            <>
              {opcionesFiltradas.map((opt) => {
                const labelOpt = getLabelRef.current ? getLabelRef.current(opt) : opt;
                const estaSeleccionado = value && (value.trim().toLowerCase() === opt.trim().toLowerCase());

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => seleccionarOpcion(opt)}
                    className={`w-full text-left px-2.5 py-2 font-bold flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors ${
                      estaSeleccionado
                        ? 'text-red-600 dark:text-red-400 bg-red-500/[0.08]'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{labelOpt}</span>
                    {estaSeleccionado && <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                  </button>
                );
              })}

              {/* Botón secundario al final de la lista si lo escrito no coincide exactamente */}
              {onCreateNew && haTipeado && filtroTexto.trim() && !esCoincidenciaExacta && (
                <button
                  type="button"
                  onClick={() => handleCrearNuevo(filtroTexto.trim())}
                  className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/20 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Plus className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span>{createNewLabel(filtroTexto.trim())}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-normal">
                    (Nuevo)
                  </span>
                </button>
              )}
            </>
          ) : (
            <div className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">
              <p className="text-xs">No se encontraron resultados para "{filtroTexto}"</p>
              {onCreateNew && filtroTexto.trim() && (
                <button
                  type="button"
                  onClick={() => handleCrearNuevo(filtroTexto.trim())}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {createNewLabel(filtroTexto.trim())}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ tasaBCV, onVolverAlMostrador }) {
  const [tabActiva, setTabActiva] = useState('inventario'); // 'inventario' | 'clasificaciones' | 'compras' | 'cxc'

  // =========================================================================
  // TAB 1: GESTIÓN DE INVENTARIO (CRUD)
  // =========================================================================
  const [productos, setProductos] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroLineaInv, setFiltroLineaInv] = useState('');
  const [filtroSublineaInv, setFiltroSublineaInv] = useState('');
  const [filtroMarcaInv, setFiltroMarcaInv] = useState('');
  const [repuestoParaZoom, setRepuestoParaZoom] = useState(null);
  
  // Modal de Crear / Editar Repuesto
  const [modalRepuestoAbierto, setModalRepuestoAbierto] = useState(false);
  const [repuestoEditandoId, setRepuestoEditandoId] = useState(null);
  const [guardandoRepuesto, setGuardandoRepuesto] = useState(false);
  const [notifCRUD, setNotifCRUD] = useState(null);

  // Formulario de Repuesto (Esquema completo con Línea, Sublínea, Medidas, Foto y Precios)
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
    ubicacion_fisica: ''
  });

  // Estados para creación rápida de nuevas clasificaciones en modal
  const [modoNuevaLinea, setModoNuevaLinea] = useState(false);
  const [nuevaLineaInput, setNuevaLineaInput] = useState('');
  const [modoNuevaSublinea, setModoNuevaSublinea] = useState(false);
  const [nuevaSublineaInput, setNuevaSublineaInput] = useState('');
  const [modoNuevaMarca, setModoNuevaMarca] = useState(false);
  const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
  const [modoNuevoModelo, setModoNuevoModelo] = useState(false);
  const [nuevoModeloInput, setNuevoModeloInput] = useState('');

  // Estados para nueva clasificación en la pestaña dedicada
  const [inputTabNuevaLinea, setInputTabNuevaLinea] = useState('');
  const [inputTabNuevaSublinea, setInputTabNuevaSublinea] = useState('');
  const [inputTabNuevaMarca, setInputTabNuevaMarca] = useState('');
  const [inputTabNuevoModelo, setInputTabNuevoModelo] = useState('');

  // Filtros y selección activa para vistas holgadas e independientes de clasificaciones
  const [lineaActivaMaster, setLineaActivaMaster] = useState('Tren Delantero y Dirección');
  const [busquedaLineas, setBusquedaLineas] = useState('');
  const [busquedaMarcas, setBusquedaMarcas] = useState('');
  const [busquedaModelos, setBusquedaModelos] = useState('');
  const [busquedaSublineas, setBusquedaSublineas] = useState('');

  // Control de paginación independiente para Vistas Maestras e Inventario
  const [paginaModelos, setPaginaModelos] = useState(1);
  const [itemsPorPaginaModelos, setItemsPorPaginaModelos] = useState(16);

  const [paginaMarcas, setPaginaMarcas] = useState(1);
  const [itemsPorPaginaMarcas, setItemsPorPaginaMarcas] = useState(16);

  const [paginaInventario, setPaginaInventario] = useState(1);
  const [itemsPorPaginaInventario, setItemsPorPaginaInventario] = useState(25);

  // Reiniciar a página 1 automáticamente cuando cambien los filtros o búsquedas
  useEffect(() => {
    setPaginaModelos(1);
  }, [busquedaModelos]);

  useEffect(() => {
    setPaginaMarcas(1);
  }, [busquedaMarcas]);

  useEffect(() => {
    setPaginaInventario(1);
  }, [filtroTexto, filtroLineaInv, filtroSublineaInv, filtroMarcaInv]);

  // Referencias a inputs y rastreo de item recién creado para feedback inmediato
  const inputLineaRef = useRef(null);
  const inputSublineaRef = useRef(null);
  const inputMarcaRef = useRef(null);
  const inputModeloRef = useRef(null);
  const [ultimoItemCreado, setUltimoItemCreado] = useState(null);

  // Control de navegación por pasos (Stepper Wizard) y foto del modal de repuestos
  const [pasoModalRepuesto, setPasoModalRepuesto] = useState(1); // 1: Clasificación, 2: Identificación, 3: Foto, 4: Precios & Stock
  const [isDraggingFoto, setIsDraggingFoto] = useState(false);
  const fileInputFotoRef = useRef(null);

  const PASOS_MODAL_REPUESTO = [
    { id: 1, label: 'Clasificación', hint: 'Línea y vehículo', icon: Layers },
    { id: 2, label: 'Identificación', hint: 'Descripción y códigos', icon: Tag },
    { id: 3, label: 'Fotografía', hint: 'Catálogo o archivo', icon: Camera },
    { id: 4, label: 'Precios & Stock', hint: 'Costo, venta y almacén', icon: DollarSign },
  ];

  const validarPasoActual = (paso) => {
    if (paso === 1) {
      if (!formRepuesto.linea?.trim()) {
        mostrarNotificacion('Por favor selecciona la Línea o Sistema del repuesto para continuar.', 'warning');
        return false;
      }
      if (!formRepuesto.marca_producto?.trim()) {
        mostrarNotificacion('Por favor indica la Marca del repuesto.', 'warning');
        return false;
      }
      if (!formRepuesto.modelo_vehiculo?.trim()) {
        mostrarNotificacion('Por favor selecciona o escribe el Vehículo compatible.', 'warning');
        return false;
      }
      return true;
    }
    if (paso === 2) {
      const codCorto = (formRepuesto.codigo_corto || '').trim();
      const refOEM = (formRepuesto.referencia || '').trim();
      const desc = (formRepuesto.descripcion || '').trim();

      if (!desc) {
        mostrarNotificacion('Por favor ingresa la descripción del repuesto.', 'warning');
        return false;
      }
      if (!codCorto && !refOEM) {
        mostrarNotificacion('Debes ingresar al menos el Código Corto o la Referencia OEM.', 'warning');
        return false;
      }
      return true;
    }
    return true;
  };

  const avanzarPasoModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (validarPasoActual(pasoModalRepuesto)) {
      setPasoModalRepuesto(prev => Math.min(4, prev + 1));
    }
  };

  const retrocederPasoModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPasoModalRepuesto(prev => Math.max(1, prev - 1));
  };

  const saltarAPasoModal = (destinoId) => {
    if (destinoId > pasoModalRepuesto) {
      if (!validarPasoActual(pasoModalRepuesto)) return;
    }
    setPasoModalRepuesto(destinoId);
  };

  // Modal universal para creación o registro rápido de clasificaciones (Línea, Sublínea, Marca, Modelo)
  const [modalRapido, setModalRapido] = useState({
    abierto: false,
    tipo: 'linea', // 'linea' | 'sublinea' | 'marca' | 'modelo'
    valor: '',
    lineaPadre: ''
  });

  // Modal para editar nombre de cualquier clasificación
  const [modalEditar, setModalEditar] = useState({
    abierto: false,
    tipo: 'linea', // 'linea' | 'sublinea' | 'marca' | 'modelo'
    nombreActual: '',
    lineaPadre: '',
    nuevoNombre: '',
    conteoAfectados: 0
  });

  // Modal de confirmación segura para eliminar clasificaciones
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState({
    abierto: false,
    tipo: 'linea', // 'linea' | 'sublinea' | 'marca' | 'modelo'
    nombre: '',
    lineaPadre: '',
    conteoAfectados: 0
  });

  // Persistencia local para clasificaciones personalizadas
  const [lineasAdicionales, setLineasAdicionales] = useState(() => {
    try {
      const saved = localStorage.getItem('familycar_custom_lineas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sublineasAdicionales, setSublineasAdicionales] = useState(() => {
    try {
      const saved = localStorage.getItem('familycar_custom_sublineas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [marcasAdicionales, setMarcasAdicionales] = useState(() => {
    try {
      const saved = localStorage.getItem('familycar_custom_marcas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [modelosAdicionales, setModelosAdicionales] = useState(() => {
    try {
      const saved = localStorage.getItem('familycar_custom_modelos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistencia local para clasificaciones eliminadas (permite eliminar incluso las base)
  const [lineasEliminadas, setLineasEliminadas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_eliminadas_lineas');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [sublineasEliminadas, setSublineasEliminadas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_eliminadas_sublineas');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [marcasEliminadas, setMarcasEliminadas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_eliminadas_marcas');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [modelosEliminadas, setModelosEliminadas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_eliminadas_modelos');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  // Persistencia local para renombres de clasificaciones
  const [renombresLineas, setRenombresLineas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_renombres_lineas');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [renombresSublineas, setRenombresSublineas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_renombres_sublineas');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [renombresMarcas, setRenombresMarcas] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_renombres_marcas');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [renombresModelos, setRenombresModelos] = useState(() => {
    try {
      const s = localStorage.getItem('familycar_renombres_modelos');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('familycar_custom_lineas', JSON.stringify(lineasAdicionales));
  }, [lineasAdicionales]);

  useEffect(() => {
    localStorage.setItem('familycar_custom_sublineas', JSON.stringify(sublineasAdicionales));
  }, [sublineasAdicionales]);

  useEffect(() => {
    localStorage.setItem('familycar_custom_marcas', JSON.stringify(marcasAdicionales));
  }, [marcasAdicionales]);

  useEffect(() => {
    localStorage.setItem('familycar_custom_modelos', JSON.stringify(modelosAdicionales));
  }, [modelosAdicionales]);

  useEffect(() => {
    localStorage.setItem('familycar_eliminadas_lineas', JSON.stringify(lineasEliminadas));
  }, [lineasEliminadas]);
  useEffect(() => {
    localStorage.setItem('familycar_eliminadas_sublineas', JSON.stringify(sublineasEliminadas));
  }, [sublineasEliminadas]);
  useEffect(() => {
    localStorage.setItem('familycar_eliminadas_marcas', JSON.stringify(marcasEliminadas));
  }, [marcasEliminadas]);
  useEffect(() => {
    localStorage.setItem('familycar_eliminadas_modelos', JSON.stringify(modelosEliminadas));
  }, [modelosEliminadas]);

  useEffect(() => {
    localStorage.setItem('familycar_renombres_lineas', JSON.stringify(renombresLineas));
  }, [renombresLineas]);
  useEffect(() => {
    localStorage.setItem('familycar_renombres_sublineas', JSON.stringify(renombresSublineas));
  }, [renombresSublineas]);
  useEffect(() => {
    localStorage.setItem('familycar_renombres_marcas', JSON.stringify(renombresMarcas));
  }, [renombresMarcas]);
  useEffect(() => {
    localStorage.setItem('familycar_renombres_modelos', JSON.stringify(renombresModelos));
  }, [renombresModelos]);

  const LINEAS_BASE = [
    'Tren Delantero y Dirección', 'Suspensión', 'Motor', 'Frenos', 
    'Eléctrico y Encendido', 'Tracción y Transmisión', 'Refrigeración', 
    'Carrocería', 'Accesorios', 'General'
  ];

  const MARCAS_BASE = [
    '555', 'AISIN', 'ATS', 'ATS PREMIUM', 'BOSCH', 'CHEVROLET GENUINE', 
    'DENSO', 'FORD MOTORCRAFT', 'GABRIEL', 'GATES', 'GENÉRICO', 'MITSUKI', 
    'NGK', 'TOYOTA GENUINE', 'VALVOLINE', 'WAGNER'
  ];

  const MODELOS_BASE = [
    '4Runner', 'Corolla', 'Hilux', 'Yaris', 'Fortuner', 'Meru', 'Prado', 'Camry',
    'Aveo', 'Optra', 'Spark', 'Silverado', 'Cruze', 'Corsa', 'Blazer',
    'Fiesta', 'Explorer', 'EcoSport', 'F-150', 'F-250',
    'Accent', 'Elantra', 'Getz', 'Tucson', 'Santa Fe',
    'Arauca', 'Orinoco', 'X1', 'Tiggo',
    'Lancer', 'Montero', 'Signo',
    'Civic', 'Accord', 'CR-V'
  ];

  // Listas deduplicadas combinando base + BD Supabase + personalizadas (con renombres y eliminaciones)
  const listaLineas = useMemo(() => {
    const raw = Array.from(
      new Set([
        ...LINEAS_BASE,
        ...productos.map(p => (p.linea || '').trim()).filter(Boolean),
        ...lineasAdicionales,
        (formRepuesto.linea || '').trim()
      ])
    )
      .map(l => renombresLineas[l] || l)
      .filter(l => Boolean(l) && l.toLowerCase() !== 'tren delantero' && !lineasEliminadas.map(e => e.toLowerCase()).includes(l.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (ultimoItemCreado?.tipo === 'linea' && raw.some(l => l.toLowerCase() === ultimoItemCreado.valor.toLowerCase())) {
      const match = raw.find(l => l.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter(l => l.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, lineasAdicionales, formRepuesto.linea, ultimoItemCreado, renombresLineas, lineasEliminadas]);

  const listaMarcas = useMemo(() => {
    const raw = Array.from(
      new Set([
        ...MARCAS_BASE,
        ...productos.map(p => (p.marca_producto || p.marca || '').trim().toUpperCase()).filter(Boolean),
        ...marcasAdicionales,
        (formRepuesto.marca_producto || '').trim().toUpperCase()
      ])
    )
      .map(m => renombresMarcas[m] || m)
      .filter(m => Boolean(m) && !marcasEliminadas.map(e => e.toLowerCase()).includes(m.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (ultimoItemCreado?.tipo === 'marca' && raw.some(m => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase())) {
      const match = raw.find(m => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter(m => m.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, marcasAdicionales, formRepuesto.marca_producto, ultimoItemCreado, renombresMarcas, marcasEliminadas]);

  const listaModelos = useMemo(() => {
    // Desglosar modelos individuales evitando tarjetas duplicadas compuestas (ej: "4Runner / Meru / Prado" -> ["4Runner", "Meru", "Prado"])
    const modelosDeProductos = productos.flatMap(p => desglosarModelosVehiculo(p.modelo_vehiculo));
    const modelosDeFormulario = desglosarModelosVehiculo(formRepuesto.modelo_vehiculo);

    const raw = Array.from(
      new Set([
        ...MODELOS_BASE,
        ...modelosDeProductos,
        ...modelosAdicionales.flatMap(m => desglosarModelosVehiculo(m)),
        ...modelosDeFormulario
      ])
    )
      .map(m => renombresModelos[m] || m)
      .filter(m => Boolean(m) && !modelosEliminadas.map(e => e.toLowerCase()).includes(m.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (ultimoItemCreado?.tipo === 'modelo' && raw.some(m => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase())) {
      const match = raw.find(m => m.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [match, ...raw.filter(m => m.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())];
    }
    return raw;
  }, [productos, modelosAdicionales, formRepuesto.modelo_vehiculo, ultimoItemCreado, renombresModelos, modelosEliminadas]);

  const listaSublineas = useMemo(() => {
    return obtenerSublineasParaLinea('', productos, sublineasAdicionales);
  }, [productos, sublineasAdicionales]);

  // Contadores reactivos de repuestos por clasificación
  const conteoPorLinea = useMemo(() => {
    const map = {};
    productos.forEach(p => {
      const l = renombresLineas[(p.linea || 'Sin Línea').trim()] || (p.linea || 'Sin Línea').trim();
      map[l] = (map[l] || 0) + 1;
    });
    return map;
  }, [productos, renombresLineas]);

  const conteoPorMarca = useMemo(() => {
    const map = {};
    productos.forEach(p => {
      const m = renombresMarcas[(p.marca_producto || p.marca || 'Sin Marca').trim().toUpperCase()] || (p.marca_producto || p.marca || 'Sin Marca').trim().toUpperCase();
      map[m] = (map[m] || 0) + 1;
    });
    return map;
  }, [productos, renombresMarcas]);

  const conteoPorModelo = useMemo(() => {
    const map = {};
    listaModelos.forEach(m => {
      map[m] = contarRepuestosPorModelo(m, productos);
    });
    return map;
  }, [listaModelos, productos]);

  const conteoPorSublinea = useMemo(() => {
    const map = {};
    productos.forEach(p => {
      const raw = (p.sublinea || 'General').trim();
      const s = renombresSublineas[raw] || raw;
      map[s] = (map[s] || 0) + 1;
      map[s.toLowerCase()] = (map[s.toLowerCase()] || 0) + 1;
      map[raw] = (map[raw] || 0) + 1;
      map[raw.toLowerCase()] = (map[raw.toLowerCase()] || 0) + 1;
    });
    return map;
  }, [productos, renombresSublineas]);

  // Sublíneas dinámicas para la línea maestra seleccionada en la vista holgada
  const sublineasParaMaster = useMemo(() => {
    const subs = obtenerSublineasParaLinea(lineaActivaMaster, productos, sublineasAdicionales);
    const renombradas = subs.map(s => renombresSublineas[s] || s);
    const noEliminadas = renombradas.filter(s => Boolean(s) && !sublineasEliminadas.map(e => e.toLowerCase()).includes(s.toLowerCase()));
    let filtradas = noEliminadas;
    if (busquedaSublineas.trim()) {
      const q = busquedaSublineas.toLowerCase();
      filtradas = noEliminadas.filter(s => s.toLowerCase().includes(q));
    }
    // Si hay un item recién creado para este sistema, colocarlo al principio para feedback visual instantáneo
    if (ultimoItemCreado?.tipo === 'sublinea' && filtradas.some(s => s.toLowerCase() === ultimoItemCreado.valor.toLowerCase())) {
      const match = filtradas.find(s => s.toLowerCase() === ultimoItemCreado.valor.toLowerCase());
      return [
        match,
        ...filtradas.filter(s => s.toLowerCase() !== ultimoItemCreado.valor.toLowerCase())
      ];
    }
    return filtradas;
  }, [lineaActivaMaster, productos, sublineasAdicionales, busquedaSublineas, ultimoItemCreado, renombresSublineas, sublineasEliminadas]);

  // Sistemas Principales (Líneas) filtrados por el buscador
  const lineasFiltradas = useMemo(() => {
    let filtradas = listaLineas;
    if (busquedaLineas.trim()) {
      const q = busquedaLineas.toLowerCase().trim();
      filtradas = listaLineas.filter(l => l.toLowerCase().includes(q));
    }
    if (ultimoItemCreado?.tipo === 'linea' && filtradas.includes(ultimoItemCreado.valor)) {
      return [
        ultimoItemCreado.valor,
        ...filtradas.filter(l => l !== ultimoItemCreado.valor)
      ];
    }
    return filtradas;
  }, [listaLineas, busquedaLineas, ultimoItemCreado]);

  // Marcas filtradas por el buscador holgado
  const marcasFiltradas = useMemo(() => {
    let filtradas = listaMarcas;
    if (busquedaMarcas.trim()) {
      const q = busquedaMarcas.toLowerCase();
      filtradas = listaMarcas.filter(m => m.toLowerCase().includes(q));
    }
    if (ultimoItemCreado?.tipo === 'marca' && filtradas.includes(ultimoItemCreado.valor)) {
      return [
        ultimoItemCreado.valor,
        ...filtradas.filter(m => m !== ultimoItemCreado.valor)
      ];
    }
    return filtradas;
  }, [listaMarcas, busquedaMarcas, ultimoItemCreado]);

  // Modelos filtrados por el buscador holgado (por modelo o por fabricante automotriz)
  const modelosFiltrados = useMemo(() => {
    let filtrados = listaModelos;
    if (busquedaModelos.trim()) {
      const q = busquedaModelos.toLowerCase();
      filtrados = listaModelos.filter(m => {
        const marca = obtenerMarcaVehiculo(m).toLowerCase();
        return m.toLowerCase().includes(q) || marca.includes(q);
      });
    }
    if (ultimoItemCreado?.tipo === 'modelo' && filtrados.includes(ultimoItemCreado.valor)) {
      return [
        ultimoItemCreado.valor,
        ...filtrados.filter(m => m !== ultimoItemCreado.valor)
      ];
    }
    return filtrados;
  }, [listaModelos, busquedaModelos, ultimoItemCreado]);

  // Modelos paginados holgados
  const totalPaginasModelos = Math.max(1, Math.ceil(modelosFiltrados.length / (itemsPorPaginaModelos === 'todos' ? (modelosFiltrados.length || 1) : (parseInt(itemsPorPaginaModelos, 10) || 16))));
  const modelosPaginados = useMemo(() => {
    if (itemsPorPaginaModelos === 'todos') return modelosFiltrados;
    const num = parseInt(itemsPorPaginaModelos, 10) || 16;
    const inicio = (paginaModelos - 1) * num;
    return modelosFiltrados.slice(inicio, inicio + num);
  }, [modelosFiltrados, paginaModelos, itemsPorPaginaModelos]);

  // Marcas paginadas holgadas
  const totalPaginasMarcas = Math.max(1, Math.ceil(marcasFiltradas.length / (itemsPorPaginaMarcas === 'todos' ? (marcasFiltradas.length || 1) : (parseInt(itemsPorPaginaMarcas, 10) || 16))));
  const marcasPaginadas = useMemo(() => {
    if (itemsPorPaginaMarcas === 'todos') return marcasFiltradas;
    const num = parseInt(itemsPorPaginaMarcas, 10) || 16;
    const inicio = (paginaMarcas - 1) * num;
    return marcasFiltradas.slice(inicio, inicio + num);
  }, [marcasFiltradas, paginaMarcas, itemsPorPaginaMarcas]);

  // Disparador de notificaciones toast flotantes garantizadas
  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotifCRUD({ mensaje, tipo });
    setTimeout(() => {
      setNotifCRUD(null);
    }, 4500);
  };

  // Procesador inteligente de fotos locales (comprime en canvas a max 800px WebP/JPEG)
  const procesarArchivoImagen = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      mostrarNotificacion('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 640;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Renderizado nítido optimizado para pantallas retina
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        // Compresión optimizada para mantener Supabase 100% en el plan Free (30-40 KB vs 150 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
        setFormRepuesto(prev => ({ ...prev, imagen_url: dataUrl }));
        mostrarNotificacion('¡Foto del repuesto optimizada y lista para guardar!', 'success');
      };
      img.onerror = () => {
        mostrarNotificacion('No se pudo procesar la imagen seleccionada.', 'error');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Escuchar pegado de imagen directo desde portapapeles (Ctrl + V)
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

  // Foto calculada de manera reactiva y segura para el repuesto activo (por defecto sin foto para evitar guardar erróneas)
  const fotoActualMostrada = useMemo(() => {
    if (!formRepuesto.imagen_url || formRepuesto.imagen_url === 'sin_foto' || formRepuesto.imagen_url === 'none') {
      return null;
    }
    return formRepuesto.imagen_url.trim();
  }, [formRepuesto.imagen_url]);

  const esFotoPersonalizada = Boolean(
    formRepuesto.imagen_url && 
    formRepuesto.imagen_url !== 'sin_foto' && 
    formRepuesto.imagen_url !== 'none'
  );

  // Funciones creadoras reutilizables con feedback visual instantáneo
  const agregarNuevaLinea = (nombre) => {
    const raw = typeof nombre === 'string' ? nombre : (nuevaLineaInput || inputTabNuevaLinea || '');
    const val = raw.trim();
    if (!val) {
      mostrarNotificacion('Por favor escribe el nombre de la línea automotriz en la casilla antes de crearla.', 'warning');
      inputLineaRef.current?.focus();
      return '';
    }
    if (!lineasAdicionales.map(l => l.toLowerCase()).includes(val.toLowerCase())) {
      setLineasAdicionales(prev => [...prev, val]);
    }
    setLineaActivaMaster(val);
    setUltimoItemCreado({ tipo: 'linea', valor: val });
    mostrarNotificacion(`¡Línea "${val}" creada exitosamente! Ha sido seleccionada como sistema activo.`, 'success');
    return val;
  };

  const agregarNuevaSublinea = (nombre, linea = lineaActivaMaster) => {
    const raw = typeof nombre === 'string' ? nombre : (nuevaSublineaInput || inputTabNuevaSublinea || '');
    const val = raw.trim();
    if (!val) {
      mostrarNotificacion(`Por favor escribe el nombre de la pieza para "${linea || 'el sistema'}" en la casilla antes de agregarla.`, 'warning');
      inputSublineaRef.current?.focus();
      return '';
    }
    setSublineasAdicionales(prev => {
      const existe = prev.some(s => (typeof s === 'string' ? s : s?.nombre || '').toLowerCase() === val.toLowerCase());
      if (!existe) {
        return [...prev, { nombre: val, linea: linea || lineaActivaMaster }];
      }
      return prev;
    });
    setUltimoItemCreado({ tipo: 'sublinea', valor: val });
    mostrarNotificacion(`¡Pieza "${val}" agregada con éxito al sistema "${linea || lineaActivaMaster}"!`, 'success');
    return val;
  };

  const agregarNuevaMarca = (nombre) => {
    const raw = typeof nombre === 'string' ? nombre : (nuevaMarcaInput || inputTabNuevaMarca || '');
    const val = raw.trim().toUpperCase();
    if (!val) {
      mostrarNotificacion('Por favor escribe el nombre de la marca en la casilla antes de registrarla.', 'warning');
      inputMarcaRef.current?.focus();
      return '';
    }
    if (!marcasAdicionales.map(m => m.toLowerCase()).includes(val.toLowerCase())) {
      setMarcasAdicionales(prev => [...prev, val]);
    }
    setUltimoItemCreado({ tipo: 'marca', valor: val });
    mostrarNotificacion(`¡Marca "${val}" registrada exitosamente en el catálogo!`, 'success');
    return val;
  };

  const agregarNuevoModelo = (nombre) => {
    const raw = typeof nombre === 'string' ? nombre : (nuevoModeloInput || inputTabNuevoModelo || '');
    const val = raw.trim();
    if (!val) {
      mostrarNotificacion('Por favor escribe el nombre del modelo de vehículo en la casilla antes de registrarlo.', 'warning');
      inputModeloRef.current?.focus();
      return '';
    }
    if (!modelosAdicionales.map(m => m.toLowerCase()).includes(val.toLowerCase())) {
      setModelosAdicionales(prev => [...prev, val]);
    }
    setUltimoItemCreado({ tipo: 'modelo', valor: val });
    mostrarNotificacion(`¡Vehículo "${val}" registrado exitosamente en el catálogo!`, 'success');
    return val;
  };

  // Controladores de Edición Universal
  const abrirModalEditar = (tipo, nombreActual, lineaPadre = '', conteo = 0) => {
    setModalEditar({
      abierto: true,
      tipo,
      nombreActual,
      lineaPadre,
      nuevoNombre: nombreActual,
      conteoAfectados: conteo
    });
  };

  const confirmarEdicion = async (e) => {
    e.preventDefault();
    const { tipo, nombreActual, nuevoNombre } = modalEditar;
    const nuevo = nuevoNombre.trim();
    if (!nuevo) {
      mostrarNotificacion('Por favor ingresa un nombre válido.', 'warning');
      return;
    }
    if (nuevo.toLowerCase() === nombreActual.toLowerCase()) {
      setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 });
      return;
    }

    try {
      if (tipo === 'linea') {
        setRenombresLineas(prev => ({ ...prev, [nombreActual]: nuevo }));
        setLineasAdicionales(prev => prev.map(l => l.toLowerCase() === nombreActual.toLowerCase() ? nuevo : l));
        await supabase.from('productos').update({ linea: nuevo }).eq('linea', nombreActual);
        if (lineaActivaMaster.toLowerCase() === nombreActual.toLowerCase()) {
          setLineaActivaMaster(nuevo);
        }
        mostrarNotificacion(`¡Línea "${nombreActual}" renombrada a "${nuevo}" exitosamente!`, 'success');
      } else if (tipo === 'sublinea') {
        setRenombresSublineas(prev => ({ ...prev, [nombreActual]: nuevo }));
        setSublineasAdicionales(prev => prev.map(s => {
          const nom = typeof s === 'string' ? s : s?.nombre || '';
          if (nom.toLowerCase() === nombreActual.toLowerCase()) {
            return typeof s === 'string' ? nuevo : { ...s, nombre: nuevo };
          }
          return s;
        }));
        await supabase.from('productos').update({ sublinea: nuevo }).eq('sublinea', nombreActual);
        mostrarNotificacion(`¡Pieza "${nombreActual}" renombrada a "${nuevo}" con éxito!`, 'success');
      } else if (tipo === 'marca') {
        const nuevoUpper = nuevo.toUpperCase();
        setRenombresMarcas(prev => ({ ...prev, [nombreActual]: nuevoUpper }));
        setMarcasAdicionales(prev => prev.map(m => m.toLowerCase() === nombreActual.toLowerCase() ? nuevoUpper : m));
        await supabase.from('productos').update({ marca_producto: nuevoUpper }).eq('marca_producto', nombreActual);
        mostrarNotificacion(`¡Marca "${nombreActual}" renombrada a "${nuevoUpper}"!`, 'success');
      } else if (tipo === 'modelo') {
        setRenombresModelos(prev => ({ ...prev, [nombreActual]: nuevo }));
        setModelosAdicionales(prev => prev.map(m => m.toLowerCase() === nombreActual.toLowerCase() ? nuevo : m));
        await supabase.from('productos').update({ modelo_vehiculo: nuevo }).eq('modelo_vehiculo', nombreActual);
        mostrarNotificacion(`¡Vehículo "${nombreActual}" renombrado a "${nuevo}"!`, 'success');
      }

      setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 });
      cargarInventario();
    } catch (err) {
      console.error('Error al editar clasificación:', err);
      mostrarNotificacion('Error al guardar cambios: ' + err.message, 'error');
    }
  };

  // Controladores de Eliminación con Confirmación Segura
  const abrirModalConfirmarEliminar = (tipo, nombre, lineaPadre = '', conteo = 0) => {
    setModalConfirmarEliminar({
      abierto: true,
      tipo,
      nombre,
      lineaPadre,
      conteoAfectados: conteo
    });
  };

  const ejecutarEliminacion = async () => {
    const { tipo, nombre, conteoAfectados } = modalConfirmarEliminar;
    try {
      if (tipo === 'linea') {
        setLineasEliminadas(prev => [...prev.filter(l => l.toLowerCase() !== nombre.toLowerCase()), nombre]);
        setLineasAdicionales(prev => prev.filter(l => l.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ linea: 'General' }).eq('linea', nombre);
        }
        if (lineaActivaMaster.toLowerCase() === nombre.toLowerCase()) {
          setLineaActivaMaster('Tren Delantero y Dirección');
        }
        mostrarNotificacion(`Línea "${nombre}" eliminada del catálogo.`, 'warning');
      } else if (tipo === 'sublinea') {
        setSublineasEliminadas(prev => [...prev.filter(s => s.toLowerCase() !== nombre.toLowerCase()), nombre]);
        setSublineasAdicionales(prev => prev.filter(s => {
          const nom = typeof s === 'string' ? s : s?.nombre || '';
          return nom.toLowerCase() !== nombre.toLowerCase();
        }));
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ sublinea: 'General' }).eq('sublinea', nombre);
        }
        mostrarNotificacion(`Pieza "${nombre}" eliminada del catálogo.`, 'warning');
      } else if (tipo === 'marca') {
        setMarcasEliminadas(prev => [...prev.filter(m => m.toLowerCase() !== nombre.toLowerCase()), nombre]);
        setMarcasAdicionales(prev => prev.filter(m => m.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ marca_producto: 'GENÉRICO' }).eq('marca_producto', nombre);
        }
        mostrarNotificacion(`Marca "${nombre}" eliminada del catálogo.`, 'warning');
      } else if (tipo === 'modelo') {
        setModelosEliminadas(prev => [...prev.filter(m => m.toLowerCase() !== nombre.toLowerCase()), nombre]);
        setModelosAdicionales(prev => prev.filter(m => m.toLowerCase() !== nombre.toLowerCase()));
        if (conteoAfectados > 0) {
          await supabase.from('productos').update({ modelo_vehiculo: 'Universal' }).eq('modelo_vehiculo', nombre);
        }
        mostrarNotificacion(`Vehículo "${nombre}" eliminado del catálogo.`, 'warning');
      }

      setModalConfirmarEliminar({ abierto: false, tipo: 'linea', nombre: '', lineaPadre: '', conteoAfectados: 0 });
      cargarInventario();
    } catch (err) {
      console.error('Error al eliminar clasificación:', err);
      mostrarNotificacion('Error al eliminar: ' + err.message, 'error');
    }
  };

  // Cargar inventario completo
  const cargarInventario = async () => {
    setCargandoProd(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('descripcion', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setCargandoProd(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalConfirmarEliminar.abierto) {
          setModalConfirmarEliminar({ abierto: false, tipo: 'linea', nombre: '', lineaPadre: '', conteoAfectados: 0 });
        } else if (modalEditar.abierto) {
          setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 });
        } else if (modalRapido.abierto) {
          setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' });
        } else if (modalRepuestoAbierto) {
          setModalRepuestoAbierto(false);
        }
      }
    };
    if (modalRepuestoAbierto || modalRapido.abierto || modalEditar.abierto || modalConfirmarEliminar.abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalRepuestoAbierto, modalRapido.abierto, modalEditar.abierto, modalConfirmarEliminar.abierto]);

  // Recalcular precio de venta automáticamente con base en margen % (por defecto 40%)
  const recalcularPrecioVenta = (costo, margen) => {
    const c = parseFloat(costo) || 0;
    const m = parseFloat(margen);
    const margenValido = isNaN(m) ? 40 : m;
    if (c <= 0) return;

    const pVenta = (c * (1 + margenValido / 100)).toFixed(2);
    setFormRepuesto(prev => ({
      ...prev,
      precio_detal_usd: pVenta
    }));
  };

  const handleCostoChange = (val) => {
    setFormRepuesto(prev => ({ ...prev, costo_usd: val }));
    const c = parseFloat(val) || 0;
    if (c > 0 && formRepuesto.margen_detal) {
      recalcularPrecioVenta(val, formRepuesto.margen_detal);
    }
  };

  const handleMargenChange = (val) => {
    const c = parseFloat(formRepuesto.costo_usd) || 0;
    setFormRepuesto(prev => ({ ...prev, margen_detal: val }));
    if (c > 0) {
      recalcularPrecioVenta(formRepuesto.costo_usd, val);
    } else {
      mostrarNotificacion('Ingresa primero el Costo ($) si deseas que el precio se calcule automáticamente por margen.', 'info');
    }
  };

  const handlePrecioVentaChange = (val) => {
    setFormRepuesto(prev => {
      const c = parseFloat(prev.costo_usd) || 0;
      const p = parseFloat(val) || 0;
      let nuevoMargen = prev.margen_detal;
      if (c > 0 && p >= c) {
        nuevoMargen = String(Math.round(((p - c) / c) * 100));
      } else if (c <= 0) {
        nuevoMargen = '';
      }
      return {
        ...prev,
        precio_detal_usd: val,
        margen_detal: nuevoMargen
      };
    });
  };

  // Sublíneas para el filtro de inventario y para el formulario modal
  const sublineasDisponiblesInv = useMemo(() => {
    return obtenerSublineasParaLinea(filtroLineaInv, productos, sublineasAdicionales);
  }, [filtroLineaInv, productos, sublineasAdicionales]);

  const sublineasDisponiblesModal = useMemo(() => {
    return obtenerSublineasParaLinea(formRepuesto.linea, productos, sublineasAdicionales);
  }, [formRepuesto.linea, productos, sublineasAdicionales]);

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
      ubicacion_fisica: ''
    });
    setModoNuevaLinea(false);
    setNuevaLineaInput('');
    setModoNuevaSublinea(false);
    setNuevaSublineaInput('');
    setModoNuevaMarca(false);
    setNuevaMarcaInput('');
    setModoNuevoModelo(false);
    setNuevoModeloInput('');
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
      ubicacion_fisica: p.ubicacion_fisica || ''
    });
    setModoNuevaLinea(false);
    setNuevaLineaInput('');
    setModoNuevaSublinea(false);
    setNuevaSublineaInput('');
    setModoNuevaMarca(false);
    setNuevaMarcaInput('');
    setModoNuevoModelo(false);
    setNuevoModeloInput('');
    setModalRepuestoAbierto(true);
  };

  const guardarRepuesto = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const codCorto = (formRepuesto.codigo_corto || '').trim();
    const refOEM = (formRepuesto.referencia || '').trim();
    const desc = (formRepuesto.descripcion || '').trim();

    // Solo se requiere Código Corto O Referencia OEM (al menos uno de los dos)
    if (!codCorto && !refOEM) {
      mostrarNotificacion('Debes ingresar al menos el Código Corto o la Referencia OEM del repuesto.', 'warning');
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
      mostrarNotificacion('Debes ingresar un precio de venta válido mayor a 0.', 'warning');
      setPasoModalRepuesto(4);
      return;
    }

    // Si solo hay OEM, se usa como código de identificación para que no quede nulo en la BD
    const codigoFinal = (codCorto || refOEM).toUpperCase();
    // Referencia OEM: Si se ingresó OEM se guarda; si no, queda null (limpio)
    const oemFinal = refOEM ? refOEM.toUpperCase() : null;

    setGuardandoRepuesto(true);
    try {
      const lineaFinal = formRepuesto.linea.trim() || 'General';
      const marcaFinal = formRepuesto.marca_producto.trim().toUpperCase() || 'GENÉRICO';
      const modeloFinal = formRepuesto.modelo_vehiculo.trim() || 'Universal';

      // Auto-registrar clasificaciones si son nuevas
      if (formRepuesto.linea.trim()) agregarNuevaLinea(lineaFinal);
      if (formRepuesto.marca_producto.trim()) agregarNuevaMarca(marcaFinal);
      if (formRepuesto.modelo_vehiculo.trim()) agregarNuevoModelo(modeloFinal);

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
        precio_taller_usd: parseFloat(formRepuesto.precio_detal_usd) || pVenta,
        precio_mayor_usd: parseFloat(formRepuesto.precio_detal_usd) || pVenta,
        aplica_iva: formRepuesto.aplica_iva,
        stock: parseInt(formRepuesto.stock) || 0,
        ubicacion_fisica: formRepuesto.ubicacion_fisica.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (repuestoEditandoId) {
        const { error } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', repuestoEditandoId);
        if (error) throw error;
        setNotifCRUD('¡Repuesto actualizado exitosamente!');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert(payload);
        if (error) throw error;
        setNotifCRUD('¡Nuevo repuesto registrado en el inventario!');
      }

      setModalRepuestoAbierto(false);
      cargarInventario();
      setTimeout(() => setNotifCRUD(null), 3500);
    } catch (err) {
      console.error('Error guardando repuesto:', err);
      alert('Error al guardar en Supabase: ' + err.message);
    } finally {
      setGuardandoRepuesto(false);
    }
  };

  const eliminarRepuesto = async (prod) => {
    if (!window.confirm(`¿Estás seguro de eliminar el repuesto "${prod.codigo_corto} - ${prod.descripcion}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', prod.id);

      if (error) throw error;
      setNotifCRUD(`Repuesto ${prod.codigo_corto} eliminado.`);
      cargarInventario();
      setTimeout(() => setNotifCRUD(null), 3000);
    } catch (err) {
      console.error('Error eliminando repuesto:', err);
      alert('Error eliminando repuesto: ' + err.message);
    }
  };

  // Filtrado de tabla inventario con texto, línea, sublínea y marca
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      // 1. Filtro de texto libre cruzado
      if (filtroTexto.trim()) {
        const t = filtroTexto.toLowerCase().trim();
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

      // 2. Filtro por Línea / Sistema
      if (filtroLineaInv && (p.linea || '').toLowerCase() !== filtroLineaInv.toLowerCase()) {
        return false;
      }

      // 3. Filtro por Sub-Línea
      if (filtroSublineaInv) {
        const cleanSub = filtroSublineaInv.replace(/^\d+[-_ ]*/, '').toLowerCase().trim();
        const pSub = (p.sublinea || '').toLowerCase();
        const pDesc = (p.descripcion || '').toLowerCase();
        if (!pSub.includes(cleanSub) && !pDesc.includes(cleanSub)) return false;
      }

      // 4. Filtro por Marca
      if (filtroMarcaInv) {
        const m = (p.marca_producto || p.marca || '').toLowerCase();
        if (m !== filtroMarcaInv.toLowerCase()) return false;
      }

      return true;
    });
  }, [productos, filtroTexto, filtroLineaInv, filtroSublineaInv, filtroMarcaInv]);

  // Paginación calculada de Repuestos en Inventario
  const totalPaginasInventario = Math.max(1, Math.ceil(productosFiltrados.length / (itemsPorPaginaInventario === 'todos' ? (productosFiltrados.length || 1) : (parseInt(itemsPorPaginaInventario, 10) || 25))));
  const productosPaginados = useMemo(() => {
    if (itemsPorPaginaInventario === 'todos') return productosFiltrados;
    const num = parseInt(itemsPorPaginaInventario, 10) || 25;
    const inicio = (paginaInventario - 1) * num;
    return productosFiltrados.slice(inicio, inicio + num);
  }, [productosFiltrados, paginaInventario, itemsPorPaginaInventario]);

  // =========================================================================
  // TAB 2: INGRESO DE MERCANCÍA (COMPRAS Y SUMA DE STOCK) - Gestionado en ModuloIngresoMercancia
  // =========================================================================

  // =========================================================================
  // TAB 3: CUENTAS POR COBRAR (FIADOS)
  // =========================================================================
  const [cuentasCobrar, setCuentasCobrar] = useState([]);
  const [cargandoCxC, setCargandoCxC] = useState(false);
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [cuentaActivaAbono, setCuentaActivaAbono] = useState(null);
  const [montoAbonoUSD, setMontoAbonoUSD] = useState('');
  const [metodoAbono, setMetodoAbono] = useState('EFECTIVO');
  const [guardandoAbono, setGuardandoAbono] = useState(false);

  const cargarCuentasCobrar = async () => {
    setCargandoCxC(true);
    try {
      // 1. Consultar de cuentas_cobrar
      const { data: cxcData, error: errCxC } = await supabase
        .from('cuentas_cobrar')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Consultar ventas con crédito
      const { data: ventasCredito, error: errVentas } = await supabase
        .from('ventas')
        .select('*')
        .or('metodo_pago.ilike.%Crédito%,metodo_pago.ilike.%credito%')
        .order('created_at', { ascending: false });

      // Consolidar
      const listaFinal = [];

      if (cxcData && cxcData.length > 0) {
        cxcData.forEach(c => listaFinal.push(c));
      }

      if (ventasCredito && ventasCredito.length > 0) {
        ventasCredito.forEach(v => {
          if (!listaFinal.some(c => c.venta_id === v.id || c.guia_id === v.id)) {
            listaFinal.push({
              id: `v_${v.id}`,
              venta_id: v.id,
              cliente_nombre: v.cliente_nombre,
              cliente_cedula_rif: v.cliente_cedula_rif,
              cliente_telefono: v.cliente_telefono,
              monto_total_usd: v.total_usd,
              monto_abonado_usd: 0,
              saldo_pendiente_usd: v.total_usd,
              estado: v.estado === 'pagada' ? 'pagado' : 'pendiente',
              fecha_emision: v.created_at,
              notas: `Venta Nº ${v.numero_control || 'S/N'}`
            });
          }
        });
      }

      setCuentasCobrar(listaFinal);
    } catch (err) {
      console.warn('Error consultando cuentas por cobrar:', err);
    } finally {
      setCargandoCxC(false);
    }
  };

  useEffect(() => {
    if (tabActiva === 'cxc') {
      cargarCuentasCobrar();
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
      alert('Ingresa un monto de abono válido mayor a 0.');
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
            updated_at: new Date().toISOString()
          })
          .eq('id', cuentaActivaAbono.id);
      }

      setModalAbonoAbierto(false);
      cargarCuentasCobrar();
      alert(`¡Abono de $${abonoUSD.toFixed(2)} registrado exitosamente! Nuevo saldo: $${nuevoSaldo.toFixed(2)}`);
    } catch (err) {
      console.error('Error registrando abono:', err);
      alert('Error registrando abono: ' + err.message);
    } finally {
      setGuardandoAbono(false);
    }
  };

  // Totales de CxC
  const totalDeudaPendiente = cuentasCobrar
    .filter(c => c.estado !== 'pagado')
    .reduce((acc, c) => acc + (parseFloat(c.saldo_pendiente_usd) || 0), 0);

  const totalAbonado = cuentasCobrar
    .reduce((acc, c) => acc + (parseFloat(c.monto_abonado_usd) || 0), 0);

  return (
    <div className="space-y-5 pb-16 font-sans text-slate-900 dark:text-slate-100">

      {/* CABECERA DEL PANEL ADMINISTRATIVO */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase">
              Panel Administrativo (Dueño)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de inventario, ingreso de compras y cobranzas de fiados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onVolverAlMostrador}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <span>Ir a Cobrar (Mostrador)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* NOTIFICACIÓN FLOTANTE FIXED TOP-CENTER TOAST (SIEMPRE VISIBLE EN EL CAMPO VISUAL PRINCIPAL) */}
      {notifCRUD && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] max-w-lg w-[calc(100vw-2rem)] animate-slide-up pointer-events-auto">
          <div className={`p-4 rounded-2xl border-2 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-xl ${
            notifCRUD.tipo === 'warning'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200 shadow-amber-950/50'
              : notifCRUD.tipo === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
          }`}>
            <div className="flex items-center gap-3">
              {notifCRUD.tipo === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : notifCRUD.tipo === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <div className="text-xs font-bold leading-snug">
                {typeof notifCRUD === 'string' ? notifCRUD : notifCRUD.mensaje}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifCRUD(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer flex-shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* CUERPO PRINCIPAL: SIDEBAR + CONTENIDO DE LA PESTAÑA ACTIVA                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* SUB-NAVEGACIÓN HORIZONTAL PARA CELULARES (MD:HIDDEN) */}
        <div className="md:hidden col-span-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setTabActiva('inventario')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                tabActiva === 'inventario'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventario</span>
              <span className="font-mono text-[10px] opacity-80">({productos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('lineas')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                (tabActiva === 'lineas' || tabActiva === 'clasificaciones')
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Líneas</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('marcas')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                tabActiva === 'marcas'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Marcas</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('modelos')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                tabActiva === 'modelos'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-purple-500" />
              <span>Modelos</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('compras')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                tabActiva === 'compras'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('cxc')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                tabActiva === 'cxc'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>CxC</span>
              {totalDeudaPendiente > 0 && (
                <span className="font-mono text-[10px] text-amber-500 font-black">
                  (${Math.round(totalDeudaPendiente)})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR DE PESTAÑAS (hidden md:block 3 cols en desktop) */}
        <div className="hidden md:block md:col-span-3 space-y-2">
          <div className="glass-card rounded-2xl p-2 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 space-y-1">
            
            <button
              type="button"
              onClick={() => setTabActiva('inventario')}
              className={`w-full p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                tabActiva === 'inventario'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Inventario (CRUD)</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                tabActiva === 'inventario' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {productos.length}
              </span>
            </button>

            {/* SECCIÓN: CLASIFICACIONES INDEPENDIENTES Y HOLGADAS */}
            <div className="pt-2 pb-0.5 px-2 text-[10px] font-mono font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Clasificaciones
            </div>

            {/* PESTAÑA: LÍNEAS Y SUBLÍNEAS */}
            <button
              type="button"
              onClick={() => setTabActiva('lineas')}
              className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                (tabActiva === 'lineas' || tabActiva === 'clasificaciones')
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Líneas y Sublíneas</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                (tabActiva === 'lineas' || tabActiva === 'clasificaciones') ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {listaLineas.length}
              </span>
            </button>

            {/* PESTAÑA: MARCAS DE REPUESTOS */}
            <button
              type="button"
              onClick={() => setTabActiva('marcas')}
              className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                tabActiva === 'marcas'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>Marcas de Repuestos</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                tabActiva === 'marcas' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {listaMarcas.length}
              </span>
            </button>

            {/* PESTAÑA: MODELOS DE VEHÍCULOS */}
            <button
              type="button"
              onClick={() => setTabActiva('modelos')}
              className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                tabActiva === 'modelos'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-purple-500" />
                <span>Modelos de Vehículos</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                tabActiva === 'modelos' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {listaModelos.length}
              </span>
            </button>

            {/* SEPARADOR: OPERACIONES */}
            <div className="pt-2 pb-0.5 px-2 text-[10px] font-mono font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Operaciones
            </div>

            <button
              type="button"
              onClick={() => setTabActiva('compras')}
              className={`w-full p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                tabActiva === 'compras'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" />
                <span>Ingreso de Mercancía</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('cxc')}
              className={`w-full p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                tabActiva === 'cxc'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Cuentas por Cobrar</span>
              </div>
              {totalDeudaPendiente > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-black">
                  ${Math.round(totalDeudaPendiente)}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* CONTENIDO PRINCIPAL (9 cols en desktop) */}
        <div className="md:col-span-9 space-y-4">

          {/* =================================================================== */}
          {/* PESTAÑA 1: INVENTARIO (CRUD COMPLETO)                               */}
          {/* =================================================================== */}
          {tabActiva === 'inventario' && (
            <div className="space-y-4">
              
              {/* Barra de Búsqueda y Filtros [Línea / Marca] + Botón [ + Nuevo Repuesto ] */}
              <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      placeholder="Filtrar por código, descripción, marca, vehículo o línea..."
                      className="w-full h-10 pl-9 pr-8 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-red-600 uppercase"
                    />
                    {filtroTexto && (
                      <button
                        type="button"
                        onClick={() => setFiltroTexto('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={abrirCrearRepuesto}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Nuevo Repuesto</span>
                  </button>
                </div>

                {/* Filtros rápidos: Línea, Sublínea, Marca y Reset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                  <div>
                    <select
                      value={filtroLineaInv}
                      onChange={(e) => {
                        setFiltroLineaInv(e.target.value);
                        setFiltroSublineaInv('');
                      }}
                      className={`w-full h-8 px-2.5 bg-slate-50 dark:bg-[#06080F] border rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600 cursor-pointer ${
                        filtroLineaInv ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <option value="">Todas las Líneas (Motor, Frenos...)</option>
                      {listaLineas.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={filtroSublineaInv}
                      onChange={(e) => setFiltroSublineaInv(e.target.value)}
                      className={`w-full h-8 px-2.5 bg-slate-50 dark:bg-[#06080F] border rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600 cursor-pointer ${
                        filtroSublineaInv ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <option value="">Todas las Sublíneas (Bujías, Pastillas...)</option>
                      {sublineasDisponiblesInv.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={filtroMarcaInv}
                      onChange={(e) => setFiltroMarcaInv(e.target.value)}
                      className={`w-full h-8 px-2.5 bg-slate-50 dark:bg-[#06080F] border rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-600 cursor-pointer ${
                        filtroMarcaInv ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <option value="">Todas las Marcas (555, BOSCH...)</option>
                      {listaMarcas.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {productosFiltrados.length} de {productos.length} repuestos
                    </span>
                    {(filtroTexto || filtroLineaInv || filtroSublineaInv || filtroMarcaInv) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroTexto('');
                          setFiltroLineaInv('');
                          setFiltroSublineaInv('');
                          setFiltroMarcaInv('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de Repuestos Mejorada */}
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-lg bg-white dark:bg-[#06080F]/95">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {/* VISTA TABLA PARA COMPUTADORAS */}
                  <table className="hidden md:table w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-300 dark:border-white/[0.12] sticky top-0 z-10 font-mono font-black text-slate-600 dark:text-slate-300 select-none">
                      <tr>
                        <th className="px-2 py-2.5 text-center w-14">FOTO</th>
                        <th className="px-3 py-2.5">CÓDIGO</th>
                        <th className="px-3 py-2.5 min-w-[220px]">DESCRIPCIÓN Y VEHÍCULO</th>
                        <th className="px-2.5 py-2.5">MARCA</th>
                        <th className="px-2.5 py-2.5 text-center">STOCK</th>
                        <th className="px-2.5 py-2.5 text-right">COSTO ($)</th>
                        <th className="px-2.5 py-2.5 text-right text-emerald-600 dark:text-emerald-400">PRECIO VENTA</th>
                        <th className="px-3 py-2.5 text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {productosPaginados.length > 0 ? (
                        productosPaginados.map((p) => {
                          const baseUSD = parseFloat(p.precio_detal_usd) || 0;
                          const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
                          const pBs = (baseUSD * tasaNum) * (p.aplica_iva !== false ? 1.16 : 1);

                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-2 py-2 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setRepuestoParaZoom(p)}
                                  className="group relative inline-block w-11 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 hover:border-red-500 shadow-sm transition-all bg-slate-100 dark:bg-black/30 cursor-pointer"
                                  title="Click para ver foto ampliada"
                                >
                                  <img
                                    src={obtenerFotoRepuesto(p)}
                                    alt={p.descripcion}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="w-3.5 h-3.5" />
                                  </span>
                                </button>
                              </td>

                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="font-mono font-black text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 inline-block">
                                  {p.codigo_corto}
                                </span>
                                {p.referencia && p.referencia !== p.codigo_corto && (
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    OEM: {p.referencia}
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  {p.linea && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                      {p.linea}
                                    </span>
                                  )}
                                  {p.sublinea && p.sublinea !== 'General' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400">
                                      {p.sublinea}
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold uppercase text-slate-900 dark:text-white leading-snug">
                                  {p.descripcion}
                                </div>
                                {p.modelo_vehiculo && (
                                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                    <Car className="w-3 h-3 flex-shrink-0" />
                                    <span>{p.modelo_vehiculo}</span>
                                  </div>
                                )}
                              </td>

                              <td className="px-2.5 py-2 whitespace-nowrap font-mono font-black uppercase text-slate-800 dark:text-slate-200">
                                {p.marca_producto || p.marca || 'ATS'}
                              </td>

                              <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                  (p.stock || 0) <= 0 
                                    ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black' 
                                    : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                }`}>
                                  {p.stock ?? 0}
                                </span>
                              </td>

                              <td className="px-2.5 py-2 text-right font-mono text-slate-500">
                                {formatUSD(p.costo_usd || 0)}
                              </td>

                              <td className="px-2.5 py-2 text-right whitespace-nowrap font-mono">
                                <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                  {formatUSD(p.precio_detal_usd || 0)}
                                </div>
                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                  Bs. {formatNumber(pBs.toFixed(2))}
                                </div>
                              </td>

                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => abrirEditarRepuesto(p)}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                                    title="Editar repuesto (código, precios, clasificación, stock)"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarRepuesto(p)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar repuesto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400">
                            No se encontraron repuestos registrados con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* VISTA TARJETAS TÁCTILES PARA CELULARES (MD:HIDDEN) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06] p-2 space-y-2.5">
                    {productosPaginados.length > 0 ? (
                      productosPaginados.map((p) => {
                        const baseUSD = parseFloat(p.precio_detal_usd) || 0;
                        const tasaNum = parseVenezuelanNumber(tasaBCV) || 1;
                        const pBs = (baseUSD * tasaNum) * (p.aplica_iva !== false ? 1.16 : 1);

                        return (
                          <div 
                            key={p.id} 
                            className="p-3 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                {/* Foto de repuesto con zoom */}
                                <button
                                  type="button"
                                  onClick={() => setRepuestoParaZoom(p)}
                                  className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-black/30 flex items-center justify-center p-0.5 cursor-pointer shadow-xs"
                                  title="Ver foto ampliada"
                                >
                                  <img
                                    src={obtenerFotoRepuesto(p)}
                                    alt={p.descripcion}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-black text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                      {p.codigo_corto}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                                      {p.marca_producto || p.marca || 'ATS'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                                      (p.stock || 0) <= 0 
                                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black' 
                                        : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                    }`}>
                                      Stock: {p.stock ?? 0}
                                    </span>
                                  </div>

                                  <div className="font-bold uppercase text-xs text-slate-900 dark:text-white mt-1 leading-snug">
                                    {p.descripcion}
                                  </div>

                                  {p.modelo_vehiculo && (
                                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                      <Car className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{p.modelo_vehiculo}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Acciones Editar y Eliminar */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => abrirEditarRepuesto(p)}
                                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-colors cursor-pointer"
                                  title="Editar repuesto"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => eliminarRepuesto(p)}
                                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                                  title="Eliminar repuesto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Fila Inferior: Precios */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.06] text-xs font-mono">
                              <span className="text-[10px] text-slate-400 font-sans">
                                Costo: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{formatUSD(p.costo_usd || 0)}</span>
                              </span>
                              <div className="text-right">
                                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                  {formatUSD(p.precio_detal_usd || 0)}
                                </span>
                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 ml-2">
                                  Bs. {formatNumber(pBs.toFixed(2))}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No se encontraron repuestos registrados con los filtros seleccionados.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Paginación de la Tabla de Inventario */}
              <ControlPaginacion
                paginaActual={paginaInventario}
                totalPaginas={totalPaginasInventario}
                totalItems={productosFiltrados.length}
                itemsPorPagina={itemsPorPaginaInventario}
                onChangePagina={(num) => {
                  setPaginaInventario(num);
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }}
                onChangeItemsPorPagina={setItemsPorPaginaInventario}
                opcionesItemsPorPagina={[15, 25, 50, 100, 'todos']}
                colorTema="red"
                etiquetaItem="repuestos"
              />
            </div>
          )}

          {/* =================================================================== */}
          {/* PESTAÑA 2A: LÍNEAS Y SUBLÍNEAS (SISTEMAS DEL VEHÍCULO - HOLGADO)   */}
          {/* =================================================================== */}
          {(tabActiva === 'lineas' || tabActiva === 'clasificaciones') && (
            <div className="space-y-4">
              
              {/* Barra de Sub-Navegación Holgada de Clasificaciones */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTabActiva('lineas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-blue-600 text-white shadow-md transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>1. Líneas y Sublíneas ({listaLineas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('marcas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-emerald-500" />
                  <span>2. Marcas de Repuestos ({listaMarcas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('modelos')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Car className="w-4 h-4 text-purple-500" />
                  <span>3. Modelos de Vehículos ({listaModelos.length})</span>
                </button>
              </div>

              {/* Cabecera de la sección */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Estructura de Líneas y Sublíneas Automotrices
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selecciona un sistema automotriz a la izquierda para gestionar sus piezas específicas con máxima holgura.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirCrearRepuesto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Nuevo Repuesto</span>
                </button>
              </div>

              {/* Master-Detail a 2 Columnas Grandes y Cómodas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Columna Izquierda: Sistemas Principales (5 columnas) */}
                <div className="lg:col-span-5 glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        Sistemas Principales ({lineasFiltradas.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Motor, Frenos...</span>
                  </div>

                  {/* 1. Barra de Búsqueda de Sistemas Principales */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={busquedaLineas}
                      onChange={(e) => setBusquedaLineas(e.target.value)}
                      placeholder="Buscar sistema (ej: Tren Delantero, Frenos)..."
                      className="w-full h-10 pl-9 pr-8 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {busquedaLineas && (
                      <button
                        type="button"
                        onClick={() => setBusquedaLineas('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 2. Formulario de Nuevo Sistema Automotriz */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = inputTabNuevaLinea.trim();
                      if (!val) {
                        setModalRapido({
                          abierto: true,
                          tipo: 'linea',
                          valor: '',
                          lineaPadre: ''
                        });
                        return;
                      }
                      const res = agregarNuevaLinea(val);
                      setInputTabNuevaLinea('');
                      if (res) setLineaActivaMaster(res);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={inputLineaRef}
                      type="text"
                      value={inputTabNuevaLinea}
                      onChange={(e) => setInputTabNuevaLinea(e.target.value)}
                      placeholder="Registrar nuevo sistema..."
                      className="flex-1 h-9 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="submit"
                      title="Registrar nuevo sistema automotriz"
                      className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Crear</span>
                    </button>
                  </form>

                  {/* Lista de Líneas con selección activa y filtrado en tiempo real */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {lineasFiltradas.length > 0 ? (
                      lineasFiltradas.map((linea) => {
                        const count = conteoPorLinea[linea] || 0;
                        const isSelected = (lineaActivaMaster || 'Tren Delantero y Dirección').toLowerCase() === linea.toLowerCase();
                        const isRecienCreada = ultimoItemCreado?.tipo === 'linea' && ultimoItemCreado?.valor?.toLowerCase() === linea.toLowerCase();
                        const isPersonalizada = lineasAdicionales.some(l => l.toLowerCase() === linea.toLowerCase());
                        return (
                          <div
                            key={linea}
                            onClick={() => setLineaActivaMaster(linea)}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/25'
                                : 'border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                              }`}>
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-bold text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {linea}
                                  </span>
                                  {isRecienCreada && (
                                    <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black bg-emerald-500 text-white animate-pulse flex-shrink-0">
                                      ¡NUEVA!
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                                count > 0 ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400'
                              }`}>
                                {count} rep
                              </span>
                              <button
                                type="button"
                                title={`Editar nombre de la línea "${linea}"`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalEditar('linea', linea, '', count);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={`Eliminar la línea "${linea}"`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalConfirmarEliminar('linea', linea, '', count);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-500 opacity-100' : 'opacity-25'}`} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 glass-card rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                        <Layers className="w-7 h-7 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="font-bold text-xs text-slate-600 dark:text-slate-400">
                          No se encontró ningún sistema con "{busquedaLineas}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const res = agregarNuevaLinea(busquedaLineas.trim());
                            if (res) setLineaActivaMaster(res);
                            setBusquedaLineas('');
                          }}
                          className="mt-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          + Crear "{busquedaLineas.trim()}" como nuevo sistema
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Sublíneas y Piezas del Sistema Seleccionado (7 columnas) */}
                <div className="lg:col-span-7 glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0B0F19]/95 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="text-[10px] font-mono uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">
                        Sistema Automotriz Activo
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Piezas de: {lineaActivaMaster || 'Tren Delantero y Dirección'}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold">
                          {sublineasParaMaster.length} piezas
                        </span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroLineaInv(lineaActivaMaster || 'Tren Delantero y Dirección');
                        setFiltroSublineaInv('');
                        setTabActiva('inventario');
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Ver repuestos en inventario</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Barra de Filtro y Registro de Sublíneas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={busquedaSublineas}
                        onChange={(e) => setBusquedaSublineas(e.target.value)}
                        placeholder={`Buscar piezas de ${lineaActivaMaster}...`}
                        className="w-full h-10 pl-8 pr-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = inputTabNuevaSublinea.trim();
                        if (!val) {
                          setModalRapido({
                            abierto: true,
                            tipo: 'sublinea',
                            valor: '',
                            lineaPadre: lineaActivaMaster || 'Tren Delantero y Dirección'
                          });
                          return;
                        }
                        agregarNuevaSublinea(val, lineaActivaMaster);
                        setInputTabNuevaSublinea('');
                      }}
                      className="sm:col-span-7 flex items-center gap-2"
                    >
                      <input
                        ref={inputSublineaRef}
                        type="text"
                        value={inputTabNuevaSublinea}
                        onChange={(e) => setInputTabNuevaSublinea(e.target.value)}
                        placeholder={`Nueva pieza para ${lineaActivaMaster}...`}
                        className="flex-1 h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="submit"
                        title="Escribe un nombre o haz clic para abrir la ventana de agregar pieza"
                        className="h-10 px-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Agregar</span>
                      </button>
                    </form>
                  </div>

                  {/* Grid Holgado de Sublíneas sin cortes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {sublineasParaMaster.map((sublinea) => {
                      const count = conteoPorSublinea[sublinea] || conteoPorSublinea[sublinea.toLowerCase()] || 0;
                      const isRecienAgregada = ultimoItemCreado?.tipo === 'sublinea' && ultimoItemCreado?.valor?.toLowerCase() === sublinea.toLowerCase();
                      const isPersonalizada = sublineasAdicionales.some(s => (typeof s === 'string' ? s : s?.nombre || '').toLowerCase() === sublinea.toLowerCase());
                      return (
                        <div
                          key={sublinea}
                          className={`p-3.5 border rounded-2xl flex flex-col justify-between gap-2.5 transition-all group ${
                            isRecienAgregada
                              ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-white dark:bg-[#0E131F] border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 hover:shadow-md'
                          }`}
                        >
                          {/* Cabecera de la tarjeta: Título con 100% de ancho y badge de conteo */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-black text-xs sm:text-sm ${
                                  isRecienAgregada ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'
                                } transition-colors leading-snug break-words`} title={sublinea}>
                                  {sublinea}
                                </span>
                                {isRecienAgregada && (
                                  <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black bg-emerald-500 text-white animate-pulse flex-shrink-0">
                                    ¡NUEVA!
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5">
                                Sistema: {lineaActivaMaster}
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-black shrink-0 ${
                              isRecienAgregada
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                : count > 0 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 border border-slate-200/60 dark:border-white/5'
                            }`}>
                              {count} rep
                            </span>
                          </div>

                          {/* Fila inferior de acciones: clara, separada y sin comprimir el nombre */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                            <div className="text-[10px] text-slate-400 font-mono">
                              {count > 0 ? `${count} productos activos` : 'Sin repuestos'}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title={`Editar nombre de la pieza "${sublinea}"`}
                                onClick={() => abrirModalEditar('sublinea', sublinea, lineaActivaMaster, count)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={`Eliminar pieza "${sublinea}"`}
                                onClick={() => abrirModalConfirmarEliminar('sublinea', sublinea, lineaActivaMaster, count)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Ver repuestos de esta sublínea en el inventario"
                                onClick={() => {
                                  setFiltroLineaInv(lineaActivaMaster);
                                  setFiltroSublineaInv(sublinea);
                                  setTabActiva('inventario');
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-white/10 dark:hover:bg-amber-500 text-slate-700 dark:text-slate-200 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Ver</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* PESTAÑA 2B: MARCAS DE REPUESTOS (VISTA TOTALMENTE HOLGADA)          */}
          {/* =================================================================== */}
          {tabActiva === 'marcas' && (
            <div className="space-y-4">
              
              {/* Barra de Sub-Navegación Holgada de Clasificaciones */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTabActiva('lineas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>1. Líneas y Sublíneas ({listaLineas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('marcas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-emerald-600 text-white shadow-md transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>2. Marcas de Repuestos ({listaMarcas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('modelos')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Car className="w-4 h-4 text-purple-500" />
                  <span>3. Modelos de Vehículos ({listaModelos.length})</span>
                </button>
              </div>

              {/* Cabecera de la sección */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Catálogo Maestro de Marcas de Fabricantes
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Administra los fabricantes oficiales que alimentan el inventario y punto de venta con total amplitud.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirCrearRepuesto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Nuevo Repuesto</span>
                </button>
              </div>

              {/* Barra de Búsqueda y Creación de Marca Holgada */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={busquedaMarcas}
                      onChange={(e) => setBusquedaMarcas(e.target.value)}
                      placeholder="Buscar marca (ej: Bosch, Denso, Gabriel, ATS)..."
                      className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 uppercase"
                    />
                    {busquedaMarcas && (
                      <button
                        type="button"
                        onClick={() => setBusquedaMarcas('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = inputTabNuevaMarca.trim();
                      if (!val) {
                        setModalRapido({
                          abierto: true,
                          tipo: 'marca',
                          valor: '',
                          lineaPadre: ''
                        });
                        return;
                      }
                      agregarNuevaMarca(val);
                      setInputTabNuevaMarca('');
                    }}
                    className="md:col-span-7 flex items-center gap-2"
                  >
                    <input
                      ref={inputMarcaRef}
                      type="text"
                      value={inputTabNuevaMarca}
                      onChange={(e) => setInputTabNuevaMarca(e.target.value)}
                      placeholder="Registrar nueva marca (ej. MONROE, AISIN, VALVOLINE)..."
                      className="flex-1 h-11 px-3.5 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="submit"
                      title="Escribe una marca o haz clic para abrir la ventana de registro"
                      className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Registrar Marca</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Grid Holgado de Marcas (Tarjetas Espaciosas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {marcasPaginadas.length > 0 ? (
                  marcasPaginadas.map((marca) => {
                    const count = conteoPorMarca[marca] || 0;
                    const isRecienCreada = ultimoItemCreado?.tipo === 'marca' && ultimoItemCreado?.valor?.toUpperCase() === marca.toUpperCase();
                    const isPersonalizada = marcasAdicionales.some(m => m.toLowerCase() === marca.toLowerCase());
                    return (
                      <div
                        key={marca}
                        className={`glass-card rounded-2xl p-4 border shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col justify-between gap-3 transition-all group ${
                          isRecienCreada 
                            ? 'border-emerald-500 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/30' 
                            : 'border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                            {marca.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-mono font-black text-xs uppercase text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {marca}
                              </h4>
                              {isRecienCreada && (
                                <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black bg-emerald-500 text-white animate-pulse">
                                  ¡NUEVA!
                                </span>
                              )}
                            </div>
                            <span className={`inline-block font-mono text-[10px] font-bold ${
                              count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}>
                              {count > 0 ? `${count} repuestos en stock` : '0 repuestos'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroMarcaInv(marca);
                              setTabActiva('inventario');
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver repuestos</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title={`Editar marca "${marca}"`}
                              onClick={() => abrirModalEditar('marca', marca, '', count)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={`Eliminar marca "${marca}"`}
                              onClick={() => abrirModalConfirmarEliminar('marca', marca, '', count)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono text-slate-400">
                              Fabricante
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95">
                    <Tag className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      No se encontraron marcas de repuestos
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {busquedaMarcas ? `Ninguna marca coincide con "${busquedaMarcas}".` : 'Registra una nueva marca arriba para verla aquí.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Paginación de Marcas */}
              <ControlPaginacion
                paginaActual={paginaMarcas}
                totalPaginas={totalPaginasMarcas}
                totalItems={marcasFiltradas.length}
                itemsPorPagina={itemsPorPaginaMarcas}
                onChangePagina={(num) => {
                  setPaginaMarcas(num);
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }}
                onChangeItemsPorPagina={setItemsPorPaginaMarcas}
                opcionesItemsPorPagina={[12, 16, 24, 32, 'todos']}
                colorTema="emerald"
                etiquetaItem="marcas"
              />
            </div>
          )}

          {/* =================================================================== */}
          {/* PESTAÑA 2C: MODELOS DE VEHÍCULOS (VISTA TOTALMENTE HOLGADA)        */}
          {/* =================================================================== */}
          {tabActiva === 'modelos' && (
            <div className="space-y-4">
              
              {/* Barra de Sub-Navegación Holgada de Clasificaciones */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTabActiva('lineas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>1. Líneas y Sublíneas ({listaLineas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('marcas')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-emerald-500" />
                  <span>2. Marcas de Repuestos ({listaMarcas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('modelos')}
                  className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-purple-600 text-white shadow-md transition-all cursor-pointer"
                >
                  <Car className="w-4 h-4" />
                  <span>3. Modelos de Vehículos ({listaModelos.length})</span>
                </button>
              </div>

              {/* Cabecera de la sección */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Catálogo Maestro de Vehículos y Modelos Compatibles
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Administra los carros y aplicaciones compatibles para asignarlos a los repuestos sin amontonamiento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirCrearRepuesto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Nuevo Repuesto</span>
                </button>
              </div>

              {/* Barra de Búsqueda y Creación de Modelo Holgada */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/[0.08] shadow-sm bg-white dark:bg-[#0B0F19]/95">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={busquedaModelos}
                      onChange={(e) => setBusquedaModelos(e.target.value)}
                      placeholder="Buscar modelo o fabricante (ej: Toyota, 4Runner, Aveo)..."
                      className="w-full h-11 pl-10 pr-8 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                    {busquedaModelos && (
                      <button
                        type="button"
                        onClick={() => setBusquedaModelos('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = inputTabNuevoModelo.trim();
                      if (!val) {
                        setModalRapido({
                          abierto: true,
                          tipo: 'modelo',
                          valor: '',
                          lineaPadre: ''
                        });
                        return;
                      }
                      agregarNuevoModelo(val);
                      setInputTabNuevoModelo('');
                    }}
                    className="md:col-span-7 flex items-center gap-2"
                  >
                    <input
                      ref={inputModeloRef}
                      type="text"
                      value={inputTabNuevoModelo}
                      onChange={(e) => setInputTabNuevoModelo(e.target.value)}
                      placeholder="Registrar nuevo modelo (ej: Toyota Yaris, Chery Arauca)..."
                      className="flex-1 h-11 px-3.5 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                      type="submit"
                      title="Escribe un vehículo o haz clic para abrir la ventana de registro"
                      className="h-11 px-5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Registrar Vehículo</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Grid Holgado de Modelos de Vehículos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {modelosPaginados.length > 0 ? (
                  modelosPaginados.map((modelo) => {
                    const count = conteoPorModelo[modelo] || 0;
                    const marcaFabricante = obtenerMarcaVehiculo(modelo);
                    const isRecienCreado = ultimoItemCreado?.tipo === 'modelo' && ultimoItemCreado?.valor?.toLowerCase() === modelo.toLowerCase();
                    const isPersonalizado = modelosAdicionales.some(m => m.toLowerCase() === modelo.toLowerCase());
                    return (
                      <div
                        key={modelo}
                        className={`glass-card rounded-2xl p-4 border shadow-sm bg-white dark:bg-[#0B0F19]/95 flex flex-col justify-between gap-3 transition-all group ${
                          isRecienCreado
                            ? 'border-purple-500 bg-purple-500/5 shadow-md ring-1 ring-purple-500/30'
                            : 'border-slate-200 dark:border-white/[0.08] hover:border-purple-500/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {marcaFabricante && marcaFabricante !== 'General' && (
                                <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                                  {marcaFabricante}
                                </span>
                              )}
                              {isRecienCreado && (
                                <span className="px-1.5 py-0.5 rounded-full font-mono text-[9px] font-black bg-purple-500 text-white animate-pulse">
                                  ¡NUEVO!
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {modelo}
                            </h4>
                            <span className={`inline-block font-mono text-[10px] font-bold mt-0.5 ${
                              count > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                            }`}>
                              {count > 0 ? `${count} repuestos compatibles` : '0 repuestos'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroTexto(modelo);
                              setTabActiva('inventario');
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver compatibles</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title={`Editar vehículo "${modelo}"`}
                              onClick={() => abrirModalEditar('modelo', modelo, '', count)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={`Eliminar vehículo "${modelo}"`}
                              onClick={() => abrirModalConfirmarEliminar('modelo', modelo, '', count)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono text-slate-400">
                              Vehículo
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19]/95">
                    <Car className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-500" />
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      No se encontraron modelos de vehículos
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {busquedaModelos ? `Ningún vehículo coincide con "${busquedaModelos}".` : 'Registra un nuevo vehículo arriba para verlo aquí.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Paginación de Modelos de Vehículos */}
              <ControlPaginacion
                paginaActual={paginaModelos}
                totalPaginas={totalPaginasModelos}
                totalItems={modelosFiltrados.length}
                itemsPorPagina={itemsPorPaginaModelos}
                onChangePagina={(num) => {
                  setPaginaModelos(num);
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }}
                onChangeItemsPorPagina={setItemsPorPaginaModelos}
                opcionesItemsPorPagina={[12, 16, 24, 32, 'todos']}
                colorTema="purple"
                etiquetaItem="vehículos"
              />
            </div>
          )}

          {/* =================================================================== */}
          {/* PESTAÑA 2: INGRESO DE MERCANCÍA (COMPRAS Y RECEPCIÓN DE FACTURAS)   */}
          {/* =================================================================== */}
          {tabActiva === 'compras' && (
            <ModuloIngresoMercancia
              productos={productos}
              cargarInventario={cargarInventario}
              tasaBCV={tasaBCV}
              abrirModalCrear={abrirCrearRepuesto}
            />
          )}

          {/* =================================================================== */}
          {/* PESTAÑA 3: CUENTAS POR COBRAR (FIADOS)                              */}
          {/* =================================================================== */}
          {tabActiva === 'cxc' && (
            <div className="space-y-4">
              
              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[11px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                    Total Deuda Pendiente
                  </span>
                  <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-300">
                    {formatUSD(totalDeudaPendiente)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {formatVES(totalDeudaPendiente * (parseVenezuelanNumber(tasaBCV) || 1))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Total Abonado / Recuperado
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {formatUSD(totalAbonado)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Registros procesados
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] space-y-1">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
                    Total Clientes Deudores
                  </span>
                  <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                    {cuentasCobrar.filter(c => c.estado !== 'pagado').length}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Créditos activos en tienda
                  </div>
                </div>
              </div>

              {/* Tabla de Cuentas por Cobrar */}
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-lg bg-white dark:bg-[#06080F]/95">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-300 dark:border-white/[0.12] sticky top-0 z-10 font-mono font-black text-slate-600 dark:text-slate-300 select-none">
                      <tr>
                        <th className="px-3 py-2.5">CLIENTE</th>
                        <th className="px-3 py-2.5">CÉDULA / RIF</th>
                        <th className="px-2.5 py-2.5">FECHA</th>
                        <th className="px-2.5 py-2.5 text-right">TOTAL VENTA ($)</th>
                        <th className="px-2.5 py-2.5 text-right text-emerald-600 dark:text-emerald-400">ABONADO ($)</th>
                        <th className="px-2.5 py-2.5 text-right text-amber-600 dark:text-amber-400">SALDO PENDIENTE</th>
                        <th className="px-2.5 py-2.5 text-center">ESTADO</th>
                        <th className="px-3 py-2.5 text-center">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {cuentasCobrar.length > 0 ? (
                        cuentasCobrar.map((c) => {
                          const saldo = parseFloat(c.saldo_pendiente_usd) || 0;
                          const esPagado = c.estado === 'pagado' || saldo <= 0.01;

                          return (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                                {c.cliente_nombre || 'Cliente sin nombre'}
                                {c.cliente_telefono && (
                                  <div className="text-[10px] font-mono text-slate-400 font-normal">
                                    {c.cliente_telefono}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                                {c.cliente_cedula_rif || '—'}
                              </td>
                              <td className="px-2.5 py-2 font-mono text-slate-500 whitespace-nowrap">
                                {c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono font-bold">
                                {formatUSD(c.monto_total_usd || 0)}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatUSD(c.monto_abonado_usd || 0)}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono font-black text-amber-600 dark:text-amber-400">
                                {formatUSD(saldo)}
                              </td>
                              <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase ${
                                  esPagado
                                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                                }`}>
                                  {esPagado ? 'Pagado' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                {!esPagado && (
                                  <button
                                    type="button"
                                    onClick={() => abrirRegistrarAbono(c)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                                  >
                                    Registrar Abono
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400">
                            No hay cuentas por cobrar o fiados registrados actualmente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL PARA CREAR O EDITAR REPUESTO EN EL INVENTARIO                       */}
      {/* ========================================================================= */}
      {modalRepuestoAbierto && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalRepuestoAbierto(false); }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-0 sm:border border-slate-300 dark:border-white/15 rounded-none sm:rounded-3xl w-full sm:w-[98vw] max-w-4xl sm:max-w-5xl h-full sm:h-[94vh] max-h-full sm:max-h-[820px] flex flex-col shadow-2xl overflow-hidden animate-scaleIn"
          >
            
            {/* Header del Modal - FIJO ARRIBA SIEMPRE VISIBLE */}
            <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-600/10 text-red-600 flex items-center justify-center border border-red-500/20 flex-shrink-0 shadow-2xs">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 leading-tight truncate">
                    <span className="truncate">{repuestoEditandoId ? 'Editar Ficha' : 'Nuevo Repuesto'}</span>
                    {(formRepuesto.codigo_corto || formRepuesto.referencia) && (
                      <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-black shrink-0">
                        {formRepuesto.codigo_corto || formRepuesto.referencia}
                      </span>
                    )}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
                    <span className="font-bold text-red-600 dark:text-red-400">Paso {pasoModalRepuesto}/4:</span>
                    <span className="truncate">{PASOS_MODAL_REPUESTO.find(p => p.id === pasoModalRepuesto)?.hint}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalRepuestoAbierto(false)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BARRA DE NAVEGACIÓN POR PASOS (STEPPER WIZARD) */}
            <div className="px-2 sm:px-6 py-2 border-b border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex-shrink-0">
              <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
                {PASOS_MODAL_REPUESTO.map((paso) => {
                  const IconoPaso = paso.icon;
                  const esActivo = pasoModalRepuesto === paso.id;
                  const esCompletado = pasoModalRepuesto > paso.id;
                  return (
                    <button
                      key={paso.id}
                      type="button"
                      onClick={() => saltarAPasoModal(paso.id)}
                      className={`flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-0.5 sm:gap-2 p-1 sm:p-2 rounded-xl text-center sm:text-left transition-all cursor-pointer relative ${
                        esActivo
                          ? 'bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 ring-1 sm:ring-2 ring-red-500/20 shadow-xs'
                          : esCompletado
                          ? 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                          : 'opacity-55 hover:opacity-85'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-all flex-shrink-0 ${
                          esCompletado
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : esActivo
                            ? 'bg-red-600 text-white shadow-md shadow-red-500/30 scale-105'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {esCompletado ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <IconoPaso className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </div>
                      <span className="block sm:hidden text-[8px] font-mono font-bold truncate max-w-full leading-tight text-slate-600 dark:text-slate-300">
                        {paso.label.split(' ')[0]}
                      </span>
                      <div className="min-w-0 hidden sm:block">
                        <span className={`text-[11px] font-mono font-black uppercase tracking-wider block truncate ${
                          esActivo ? 'text-red-600 dark:text-red-400' : esCompletado ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {paso.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block truncate">
                          {paso.hint}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORMULARIO CON VISTAS POR PANTALLA */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (pasoModalRepuesto < 4) {
                  avanzarPasoModal(e);
                } else {
                  guardarRepuesto(e);
                }
              }} 
              className="flex flex-col flex-1 overflow-hidden min-h-0 text-xs"
            >
              
              {/* Input oculto para subida de imagen local */}
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

              {/* CUERPO WORKSPACE HOLGADO Y MODERNO */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-100/60 dark:bg-[#070A12]/60">
                <div className="max-w-3xl mx-auto space-y-4">
                  
                  {/* ========================================================================= */}
                  {/* PASO 1: CLASIFICACIÓN Y VEHÍCULO                                          */}
                  {/* ========================================================================= */}
                  {pasoModalRepuesto === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 sm:p-6 bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
                              <Layers className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-slate-900 dark:text-white tracking-wide">
                                1. Clasificación Jerárquica y Vehículo
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Organiza el repuesto por sistema, pieza, fabricante y compatibilidad
                              </p>
                            </div>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20">
                            Paso 1 de 4
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Línea / Sistema */}
                          <SearchableComboboxModal
                            label="Línea / Sistema *"
                            value={formRepuesto.linea}
                            onChange={(val) => setFormRepuesto(prev => ({ ...prev, linea: val }))}
                            options={listaLineas}
                            placeholder="Buscar o seleccionar línea..."
                            required={true}
                            onCreateNew={(newVal) => {
                              const val = agregarNuevaLinea(newVal);
                              if (val) setFormRepuesto(prev => ({ ...prev, linea: val }));
                              return val;
                            }}
                            createNewLabel={(q) => `Crear "${q}" como nueva línea`}
                          />

                          {/* Sublínea / Tipo de Pieza */}
                          <SearchableComboboxModal
                            label="Sublínea / Pieza"
                            value={formRepuesto.sublinea}
                            onChange={(val) => {
                              const lineaAuto = (!formRepuesto.linea || !formRepuesto.linea.trim()) ? obtenerLineaParaSublinea(val) : '';
                              setFormRepuesto(prev => ({
                                ...prev,
                                sublinea: val,
                                ...(lineaAuto ? { linea: lineaAuto } : {})
                              }));
                            }}
                            options={sublineasDisponiblesModal}
                            placeholder="Buscar o escribir pieza (ej. Pastillas, Baterías)..."
                            onCreateNew={(newVal) => {
                              const val = agregarNuevaSublinea(newVal, formRepuesto.linea);
                              if (val) setFormRepuesto(prev => ({ ...prev, sublinea: val }));
                              return val;
                            }}
                            createNewLabel={(q) => `Crear "${q}" como nueva pieza`}
                          />

                          {/* Marca de Producto */}
                          <SearchableComboboxModal
                            label="Marca del Repuesto *"
                            value={formRepuesto.marca_producto}
                            onChange={(val) => setFormRepuesto(prev => ({ ...prev, marca_producto: val }))}
                            options={listaMarcas}
                            placeholder="Buscar o escribir marca (ej. BOSCH, DENSO)..."
                            required={true}
                            uppercase={true}
                            onCreateNew={(newVal) => {
                              const val = agregarNuevaMarca(newVal);
                              if (val) setFormRepuesto(prev => ({ ...prev, marca_producto: val }));
                              return val;
                            }}
                            createNewLabel={(q) => `Registrar "${q}" como nueva marca`}
                          />

                          {/* Modelo / Vehículo Compatible */}
                          <SearchableComboboxModal
                            label="Vehículo Compatible *"
                            value={formRepuesto.modelo_vehiculo}
                            onChange={(val) => setFormRepuesto(prev => ({ ...prev, modelo_vehiculo: val }))}
                            options={listaModelos}
                            placeholder="Buscar o escribir vehículo (ej. 4Runner, Corolla)..."
                            required={true}
                            getLabel={(m) => {
                              const marca = obtenerMarcaVehiculo(m);
                              return (marca && marca !== 'Otras Marcas' && marca !== 'General') ? `${marca} - ${m}` : m;
                            }}
                            getFilterText={(m) => {
                              const marca = obtenerMarcaVehiculo(m);
                              return `${marca} ${m}`;
                            }}
                            onCreateNew={(newVal) => {
                              const val = agregarNuevoModelo(newVal);
                              if (val) setFormRepuesto(prev => ({ ...prev, modelo_vehiculo: val }));
                              return val;
                            }}
                            createNewLabel={(q) => `Crear "${q}" como nuevo vehículo`}
                          />
                        </div>

                        {/* Tarjeta de Resumen y Sugerencia Inteligente */}
                        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-slate-500 uppercase">Resumen de Clasificación:</span>
                            <span className="text-[10px] text-slate-400">💡 Al elegir la Sublínea se autoasigna la Línea</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              formRepuesto.linea 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-200/70 dark:bg-white/5 text-slate-400'
                            }`}>
                              {formRepuesto.linea ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
                              <span>Línea: {formRepuesto.linea || 'Pendiente *'}</span>
                            </span>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              formRepuesto.sublinea 
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                : 'bg-slate-200/70 dark:bg-white/5 text-slate-400'
                            }`}>
                              {formRepuesto.sublinea ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
                              <span>Pieza: {formRepuesto.sublinea || 'Opcional / Genérica'}</span>
                            </span>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              formRepuesto.marca_producto 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-200/70 dark:bg-white/5 text-slate-400'
                            }`}>
                              {formRepuesto.marca_producto ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
                              <span>Marca: {formRepuesto.marca_producto || 'Pendiente *'}</span>
                            </span>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              formRepuesto.modelo_vehiculo 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-200/70 dark:bg-white/5 text-slate-400'
                            }`}>
                              {formRepuesto.modelo_vehiculo ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
                              <span>Vehículo: {formRepuesto.modelo_vehiculo ? `${obtenerMarcaVehiculo(formRepuesto.modelo_vehiculo)} ${formRepuesto.modelo_vehiculo}` : 'Pendiente *'}</span>
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* PASO 2: IDENTIFICACIÓN Y MEDIDAS                                          */}
                  {/* ========================================================================= */}
                  {pasoModalRepuesto === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 sm:p-6 bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                              <Tag className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-slate-900 dark:text-white tracking-wide">
                                2. Identificación y Descripción del Repuesto
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Define el nombre visible en caja y los códigos de referencia técnica
                              </p>
                            </div>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20">
                            Paso 2 de 4
                          </span>
                        </div>

                        {/* Hero Input: Descripción del Repuesto */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-mono font-black text-slate-800 dark:text-slate-200 uppercase text-xs flex items-center gap-1">
                              <span>Descripción del Repuesto</span>
                              <span className="text-red-500 font-black">*</span>
                            </label>
                            <span className="text-[10px] font-mono text-slate-400">Texto principal en facturas y cotizaciones</span>
                          </div>
                          <input
                            type="text"
                            value={formRepuesto.descripcion}
                            onChange={(e) => setFormRepuesto(prev => ({ ...prev, descripcion: e.target.value }))}
                            placeholder="Ej. PASTILLAS DE FRENO DELANTERAS CERÁMICAS"
                            className="w-full h-11 px-3.5 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border-2 border-slate-200 dark:border-white/10 rounded-xl font-extrabold uppercase text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs tracking-wide"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Código Corto */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Código Corto <span className="text-slate-400 font-normal lowercase">(o OEM)</span>
                            </label>
                            <input
                              type="text"
                              value={formRepuesto.codigo_corto}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, codigo_corto: e.target.value }))}
                              placeholder="Ej. MD-COR-09"
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-black uppercase text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Referencia OEM */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Referencia OEM <span className="text-slate-400 font-normal lowercase">(o Código)</span>
                            </label>
                            <input
                              type="text"
                              value={formRepuesto.referencia}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, referencia: e.target.value }))}
                              placeholder="Ej. 04465-02220"
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold uppercase text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Unidad de Empaque */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Unidad de Empaque
                            </label>
                            <select
                              value={formRepuesto.unidad || 'UND'}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, unidad: e.target.value }))}
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] dark:hover:bg-[#0B0F19] dark:focus:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-xl font-bold uppercase text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs cursor-pointer"
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

                        {/* Medidas y aviso amigable */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Medidas / Especificación <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                            </label>
                            <input
                              type="text"
                              value={formRepuesto.medidas}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, medidas: e.target.value }))}
                              placeholder="Ej. 1 Galón, 5 Canales, 10W-40..."
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/10 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5 mb-0.5">
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Regla de Códigos:</span>
                            </p>
                            <span>Ingresa al menos el Código Corto o la Referencia OEM. Si solo posees uno, se utilizará para ambas referencias.</span>
                          </div>
                        </div>

                        {/* Rótulo de previsualización en Mostrador */}
                        {(formRepuesto.descripcion || formRepuesto.codigo_corto || formRepuesto.referencia) && (
                          <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Vista previa en Mostrador:</span>
                              <span className="font-extrabold uppercase text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                                {formRepuesto.descripcion || 'Sin descripción'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 font-mono font-black text-xs rounded-lg border border-red-500/20">
                                {formRepuesto.codigo_corto || formRepuesto.referencia || 'CÓDIGO'}
                              </span>
                              <span className="px-2 py-1 bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs rounded-lg">
                                {formRepuesto.unidad || 'UND'}
                              </span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* PASO 3: FOTOGRAFÍA DEL REPUESTO                                           */}
                  {/* ========================================================================= */}
                  {pasoModalRepuesto === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 sm:p-6 bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                              <Camera className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-slate-900 dark:text-white tracking-wide">
                                3. Fotografía del Repuesto (Opcional)
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Asigna una foto real o usa una referencia visual del catálogo oficial
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {esFotoPersonalizada ? (
                              <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                ✓ Foto Personalizada
                              </span>
                            ) : fotoActualMostrada ? (
                              <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                ★ Foto Catálogo
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-black bg-slate-200 dark:bg-white/10 text-slate-500">
                                Sin Foto
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                          {/* Contenedor Dropzone amplio */}
                          <div className="sm:col-span-5 flex flex-col items-center justify-center">
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDraggingFoto(true); }}
                              onDragLeave={() => setIsDraggingFoto(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingFoto(false);
                                if (e.dataTransfer.files?.[0]) procesarArchivoImagen(e.dataTransfer.files[0]);
                              }}
                              onClick={() => fileInputFotoRef.current?.click()}
                              className={`w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 transition-all p-2 flex items-center justify-center relative group bg-gradient-to-b from-slate-50 to-slate-100 dark:from-black/70 dark:to-black/30 cursor-pointer shadow-inner ${
                                isDraggingFoto 
                                  ? 'border-red-500 scale-105 bg-red-500/10' 
                                  : 'border-slate-200 dark:border-white/15 hover:border-red-400'
                              }`}
                              title="Haz clic o arrastra una imagen aquí para subirla"
                            >
                              {fotoActualMostrada ? (
                                <img
                                  src={fotoActualMostrada}
                                  alt="Vista previa repuesto"
                                  className="max-h-full max-w-full object-contain drop-shadow transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-1.5 text-center p-3">
                                  <CameraOff className="w-10 h-10 stroke-1 opacity-50" />
                                  <span className="text-xs font-mono font-bold">Sin foto asignada</span>
                                  <span className="text-[10px] font-mono text-slate-400">Clic o arrastra aquí</span>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-2xl backdrop-blur-2xs">
                                <Upload className="w-6 h-6 mb-1 text-white" />
                                <span className="text-xs font-mono font-bold">Cambiar imagen</span>
                              </div>
                            </div>
                          </div>

                          {/* Panel de Controles y Fotos Rápidas */}
                          <div className="sm:col-span-7 space-y-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputFotoRef.current?.click()}
                                className="h-9 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Subir Foto de Archivo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const fotoSugerida = obtenerFotoRepuesto(formRepuesto);
                                  if (fotoSugerida) {
                                    setFormRepuesto(prev => ({ ...prev, imagen_url: fotoSugerida }));
                                    mostrarNotificacion('Foto sugerida del catálogo asignada.', 'info');
                                  } else {
                                    mostrarNotificacion('Selecciona una sublínea o escribe una descripción para sugerir foto.', 'warning');
                                  }
                                }}
                                className="h-9 px-3.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold rounded-xl border border-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Catálogo Oficial</span>
                              </button>

                              {fotoActualMostrada && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormRepuesto(prev => ({ ...prev, imagen_url: '' }));
                                    mostrarNotificacion('Foto retirada.', 'info');
                                  }}
                                  className="h-9 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold rounded-xl border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                  <CameraOff className="w-3.5 h-3.5" />
                                  <span>Quitar</span>
                                </button>
                              )}
                            </div>

                            {/* Fotos Rápidas */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                                Fotos Rápidas de Piezas Frecuentes:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                  { label: 'Pastillas Freno', url: FOTOS_CATALOGO.pastillas_freno },
                                  { label: 'Amortiguador', url: FOTOS_CATALOGO.amortiguador },
                                  { label: 'Bujía', url: FOTOS_CATALOGO.bujia },
                                  { label: 'Filtro Aceite', url: FOTOS_CATALOGO.filtro_aceite },
                                  { label: 'Bomba de Agua', url: FOTOS_CATALOGO.bomba_agua },
                                  { label: 'Rótula / Muñón', url: FOTOS_CATALOGO.munon_rotula },
                                ].map((preset) => {
                                  const estaActivo = formRepuesto.imagen_url === preset.url;
                                  return (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => {
                                        setFormRepuesto(prev => ({ ...prev, imagen_url: preset.url }));
                                        mostrarNotificacion(`Foto asignada: ${preset.label}`, 'success');
                                      }}
                                      className={`h-9 px-2.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                                        estaActivo
                                          ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/30'
                                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-red-400'
                                      }`}
                                    >
                                      <img src={preset.url} alt="" className="w-5 h-5 object-contain rounded" />
                                      <span className="truncate">{preset.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Tips Ctrl + V */}
                            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-xl text-[11px] font-mono text-slate-500 flex items-center justify-between">
                              <span>¿Copiaste una foto de internet?</span>
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                <span>Pégala directamente con</span>
                                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-black text-xs">Ctrl + V</kbd>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* PASO 4: PRECIOS, RENTABILIDAD Y ALMACÉN                                   */}
                  {/* ========================================================================= */}
                  {pasoModalRepuesto === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Tarjeta de Rentabilidad y Precios */}
                      <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent dark:from-emerald-950/25 dark:to-transparent border border-emerald-500/35 rounded-2xl space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                              <DollarSign className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wide">
                                4. Costo y Precio de Venta Detal
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Define la ganancia comercial y visualiza la conversión inmediata en Bolívares
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline">Margen:</span>
                            {[30, 40, 50, 60, 100].map((mVal) => (
                              <button
                                key={mVal}
                                type="button"
                                onClick={() => handleMargenChange(String(mVal))}
                                className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold cursor-pointer transition-all ${
                                  String(formRepuesto.margen_detal) === String(mVal) && parseFloat(formRepuesto.costo_usd) > 0
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                }`}
                              >
                                +{mVal}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          {/* Costo USD */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Costo ($) <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formRepuesto.costo_usd}
                                onChange={(e) => handleCostoChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/15 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-xs shadow-2xs"
                              />
                            </div>
                          </div>

                          {/* Margen % */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Margen (%) <span className="text-slate-400 font-normal lowercase">(opc)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={formRepuesto.margen_detal}
                                onChange={(e) => handleMargenChange(e.target.value)}
                                placeholder="40"
                                className="w-full h-10 px-3 pr-7 bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/15 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-xs shadow-2xs"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">%</span>
                            </div>
                          </div>

                          {/* Precio Venta USD */}
                          <div>
                            <label className="font-mono font-black text-emerald-700 dark:text-emerald-400 uppercase block mb-1 text-[11px]">
                              Precio Venta ($) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-emerald-600 text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formRepuesto.precio_detal_usd}
                                onChange={(e) => handlePrecioVentaChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-10 pl-7 pr-3 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl font-mono font-black text-emerald-800 dark:text-emerald-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Resumen dinámico de ganancia y conversión a Bolívares */}
                        <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span>Ganancia neta estimada:</span>
                            {parseFloat(formRepuesto.costo_usd) > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black">
                                +${(parseFloat(formRepuesto.precio_detal_usd || 0) - parseFloat(formRepuesto.costo_usd || 0)).toFixed(2)} ({formRepuesto.margen_detal || 0}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-bold">
                                {parseFloat(formRepuesto.precio_detal_usd) > 0 ? 'Precio directo (Sin costo)' : '$0.00'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-xl font-black text-xs shadow-xs">
                            <span className="text-[10px] opacity-80 uppercase">VES al BCV:</span>
                            <span>{formatVES((parseFloat(formRepuesto.precio_detal_usd) || 0) * (parseVenezuelanNumber(tasaBCV) || 1))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tarjeta de Inventario y Almacén */}
                      <div className="p-4 sm:p-6 bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                              <Boxes className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-slate-900 dark:text-white tracking-wide">
                                Inventario y Almacén
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Registra existencias físicas y ubicación en pasillo para el despacho
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Control de Stock</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          {/* Stock Disponible */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Stock Inicial *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formRepuesto.stock}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, stock: e.target.value }))}
                              placeholder="0"
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/10 rounded-xl font-mono font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Ubicación en Tienda */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Ubicación en Tienda
                            </label>
                            <input
                              type="text"
                              value={formRepuesto.ubicacion_fisica}
                              onChange={(e) => setFormRepuesto(prev => ({ ...prev, ubicacion_fisica: e.target.value }))}
                              placeholder="Ej. Pasillo 2, Estante B"
                              className="w-full h-10 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-[#070A12] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Régimen Fiscal */}
                          <div>
                            <label className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1 text-[11px]">
                              Régimen Fiscal
                            </label>
                            <label className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer transition-all shadow-2xs">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formRepuesto.aplica_iva}
                                  onChange={(e) => setFormRepuesto(prev => ({ ...prev, aplica_iva: e.target.checked }))}
                                  className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                                />
                                <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">I.V.A. (16%)</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                                formRepuesto.aplica_iva 
                                  ? 'bg-red-500/15 text-red-600 border border-red-500/25' 
                                  : 'bg-slate-200/70 dark:bg-white/10 text-slate-500'
                              }`}>
                                {formRepuesto.aplica_iva ? '+16%' : 'Exento'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Ficha Resumen Ejecutivo Final (Confirmación visual antes de guardar) */}
                      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ficha Resumen del Repuesto</span>
                          </span>
                          <span className="text-emerald-400 font-black">Listo para Registrar</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                            {fotoActualMostrada ? (
                              <img src={fotoActualMostrada} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-500" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold uppercase text-xs sm:text-sm text-white truncate">
                              {formRepuesto.descripcion || 'Sin descripción'}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400 truncate">
                              {formRepuesto.marca_producto || 'GENÉRICO'} • {formRepuesto.modelo_vehiculo || 'Universal'} • {formRepuesto.linea || 'General'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-mono text-[10px] font-black">
                                {formRepuesto.codigo_corto || formRepuesto.referencia || 'SIN CÓDIGO'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Stock: <strong className="text-white">{formRepuesto.stock || 0}</strong> {formRepuesto.unidad || 'UND'}
                              </span>
                              {formRepuesto.ubicacion_fisica && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  • Ubic: <strong className="text-white">{formRepuesto.ubicacion_fisica}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 block">
                              {formatUSD(formRepuesto.precio_detal_usd || 0)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {formatVES((parseFloat(formRepuesto.precio_detal_usd) || 0) * (parseVenezuelanNumber(tasaBCV) || 1))}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>

              {/* FOOTER DEL MODAL - NAVEGACIÓN PASO A PASO */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#070A12] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Paso {pasoModalRepuesto} de 4: {PASOS_MODAL_REPUESTO.find(p => p.id === pasoModalRepuesto)?.label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black text-emerald-600 text-base leading-none">
                        {formatUSD(formRepuesto.precio_detal_usd || 0)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        ≈ {formatVES((parseFloat(formRepuesto.precio_detal_usd) || 0) * (parseVenezuelanNumber(tasaBCV) || 1))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalRepuestoAbierto(false)}
                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-xs"
                  >
                    Cancelar
                  </button>

                  {pasoModalRepuesto > 1 && (
                    <button
                      type="button"
                      onClick={retrocederPasoModal}
                      className="h-10 px-4 bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-xs flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>
                  )}

                  {pasoModalRepuesto < 4 ? (
                    <button
                      type="button"
                      onClick={avanzarPasoModal}
                      className="h-10 px-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl shadow-md shadow-red-500/25 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 text-xs"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={guardandoRepuesto}
                      className="h-10 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl shadow-md shadow-red-500/25 cursor-pointer transition-all active:scale-95 flex items-center gap-2 text-xs disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{guardandoRepuesto ? 'Guardando...' : repuestoEditandoId ? 'Guardar Cambios' : 'Registrar Repuesto'}</span>
                    </button>
                  )}
                </div>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA REGISTRAR ABONO EN CUENTAS POR COBRAR                          */}
      {/* ========================================================================= */}
      {modalAbonoAbierto && cuentaActivaAbono && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalAbonoAbierto(false); }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/15 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Registrar Abono a Crédito</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalAbonoAbierto(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#06080F] border border-slate-200 dark:border-white/10 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">
                {cuentaActivaAbono.cliente_nombre}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Cédula: {cuentaActivaAbono.cliente_cedula_rif || 'S/N'}
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-white/10 font-mono">
                <span className="text-slate-500">Saldo pendiente:</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {formatUSD(cuentaActivaAbono.saldo_pendiente_usd)}
                </span>
              </div>
            </div>

            <form onSubmit={confirmarAbono} className="space-y-4 text-xs">
              <div>
                <label className="font-mono font-bold text-slate-600 dark:text-slate-300 uppercase block mb-1">
                  Monto del Abono en Dólares ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={cuentaActivaAbono.saldo_pendiente_usd}
                  required
                  value={montoAbonoUSD}
                  onChange={(e) => setMontoAbonoUSD(e.target.value)}
                  placeholder="Ej. 25.00"
                  className="w-full h-11 px-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl font-mono font-black text-base text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                {montoAbonoUSD > 0 && (
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Equivalente: {formatVES(parseFloat(montoAbonoUSD) * (parseVenezuelanNumber(tasaBCV) || 1))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono font-bold text-slate-600 dark:text-slate-300 uppercase block mb-1">
                  Forma de Recepción del Abono
                </label>
                <select
                  value={metodoAbono}
                  onChange={(e) => setMetodoAbono(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#06080F] border border-slate-300 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="EFECTIVO">Efectivo ($ Divisa / Bs.)</option>
                  <option value="PAGO_MOVIL">Pago Móvil / Transferencia</option>
                  <option value="PUNTO">Punto de Venta</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbonoAbierto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAbono}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {guardandoAbono ? 'Registrando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL UNIVERSAL PARA CREACIÓN RÁPIDA DE CLASIFICACIONES                  */}
      {/* (LÍNEAS, SUBLÍNEAS/PIEZAS, MARCAS Y VEHÍCULOS)                           */}
      {/* ========================================================================= */}
      {modalRapido.abierto && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' }); }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-2 border-slate-300 dark:border-white/15 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleIn"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0 ${
                  modalRapido.tipo === 'linea'
                    ? 'bg-blue-600/10 text-blue-600 border-blue-500/25'
                    : modalRapido.tipo === 'sublinea'
                    ? 'bg-amber-600/10 text-amber-600 border-amber-500/25'
                    : modalRapido.tipo === 'marca'
                    ? 'bg-emerald-600/10 text-emerald-600 border-emerald-500/25'
                    : 'bg-purple-600/10 text-purple-600 border-purple-500/25'
                }`}>
                  {modalRapido.tipo === 'linea' && <Layers className="w-5 h-5" />}
                  {modalRapido.tipo === 'sublinea' && <Plus className="w-5 h-5 stroke-[3]" />}
                  {modalRapido.tipo === 'marca' && <Tag className="w-5 h-5" />}
                  {modalRapido.tipo === 'modelo' && <Car className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {modalRapido.tipo === 'linea' && 'Crear Nueva Línea Automotriz'}
                    {modalRapido.tipo === 'sublinea' && `Agregar Pieza a: ${modalRapido.lineaPadre || lineaActivaMaster}`}
                    {modalRapido.tipo === 'marca' && 'Registrar Nueva Marca'}
                    {modalRapido.tipo === 'modelo' && 'Registrar Nuevo Vehículo'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {modalRapido.tipo === 'linea' && 'Sistema automotriz principal (ej: Motor, Frenos, Dirección)'}
                    {modalRapido.tipo === 'sublinea' && `Asociada a "${modalRapido.lineaPadre || lineaActivaMaster}"`}
                    {modalRapido.tipo === 'marca' && 'Fabricante de repuestos (ej: Bosch, Denso, Monroe)'}
                    {modalRapido.tipo === 'modelo' && 'Modelo compatible (ej: Toyota Corolla, Chevrolet Spark)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' })}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const val = (modalRapido.valor || '').trim();
                if (!val) {
                  mostrarNotificacion('Por favor escribe un nombre antes de guardar.', 'warning');
                  return;
                }
                if (modalRapido.tipo === 'linea') {
                  const res = agregarNuevaLinea(val);
                  if (res) setLineaActivaMaster(res);
                } else if (modalRapido.tipo === 'sublinea') {
                  agregarNuevaSublinea(val, modalRapido.lineaPadre || lineaActivaMaster);
                } else if (modalRapido.tipo === 'marca') {
                  agregarNuevaMarca(val);
                } else if (modalRapido.tipo === 'modelo') {
                  agregarNuevoModelo(val);
                }
                setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                  {modalRapido.tipo === 'linea' && 'Nombre del Sistema Automotriz *'}
                  {modalRapido.tipo === 'sublinea' && `Nombre de la Pieza para "${modalRapido.lineaPadre || lineaActivaMaster}" *`}
                  {modalRapido.tipo === 'marca' && 'Nombre de la Marca de Repuesto *'}
                  {modalRapido.tipo === 'modelo' && 'Marca y Modelo del Vehículo *'}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={modalRapido.valor}
                  onChange={(e) => setModalRapido(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder={
                    modalRapido.tipo === 'linea' ? 'Ej. Suspensión Neumática, Aire Acondicionado...' :
                    modalRapido.tipo === 'sublinea' ? 'Ej. Pastillas de Freno, Terminal de Dirección, Disco...' :
                    modalRapido.tipo === 'marca' ? 'Ej. VALVOLINE, AISIN, BREMBO, BOSCH...' :
                    'Ej. Toyota Corolla, Chevrolet Aveo, Ford Fiesta...'
                  }
                  className={`w-full h-11 px-3.5 bg-slate-50 dark:bg-[#06080F] border-2 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:outline-none transition-all ${
                    modalRapido.tipo === 'linea'
                      ? 'border-blue-500/40 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                      : modalRapido.tipo === 'sublinea'
                      ? 'border-amber-500/40 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20'
                      : modalRapido.tipo === 'marca'
                      ? 'border-emerald-500/40 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 uppercase'
                      : 'border-purple-500/40 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalRapido({ abierto: false, tipo: 'linea', valor: '', lineaPadre: '' })}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    modalRapido.tipo === 'linea'
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : modalRapido.tipo === 'sublinea'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : modalRapido.tipo === 'marca'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>
                    {modalRapido.tipo === 'linea' && 'Crear Línea'}
                    {modalRapido.tipo === 'sublinea' && 'Agregar Pieza'}
                    {modalRapido.tipo === 'marca' && 'Registrar Marca'}
                    {modalRapido.tipo === 'modelo' && 'Registrar Vehículo'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA EDITAR NOMBRE DE CLASIFICACIÓN (LÍNEA, SUBLÍNEA, MARCA, MODELO) */}
      {/* ========================================================================= */}
      {modalEditar.abierto && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 }); }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-2 border-blue-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleIn"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Modificar Nombre de {modalEditar.tipo === 'linea' ? 'Línea Automotriz' : modalEditar.tipo === 'sublinea' ? 'Pieza / Sublínea' : modalEditar.tipo === 'marca' ? 'Marca' : 'Modelo de Vehículo'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Nombre actual: <span className="font-bold text-slate-800 dark:text-slate-200">"{modalEditar.nombreActual}"</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 })}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={confirmarEdicion} className="space-y-4">
              <div>
                <label className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                  Nuevo Nombre *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={modalEditar.nuevoNombre}
                  onChange={(e) => setModalEditar(prev => ({ ...prev, nuevoNombre: e.target.value }))}
                  placeholder={`Nuevo nombre para ${modalEditar.nombreActual}...`}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-[#06080F] border-2 border-blue-500/40 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:outline-none transition-all"
                />
              </div>

              {modalEditar.conteoAfectados > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium">
                  💡 <strong>Actualización sincronizada:</strong> Hay <strong>{modalEditar.conteoAfectados}</strong> repuesto(s) en tu inventario con esta clasificación. Al guardar, se actualizarán automáticamente.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalEditar({ abierto: false, tipo: 'linea', nombreActual: '', lineaPadre: '', nuevoNombre: '', conteoAfectados: 0 })}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN SEGURA PARA ELIMINAR CLASIFICACIÓN                 */}
      {/* ========================================================================= */}
      {modalConfirmarEliminar.abierto && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalConfirmarEliminar({ abierto: false, tipo: 'linea', nombre: '', lineaPadre: '', conteoAfectados: 0 }); }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B0F19] border-2 border-rose-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleIn"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    ¿Eliminar {modalConfirmarEliminar.tipo === 'linea' ? 'Línea Automotriz' : modalConfirmarEliminar.tipo === 'sublinea' ? 'Pieza' : modalConfirmarEliminar.tipo === 'marca' ? 'Marca de Repuesto' : 'Modelo de Vehículo'}?
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Confirmación de seguridad requerida
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConfirmarEliminar({ abierto: false, tipo: 'linea', nombre: '', lineaPadre: '', conteoAfectados: 0 })}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Elemento a Eliminar */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">
                  {modalConfirmarEliminar.tipo === 'linea' ? 'Sistema Automotriz:' : modalConfirmarEliminar.tipo === 'sublinea' ? 'Pieza / Repuesto:' : modalConfirmarEliminar.tipo === 'marca' ? 'Marca:' : 'Vehículo:'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black ${
                  modalConfirmarEliminar.conteoAfectados > 0 
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {modalConfirmarEliminar.conteoAfectados} repuesto(s)
                </span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                "{modalConfirmarEliminar.nombre}"
              </div>
              {modalConfirmarEliminar.lineaPadre && (
                <div className="text-[11px] font-mono text-slate-400">
                  Perteneciente al sistema: <strong>{modalConfirmarEliminar.lineaPadre}</strong>
                </div>
              )}
            </div>

            {/* Advertencia / Explicación según impacto */}
            {modalConfirmarEliminar.conteoAfectados > 0 ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-700 dark:text-rose-300 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>Protección de Inventario Activa:</span>
                </div>
                <p>
                  Hay <strong>{modalConfirmarEliminar.conteoAfectados}</strong> repuesto(s) en tu inventario que usan esta clasificación. Si la eliminas, esos repuestos se reasignarán automáticamente a <strong>"General"</strong> para que nunca pierdas datos ni stock.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>No hay repuestos registrados con este nombre. Se eliminará de tu catálogo de manera completamente limpia.</span>
              </div>
            )}

            <div className="text-xs text-slate-600 dark:text-slate-300 font-bold text-center pt-1">
              ¿Estás seguro de que deseas eliminarla del catálogo?
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setModalConfirmarEliminar({ abierto: false, tipo: 'linea', nombre: '', lineaPadre: '', conteoAfectados: 0 })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                No, Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacion}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Seguro</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Zoom Foto de Repuesto AutoZone */}
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

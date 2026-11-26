import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Check, Plus } from 'lucide-react';

export const normalizarBusqueda = (str) => {
  if (str == null) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const defaultGetLabel = (item) => (item != null ? String(item) : '');
const defaultGetFilterText = (item) => (item != null ? String(item) : '');
const defaultCreateNewLabel = (query) => `Crear "${query}"`;

/**
 * Combobox buscable insensible a acentos con menú flotante via Portal
 * (evita recortes dentro de modales con overflow-y-auto y se adapta arriba/abajo).
 */
export default function SearchableCombobox({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Buscar o escribir...',
  emptyOptionLabel = null,
  getLabel = defaultGetLabel,
  getFilterText = defaultGetFilterText,
  onCreateNew,
  createNewLabel = defaultCreateNewLabel,
  required = false,
  uppercase = false,
  compact = false,
  hideStatusBadge = false,
  commitNewOnBlur = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState(() => (value ? getLabel(value) : ''));
  const [haTipeado, setHaTipeado] = useState(false);
  const [menuPos, setMenuPos] = useState(null);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const prevValueRef = useRef(value);

  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;

  const getFilterTextRef = useRef(getFilterText);
  getFilterTextRef.current = getFilterText;

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setHaTipeado(false);
      setFiltroTexto(value ? getLabelRef.current(value) : '');
      return;
    }
    if (!haTipeado && !abierto) {
      setFiltroTexto(value ? getLabelRef.current(value) : '');
    }
  }, [value, haTipeado, abierto]);

  const calcularPosicionMenu = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const margin = 8;
    const espacioAbajo = vh - rect.bottom - margin;
    const espacioArriba = rect.top - margin;

    const abrirArriba = espacioAbajo < 190 && espacioArriba > espacioAbajo;
    const maxHeight = Math.max(
      140,
      Math.min(256, abrirArriba ? espacioArriba - 6 : espacioAbajo - 6)
    );

    const width = Math.min(Math.max(rect.width, 240), vw - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, vw - width - margin));

    setMenuPos({
      left,
      width,
      maxHeight,
      abrirArriba,
      top: abrirArriba ? undefined : rect.bottom + 6,
      bottom: abrirArriba ? vh - rect.top + 6 : undefined,
    });
  }, []);

  useLayoutEffect(() => {
    if (!abierto) {
      setMenuPos(null);
      return;
    }

    calcularPosicionMenu();

    const handleScroll = (e) => {
      if (menuRef.current && (e.target === menuRef.current || menuRef.current.contains(e.target))) {
        return;
      }
      calcularPosicionMenu();
    };

    const handleResize = () => calcularPosicionMenu();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [abierto, calcularPosicionMenu]);

  const confirmarTextoAlSalir = useCallback(() => {
    setAbierto(false);
    if (!haTipeado) {
      setFiltroTexto(value ? getLabelRef.current(value) : '');
      return;
    }
    const textoLimpio = filtroTexto.trim();
    if (!textoLimpio) {
      onChange('');
      setFiltroTexto('');
    } else {
      const qNorm = normalizarBusqueda(textoLimpio);
      const match = options.find(
        (opt) =>
          normalizarBusqueda(opt) === qNorm ||
          normalizarBusqueda(getLabelRef.current(opt)) === qNorm
      );
      if (match) {
        onChange(match);
        setFiltroTexto(getLabelRef.current(match));
      } else if (onCreateNew && commitNewOnBlur) {
        const creado = onCreateNew(uppercase ? textoLimpio.toUpperCase() : textoLimpio);
        if (creado) {
          onChange(creado);
          setFiltroTexto(getLabelRef.current(creado));
        } else {
          setFiltroTexto(value ? getLabelRef.current(value) : '');
        }
      } else {
        setFiltroTexto(value ? getLabelRef.current(value) : '');
      }
    }
    setHaTipeado(false);
  }, [value, haTipeado, filtroTexto, options, onChange, onCreateNew, commitNewOnBlur, uppercase]);

  useEffect(() => {
    function handlePointerOutside(e) {
      const insideTrigger = containerRef.current && containerRef.current.contains(e.target);
      const insideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (insideTrigger || insideMenu) return;
      confirmarTextoAlSalir();
    }

    document.addEventListener('pointerdown', handlePointerOutside);
    return () => document.removeEventListener('pointerdown', handlePointerOutside);
  }, [confirmarTextoAlSalir]);

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
          fText.includes(palabra) || lText.includes(palabra) || rawText.includes(palabra)
      );
    });
  }, [options, filtroTexto, haTipeado]);

  const seleccionarOpcion = (opt) => {
    onChange(opt);
    setFiltroTexto(opt ? getLabelRef.current(opt) : '');
    setHaTipeado(false);
    setAbierto(false);
  };

  const handleInputChange = (e) => {
    const val = uppercase ? e.target.value.toUpperCase() : e.target.value;
    setFiltroTexto(val);
    setHaTipeado(true);
    setAbierto(true);
    if (!val && emptyOptionLabel && value) {
      onChange('');
    }
  };

  const handleCrearNuevo = (nuevoTexto) => {
    const textoFinal = (nuevoTexto || filtroTexto).trim();
    if (!textoFinal) return;
    if (onCreateNew) {
      const creado = onCreateNew(uppercase ? textoFinal.toUpperCase() : textoFinal);
      if (creado) {
        onChange(creado);
        setFiltroTexto(getLabelRef.current(creado));
      }
    }
    setHaTipeado(false);
    setAbierto(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emptyOptionLabel && !filtroTexto.trim()) {
        seleccionarOpcion('');
      } else if (opcionesFiltradas.length > 0) {
        seleccionarOpcion(opcionesFiltradas[0]);
      } else if (onCreateNew && filtroTexto.trim()) {
        handleCrearNuevo(filtroTexto.trim());
      } else {
        setAbierto(false);
      }
    } else if (e.key === 'Tab' && abierto) {
      confirmarTextoAlSalir();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
      setAbierto(false);
      setHaTipeado(false);
      setFiltroTexto(value ? getLabelRef.current(value) : '');
    }
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
    setFiltroTexto('');
    setHaTipeado(false);
    setAbierto(true);
    inputRef.current?.focus();
  };

  const esCoincidenciaExacta = useMemo(() => {
    const qNorm = normalizarBusqueda(filtroTexto);
    if (!qNorm) return false;
    return options.some(
      (opt) =>
        normalizarBusqueda(opt) === qNorm ||
        normalizarBusqueda(getLabelRef.current(opt)) === qNorm
    );
  }, [filtroTexto, options]);

  const dropdownPortal =
    abierto &&
    menuPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: `${menuPos.left}px`,
          width: `${menuPos.width}px`,
          maxHeight: `${menuPos.maxHeight}px`,
          top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
          bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
          zIndex: 100000,
        }}
        className="overflow-y-auto bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl p-1.5 text-xs space-y-0.5 animate-fade-in"
      >
        {emptyOptionLabel && (!haTipeado || !filtroTexto.trim()) && (
          <button
            type="button"
            onClick={() => seleccionarOpcion('')}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/[0.06] mb-1 ${
              !value
                ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            }`}
          >
            <span className="truncate">{emptyOptionLabel}</span>
            {!value && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
          </button>
        )}

        {opcionesFiltradas.length > 0 ? (
          <>
            {opcionesFiltradas.map((opt) => {
              const labelOpt = getLabelRef.current(opt);
              const estaSeleccionado =
                value && value.trim().toLowerCase() === opt.trim().toLowerCase();

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => seleccionarOpcion(opt)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    estaSeleccionado
                      ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{labelOpt}</span>
                  {estaSeleccionado && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                </button>
              );
            })}

            {onCreateNew && haTipeado && filtroTexto.trim() && !esCoincidenciaExacta && (
              <button
                type="button"
                onClick={() => handleCrearNuevo(filtroTexto.trim())}
                className="w-full text-left px-3 py-2 mt-1 rounded-lg border-t border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{createNewLabel(filtroTexto.trim())}</span>
              </button>
            )}
          </>
        ) : (
          <div className="px-3 py-3 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <p className="text-xs">Sin resultados para "{filtroTexto}"</p>
            {onCreateNew && filtroTexto.trim() && (
              <button
                type="button"
                onClick={() => handleCrearNuevo(filtroTexto.trim())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{createNewLabel(filtroTexto.trim())}</span>
              </button>
            )}
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label
          className={`flex items-center justify-between gap-2 font-semibold ${
            compact
              ? 'text-[11px] text-slate-600 dark:text-slate-400 mb-1'
              : 'text-xs text-slate-700 dark:text-slate-300 mb-1.5'
          }`}
        >
          <span>{label}</span>
          {!hideStatusBadge &&
            (value ? (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Seleccionado
              </span>
            ) : required ? (
              <span className="text-[11px] text-amber-600 dark:text-amber-400">Obligatorio</span>
            ) : null)}
        </label>
      )}

      <div ref={triggerRef} className="relative flex items-center">
        <Search
          className={`w-3.5 h-3.5 text-slate-400 absolute pointer-events-none ${
            compact ? 'left-2.5' : 'left-3'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={filtroTexto}
          onChange={handleInputChange}
          onFocus={(e) => {
            setAbierto(true);
            if (value && !haTipeado) {
              e.target.select();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || emptyOptionLabel || 'Buscar o escribir...'}
          className={`input-field ${
            compact
              ? 'h-9 pl-8 pr-12 text-xs font-medium'
              : 'h-10 pl-9 pr-14 font-semibold'
          } ${
            abierto
              ? 'border-red-500 ring-2 ring-red-500/15'
              : compact && value
                ? 'border-red-500 ring-1 ring-red-500/20'
                : ''
          }`}
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {filtroTexto && (
            <button
              type="button"
              onClick={limpiar}
              aria-label="Borrar selección"
              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setAbierto((prev) => !prev);
              if (!abierto) inputRef.current?.focus();
            }}
            aria-label={abierto ? 'Cerrar opciones' : 'Desplegar opciones'}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                abierto ? 'rotate-180 text-red-500' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {dropdownPortal}
    </div>
  );
}

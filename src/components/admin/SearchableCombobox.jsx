import React, { useState, useEffect, useRef, useMemo } from 'react';
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
 * Combobox buscable insensible a acentos con opción de creación rápida.
 */
export default function SearchableCombobox({
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
  const [filtroTexto, setFiltroTexto] = useState(() => (value ? getLabel(value) : ''));
  const [haTipeado, setHaTipeado] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;

  const getFilterTextRef = useRef(getFilterText);
  getFilterTextRef.current = getFilterText;

  useEffect(() => {
    if (!haTipeado) {
      setFiltroTexto(value ? getLabelRef.current(value) : '');
    }
  }, [value, haTipeado]);

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
            const match = options.find(
              (opt) =>
                normalizarBusqueda(opt) === qNorm ||
                normalizarBusqueda(getLabelRef.current(opt)) === qNorm
            );
            if (match) {
              onChange(match);
              setFiltroTexto(getLabelRef.current(match));
            } else {
              setFiltroTexto(value ? getLabelRef.current(value) : '');
            }
          }
          setHaTipeado(false);
        } else {
          setFiltroTexto(value ? getLabelRef.current(value) : '');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, haTipeado, filtroTexto, options, onChange]);

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
    setFiltroTexto(getLabelRef.current(opt));
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
        setFiltroTexto(getLabelRef.current(creado));
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

  return (
    <div className={`relative ${abierto ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {value ? (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Seleccionado
            </span>
          ) : required ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400">Obligatorio</span>
          ) : null}
        </label>
      )}

      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={filtroTexto}
          onChange={handleInputChange}
          onFocus={() => setAbierto(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input-field h-10 pl-9 pr-14 font-semibold ${abierto ? 'border-red-500 ring-2 ring-red-500/15' : ''
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
              className={`w-3.5 h-3.5 transition-transform duration-150 ${abierto ? 'rotate-180 text-red-500' : ''
                }`}
            />
          </button>
        </div>
      </div>

      {abierto && (
        <div className="absolute z-[70] left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-white/[0.06] animate-fade-in">
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
                    className={`w-full text-left px-3 py-2 font-semibold flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors ${estaSeleccionado
                      ? 'text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-500/10'
                      : 'text-slate-800 dark:text-slate-200'
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
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5 cursor-pointer"
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
        </div>
      )}
    </div>
  );
}

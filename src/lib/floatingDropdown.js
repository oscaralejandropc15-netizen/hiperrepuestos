import { useState, useEffect, useLayoutEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 640;

export function calcularPosicionFloating(el, maxDesired = 260, minWidthPx = 0) {
  if (!el || typeof window === 'undefined') return null;

  const rect = el.getBoundingClientRect();
  const vv = window.visualViewport;
  const vvTop = vv?.offsetTop || 0;
  const vvLeft = vv?.offsetLeft || 0;
  const vvHeight = vv?.height || window.innerHeight || document.documentElement.clientHeight;
  const vvWidth = vv?.width || window.innerWidth || document.documentElement.clientWidth;

  const margin = 8;
  const espacioAbajo = vvTop + vvHeight - rect.bottom - margin;
  const espacioArriba = rect.top - vvTop - margin;
  const abrirArriba = espacioAbajo < 150 && espacioArriba > espacioAbajo;

  const maxHeight = Math.max(
    120,
    Math.min(maxDesired, abrirArriba ? espacioArriba - 6 : espacioAbajo - 6)
  );

  const desiredWidth = Math.max(rect.width, minWidthPx);
  const width = Math.min(desiredWidth, vvWidth - margin * 2);
  const left = Math.max(margin + vvLeft, Math.min(rect.left, vvLeft + vvWidth - width - margin));
  const layoutVh = window.innerHeight || document.documentElement.clientHeight;

  return {
    left,
    width,
    maxHeight,
    abrirArriba,
    top: abrirArriba ? undefined : rect.bottom + 6,
    bottom: abrirArriba ? layoutVh - rect.top + 6 : undefined,
  };
}

/**
 * Posiciona listas desplegables adaptándose a móvil y escritorio:
 * - En teléfono (< 640px): se renderiza inline debajo del input para que el teclado iOS/Android
 *   nunca desplace el Portal encima de lo que se escribe.
 * - En tablet/PC (>= 640px): usa Portal fixed sincronizado con window.visualViewport.
 */
export function useFloatingDropdown(
  isOpen,
  triggerRef,
  menuRef,
  { maxDesired = 260, minWidthPx = 0 } = {}
) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [menuPos, setMenuPos] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const updateSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const actualizarPosicion = useCallback(() => {
    setMenuPos(calcularPosicionFloating(triggerRef.current, maxDesired, minWidthPx));
  }, [triggerRef, maxDesired, minWidthPx]);

  useLayoutEffect(() => {
    if (!isOpen || isMobile) {
      setMenuPos(null);
      return undefined;
    }

    actualizarPosicion();

    const handleScroll = (e) => {
      if (menuRef.current && (e.target === menuRef.current || menuRef.current.contains(e.target))) {
        return;
      }
      actualizarPosicion();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', actualizarPosicion);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', actualizarPosicion);
    vv?.addEventListener('scroll', actualizarPosicion);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', actualizarPosicion);
      vv?.removeEventListener('resize', actualizarPosicion);
      vv?.removeEventListener('scroll', actualizarPosicion);
    };
  }, [isOpen, isMobile, actualizarPosicion, menuRef]);

  useEffect(() => {
    if (!isOpen || !isMobile) return undefined;
    const timer = setTimeout(() => {
      triggerRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }, 180);
    return () => clearTimeout(timer);
  }, [isOpen, isMobile, triggerRef]);

  return { isMobile, menuPos };
}

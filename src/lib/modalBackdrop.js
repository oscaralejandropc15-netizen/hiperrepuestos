const backdropPointerDownMap = new WeakMap();

/**
 * Cierra un modal únicamente si tanto el inicio del clic (pointerdown) como
 * el fin del clic (click) ocurrieron directamente sobre el fondo oscuro.
 * Evita que el modal se cierre al sombrear/seleccionar texto dentro de un input
 * y soltar el cursor fuera del cuadro.
 */
export function getBackdropProps(onClose, enabled = true) {
  return {
    onPointerDown: (e) => {
      backdropPointerDownMap.set(e.currentTarget, e.target === e.currentTarget);
    },
    onClick: (e) => {
      const startedOnBackdrop = backdropPointerDownMap.get(e.currentTarget) === true;
      backdropPointerDownMap.delete(e.currentTarget);
      if (enabled && startedOnBackdrop && e.target === e.currentTarget) {
        onClose?.();
      }
    },
  };
}

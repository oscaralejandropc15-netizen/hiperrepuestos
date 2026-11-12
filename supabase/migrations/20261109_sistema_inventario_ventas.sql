-- ==============================================================================
-- SISTEMA DE CONTROL DE INVENTARIO, VENTAS Y CUENTAS POR COBRAR
-- Hiper Repuestos Familycar C.A. - Supabase Migration
-- Fecha: 2026-11-09
-- ==============================================================================

-- 1. TIPOS ENUM PERSONALIZADOS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_enum') THEN
    CREATE TYPE tipo_documento_enum AS ENUM ('factura_fiscal', 'nota_entrega');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pago_enum') THEN
    CREATE TYPE estado_pago_enum AS ENUM ('pagado', 'pendiente', 'abonado');
  END IF;
END $$;

-- 2. TABLA: PRODUCTOS (INVENTARIO AUTOMOTRIZ)
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_corto VARCHAR(50) NOT NULL UNIQUE,     -- Ej: 'MD-COR-09', 'BUJ-NGK-01'
  referencia TEXT,                              -- Nro de parte original / OEM
  descripcion TEXT NOT NULL,                    -- Nombre del repuesto
  marca TEXT,                                   -- Ej: Gabriel, NGK, Bosch
  medidas TEXT,                                 -- Ej: 12x1.5, Delantero, etc.
  ubicacion_fisica TEXT,                        -- Ej: Pasillo 2, Estante B-4
  costo_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  precio_detal_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  precio_taller_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  precio_mayor_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  aplica_iva BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida de repuestos
CREATE INDEX IF NOT EXISTS idx_productos_codigo_corto ON public.productos (codigo_corto);
CREATE INDEX IF NOT EXISTS idx_productos_descripcion ON public.productos USING gin (to_tsvector('spanish', descripcion));
CREATE INDEX IF NOT EXISTS idx_productos_marca ON public.productos (marca);

-- 3. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula_rif VARCHAR(30) NOT NULL UNIQUE,       -- Ej: V-12.345.678 o J-41265448-9
  nombre TEXT NOT NULL,                         -- Nombre o Razón Social
  telefono VARCHAR(50),
  direccion TEXT,
  limite_credito_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_cedula_rif ON public.clientes (cedula_rif);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes (nombre);

-- 4. MODIFICACIÓN: TABLA guias_despacho (VENTAS / FACTURAS / NOTAS)
ALTER TABLE public.guias_despacho
  ADD COLUMN IF NOT EXISTS tipo_documento tipo_documento_enum DEFAULT 'factura_fiscal',
  ADD COLUMN IF NOT EXISTS subtotal_usd NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS monto_recargo_cashea_usd NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS monto_iva_usd NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_usd NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS estado_pago estado_pago_enum DEFAULT 'pagado',
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Índices en guias_despacho para rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_guias_cliente_id ON public.guias_despacho (cliente_id);
CREATE INDEX IF NOT EXISTS idx_guias_estado_pago ON public.guias_despacho (estado_pago);
CREATE INDEX IF NOT EXISTS idx_guias_tipo_documento ON public.guias_despacho (tipo_documento);

-- 5. MEJORA EN items_guia (VINCULACIÓN CON INVENTARIO)
ALTER TABLE public.items_guia
  ADD COLUMN IF NOT EXISTS producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_precio VARCHAR(30) DEFAULT 'detal',
  ADD COLUMN IF NOT EXISTS costo_unitario_usd NUMERIC(12, 2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_items_guia_producto_id ON public.items_guia (producto_id);

-- 6. TABLA: CUENTAS POR COBRAR (FIADOS Y CRÉDITOS)
CREATE TABLE IF NOT EXISTS public.cuentas_cobrar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guia_id UUID NOT NULL REFERENCES public.guias_despacho(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  monto_total_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  monto_abonado_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  saldo_pendiente_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento DATE,
  estado estado_pago_enum NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_guia ON public.cuentas_cobrar (guia_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_cliente ON public.cuentas_cobrar (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_estado ON public.cuentas_cobrar (estado);

-- 7. TABLA: ABONOS (HISTORIAL DE PAGOS A CUENTAS POR COBRAR)
CREATE TABLE IF NOT EXISTS public.abonos_cuentas_cobrar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_cobrar_id UUID NOT NULL REFERENCES public.cuentas_cobrar(id) ON DELETE CASCADE,
  monto_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  monto_bs NUMERIC(14, 2) DEFAULT 0.00,
  tasa_bcv NUMERIC(12, 4) DEFAULT 1.0000,
  forma_pago VARCHAR(50) NOT NULL DEFAULT 'PAGO_MOVIL',
  referencia TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abonos_cuenta_cobrar ON public.abonos_cuentas_cobrar (cuenta_cobrar_id);

-- 8. TRIGGERS AUTOMÁTICOS DE INVENTARIO (DESCUENTO Y REPOSICIÓN DE STOCK)

-- A) Descontar stock al insertar un renglón vendido
CREATE OR REPLACE FUNCTION public.fn_descontar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.producto_id IS NOT NULL AND NEW.cantidad > 0 THEN
    UPDATE public.productos
    SET stock = GREATEST(0, stock - NEW.cantidad),
        updated_at = now()
    WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_descontar_stock_venta ON public.items_guia;
CREATE TRIGGER trg_descontar_stock_venta
AFTER INSERT ON public.items_guia
FOR EACH ROW
EXECUTE FUNCTION public.fn_descontar_stock_venta();

-- B) Reponer stock si se anula o elimina un renglón de venta
CREATE OR REPLACE FUNCTION public.fn_restaurar_stock_anulacion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.producto_id IS NOT NULL AND OLD.cantidad > 0 THEN
    UPDATE public.productos
    SET stock = stock + OLD.cantidad,
        updated_at = now()
    WHERE id = OLD.producto_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurar_stock_anulacion ON public.items_guia;
CREATE TRIGGER trg_restaurar_stock_anulacion
AFTER DELETE ON public.items_guia
FOR EACH ROW
EXECUTE FUNCTION public.fn_restaurar_stock_anulacion();

-- C) Actualizar saldo pendiente y estado al registrar un abono
CREATE OR REPLACE FUNCTION public.fn_actualizar_saldo_cuenta_cobrar()
RETURNS TRIGGER AS $$
DECLARE
  v_total_abonado NUMERIC(12, 2);
  v_monto_total NUMERIC(12, 2);
  v_nuevo_saldo NUMERIC(12, 2);
  v_nuevo_estado estado_pago_enum;
BEGIN
  SELECT monto_total_usd INTO v_monto_total 
  FROM public.cuentas_cobrar 
  WHERE id = NEW.cuenta_cobrar_id;

  SELECT COALESCE(SUM(monto_usd), 0) INTO v_total_abonado 
  FROM public.abonos_cuentas_cobrar 
  WHERE cuenta_cobrar_id = NEW.cuenta_cobrar_id;

  v_nuevo_saldo := GREATEST(0, v_monto_total - v_total_abonado);

  IF v_nuevo_saldo <= 0 THEN
    v_nuevo_estado := 'pagado';
  ELSE
    v_nuevo_estado := 'abonado';
  END IF;

  UPDATE public.cuentas_cobrar
  SET monto_abonado_usd = v_total_abonado,
      saldo_pendiente_usd = v_nuevo_saldo,
      estado = v_nuevo_estado,
      updated_at = now()
  WHERE id = NEW.cuenta_cobrar_id;

  -- Actualizar también el estado de la venta vinculada
  UPDATE public.guias_despacho
  SET estado_pago = v_nuevo_estado
  WHERE id = (SELECT guia_id FROM public.cuentas_cobrar WHERE id = NEW.cuenta_cobrar_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_saldo_abono ON public.abonos_cuentas_cobrar;
CREATE TRIGGER trg_actualizar_saldo_abono
AFTER INSERT ON public.abonos_cuentas_cobrar
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_saldo_cuenta_cobrar();

-- 9. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_cuentas_cobrar ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso completo (operaciones del mostrador)
DROP POLICY IF EXISTS "Acceso total a productos" ON public.productos;
CREATE POLICY "Acceso total a productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a clientes" ON public.clientes;
CREATE POLICY "Acceso total a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a cuentas_cobrar" ON public.cuentas_cobrar;
CREATE POLICY "Acceso total a cuentas_cobrar" ON public.cuentas_cobrar FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a abonos_cuentas_cobrar" ON public.abonos_cuentas_cobrar;
CREATE POLICY "Acceso total a abonos_cuentas_cobrar" ON public.abonos_cuentas_cobrar FOR ALL USING (true) WITH CHECK (true);

-- 10. MIGRAR CLIENTES EXISTENTES DESDE guias_despacho (SI EXISTIERAN)
INSERT INTO public.clientes (cedula_rif, nombre, telefono, direccion)
SELECT DISTINCT ON (cliente_documento)
  cliente_documento,
  COALESCE(NULLIF(TRIM(cliente_nombre), ''), 'CLIENTE MOSTRADOR'),
  cliente_telefono,
  cliente_direccion
FROM public.guias_despacho
WHERE cliente_documento IS NOT NULL AND TRIM(cliente_documento) != ''
ON CONFLICT (cedula_rif) DO NOTHING;

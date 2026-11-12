-- ============================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: CATÁLOGO B2B, VENTAS Y REGLAS CONTABLES
-- Hiper Repuestos - Sistema de Facturación y Control de Inventario
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACTUALIZAR TABLA PRODUCTOS PARA EL CATÁLOGO B2B Y FILTROS JERÁRQUICOS
-- ----------------------------------------------------------------------------
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS linea text,
  ADD COLUMN IF NOT EXISTS sublinea text,
  ADD COLUMN IF NOT EXISTS marca_producto text,
  ADD COLUMN IF NOT EXISTS modelo_vehiculo text,
  ADD COLUMN IF NOT EXISTS unidad text DEFAULT 'UND',
  ADD COLUMN IF NOT EXISTS en_oferta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS en_promocion boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS en_transito boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recien_llegado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS imagen_url text;

-- Sincronizar marca_producto con marca si ya existen registros
UPDATE productos 
SET marca_producto = marca 
WHERE marca_producto IS NULL AND marca IS NOT NULL;

-- Asignar líneas y modelos a los productos existentes para que no queden vacíos
UPDATE productos 
SET 
  linea = CASE 
    WHEN codigo_corto ILIKE 'MD-COR%' THEN 'Frenos'
    WHEN codigo_corto ILIKE 'BUJ%' THEN 'Motor'
    WHEN codigo_corto ILIKE 'AMOR%' THEN 'Suspensión'
    WHEN codigo_corto ILIKE 'FIL%' THEN 'Motor'
    WHEN codigo_corto ILIKE 'COR%' THEN 'Motor'
    ELSE COALESCE(linea, 'Tren Delantero')
  END,
  sublinea = CASE 
    WHEN codigo_corto ILIKE 'MD-COR%' THEN 'Pastillas de Freno'
    WHEN codigo_corto ILIKE 'BUJ%' THEN 'Bujía'
    WHEN codigo_corto ILIKE 'AMOR%' THEN 'Amortiguador'
    WHEN codigo_corto ILIKE 'FIL%' THEN 'Filtro de Aceite'
    WHEN codigo_corto ILIKE 'COR%' THEN 'Correa Distribución'
    ELSE COALESCE(sublinea, 'General')
  END,
  modelo_vehiculo = CASE 
    WHEN codigo_corto ILIKE 'MD-COR%' THEN 'Toyota Corolla'
    WHEN codigo_corto ILIKE 'AMOR%' THEN 'Chevrolet Aveo'
    WHEN codigo_corto ILIKE 'BUJ%' THEN 'Toyota / Chevrolet / Nissan'
    WHEN codigo_corto ILIKE 'FIL%' THEN 'Universal Rosca 3/4-16'
    WHEN codigo_corto ILIKE 'COR%' THEN 'Toyota / Hyundai / Kia'
    ELSE COALESCE(modelo_vehiculo, 'Universal')
  END,
  unidad = COALESCE(unidad, 'UND')
WHERE linea IS NULL OR modelo_vehiculo IS NULL;

-- Índices de alto rendimiento para búsqueda y filtrado rápido
CREATE INDEX IF NOT EXISTS idx_productos_linea ON productos (linea);
CREATE INDEX IF NOT EXISTS idx_productos_sublinea ON productos (sublinea);
CREATE INDEX IF NOT EXISTS idx_productos_marca_prod ON productos (marca_producto);
CREATE INDEX IF NOT EXISTS idx_productos_modelo_veh ON productos (modelo_vehiculo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_corto ON productos (codigo_corto);

-- ----------------------------------------------------------------------------
-- 2. INSERTAR DATOS DE PRUEBA (SEED DATA): 5 REPUESTOS REALES
-- ----------------------------------------------------------------------------
INSERT INTO productos (
  codigo_corto, 
  referencia, 
  descripcion, 
  linea, 
  sublinea, 
  marca_producto, 
  marca, 
  modelo_vehiculo, 
  unidad, 
  medidas, 
  ubicacion_fisica, 
  costo_usd, 
  precio_detal_usd, 
  precio_taller_usd, 
  precio_mayor_usd, 
  aplica_iva, 
  stock,
  en_oferta,
  en_promocion,
  en_transito,
  recien_llegado
) VALUES
  (
    'SB-3642',
    '43330-09290',
    'MUÑON INFERIOR DELANTERO TOYOTA COROLLA 2003-2014',
    'Tren Delantero',
    'Muñón',
    '555',
    '555',
    'Toyota Corolla',
    'UND',
    'Cono 15.8mm Rosca M12',
    'Pasillo 2, Estante T-1',
    11.50,
    18.50,
    16.00,
    14.50,
    true,
    24,
    false,
    false,
    false,
    true
  ),
  (
    '0986AB2015',
    '04465-0K090',
    'PASTILLAS DE FRENO DELANTERAS TOYOTA HILUX KAVAK / FORTUNER',
    'Frenos',
    'Pastillas de Freno',
    'BOSCH',
    'BOSCH',
    'Toyota Hilux',
    'JGO',
    'Juego 4 Pastillas Cerámica',
    'Pasillo 1, Estante F-4',
    17.00,
    28.00,
    24.50,
    22.00,
    true,
    12,
    true,
    false,
    false,
    false
  ),
  (
    'SE-4871',
    '93740701',
    'TERMINAL EXTERNO DIRECCION CHEVROLET OPTRA LIMITED / DESIGN',
    'Tren Delantero',
    'Terminal',
    'ATS',
    'ATS',
    'Chevrolet Optra',
    'UND',
    'Rosca M14x1.5 Izq/Der',
    'Pasillo 2, Estante D-2',
    7.00,
    12.00,
    10.50,
    9.00,
    true,
    18,
    false,
    true,
    false,
    false
  ),
  (
    'BM-2041',
    '2S61-3K155-AB',
    'BASE AMORTIGUADOR DELANTERO FORD FIESTA POWER / MAX / MOVE',
    'Suspensión',
    'Base Amortiguador',
    'GABRIEL',
    'GABRIEL',
    'Ford Fiesta',
    'UND',
    'Con Rodamiento Incluido',
    'Pasillo 4, Estante S-3',
    13.50,
    22.00,
    19.00,
    17.00,
    true,
    8,
    false,
    false,
    true,
    false
  ),
  (
    'BKR6E-11',
    '2756',
    'BUJIA DE ENCENDIDO COBRE NGK V-POWER (COROLLA / AVEO / YARIS)',
    'Motor',
    'Bujía',
    'NGK',
    'NGK',
    'Toyota Corolla',
    'UND',
    'Rosca 14mm Hex 16mm',
    'Gaveta A-1',
    2.20,
    4.50,
    4.00,
    3.50,
    true,
    50,
    false,
    false,
    false,
    true
  )
ON CONFLICT (codigo_corto) DO UPDATE SET
  referencia = EXCLUDED.referencia,
  descripcion = EXCLUDED.descripcion,
  linea = EXCLUDED.linea,
  sublinea = EXCLUDED.sublinea,
  marca_producto = EXCLUDED.marca_producto,
  marca = EXCLUDED.marca,
  modelo_vehiculo = EXCLUDED.modelo_vehiculo,
  unidad = EXCLUDED.unidad,
  medidas = EXCLUDED.medidas,
  ubicacion_fisica = EXCLUDED.ubicacion_fisica,
  costo_usd = EXCLUDED.costo_usd,
  precio_detal_usd = EXCLUDED.precio_detal_usd,
  precio_taller_usd = EXCLUDED.precio_taller_usd,
  precio_mayor_usd = EXCLUDED.precio_mayor_usd,
  aplica_iva = EXCLUDED.aplica_iva,
  stock = EXCLUDED.stock,
  en_oferta = EXCLUDED.en_oferta,
  en_promocion = EXCLUDED.en_promocion,
  en_transito = EXCLUDED.en_transito,
  recien_llegado = EXCLUDED.recien_llegado,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. TABLA DE VENTAS Y REGLAS CONTABLES (ventas y ventas_items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_control text,
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('factura_fiscal', 'nota_entrega')),
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Pago Móvil', 'Cashea', 'Crédito')),
  subtotal_usd numeric(12,2) NOT NULL DEFAULT 0,
  recargo_cashea_usd numeric(12,2) NOT NULL DEFAULT 0,
  monto_iva_usd numeric(12,2) NOT NULL DEFAULT 0,
  total_usd numeric(12,2) NOT NULL DEFAULT 0,
  tasa_bcv numeric(12,4) DEFAULT 1,
  total_bs numeric(14,2) DEFAULT 0,
  estado text NOT NULL DEFAULT 'pagado' CHECK (estado IN ('pagado', 'pendiente', 'abonado', 'anulado')),
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre text,
  cliente_cedula_rif text,
  cliente_telefono text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ventas_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  codigo_corto text,
  referencia text,
  descripcion text NOT NULL,
  marca text,
  cantidad numeric(10,2) NOT NULL DEFAULT 1,
  precio_unitario_usd numeric(12,2) NOT NULL DEFAULT 0,
  aplica_iva boolean NOT NULL DEFAULT true,
  subtotal_usd numeric(12,2) NOT NULL DEFAULT 0,
  costo_unitario_usd numeric(12,2) DEFAULT 0,
  tipo_tarifa text DEFAULT 'detal',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vincular cuentas_cobrar a ventas si no existía la columna
ALTER TABLE cuentas_cobrar 
  ADD COLUMN IF NOT EXISTS venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE;

-- Hacer guia_id opcional en cuentas_cobrar
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cuentas_cobrar' AND column_name = 'guia_id' AND is_nullable = 'NO'
  ) THEN 
    ALTER TABLE cuentas_cobrar ALTER COLUMN guia_id DROP NOT NULL;
  END IF; 
END $$;

-- Índices en ventas
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_metodo_pago ON ventas (metodo_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_doc ON ventas (tipo_documento);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas (estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_items_venta_id ON ventas_items (venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_items_producto_id ON ventas_items (producto_id);

-- ----------------------------------------------------------------------------
-- 4. TRIGGER PARA DESCUENTO AUTOMÁTICO DE STOCK TRAS LA VENTA
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION descontar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.producto_id IS NOT NULL THEN
    UPDATE productos
    SET 
      stock = GREATEST(0, stock - NEW.cantidad),
      updated_at = now()
    WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_descontar_stock_venta ON ventas_items;
CREATE TRIGGER trg_descontar_stock_venta
AFTER INSERT ON ventas_items
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_venta();

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
-- Permite lectura y escritura segura desde la app web
-- ----------------------------------------------------------------------------
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en productos" ON productos;
CREATE POLICY "Permitir todo en productos" 
  ON productos FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en ventas" ON ventas;
CREATE POLICY "Permitir todo en ventas" 
  ON ventas FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en ventas_items" ON ventas_items;
CREATE POLICY "Permitir todo en ventas_items" 
  ON ventas_items FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

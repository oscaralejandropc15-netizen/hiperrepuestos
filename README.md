# 🏎️ Hiper Repuestos Familycar C.A. - Sistema de Facturación y Mostrador

Sistema web de facturación rápida, correlativos y guías de despacho para venta de repuestos automotrices en mostrador.

## 🚀 Características

- **Diseño Idéntico al Talonario Físico SENIAT:**
  - Control de numeración correlativa (`FACTURA Nº 000475`, `Nro. de Control 00-000475`).
  - Datos fiscales de Charallave, Edo. Miranda (RIF: J412654489).
  - Casillas para condiciones de pago (`CONTADO` / `CRÉDITO`).
  - Métodos de pago oficiales (`$ Divisa`, `Débito`, `Pago Móvil`, `Transferencia`, `Biopago`, `Efectivo Bs`).
  - Pie de imprenta autorizada TIP SANTA TERESA, C.A. (Providencia SENIAT/01/00756).
- **Cálculo Multimoneda en Tiempo Real:**
  - Precios en Dólares ($ USD) con conversión automática a Bolívares (VES) usando la tasa oficial del Banco Central de Venezuela (BCV).
  - Tasa BCV en vivo con respaldo offline en caché local.
  - Cálculo automático de Base Imponible e I.V.A. (16%).
- **Descarga e Impresión Inmediata de PDF:**
  - Generación de PDF en el navegador con un solo clic vía `html2pdf.js` (sin gastar recursos de servidor).
- **Historial Completo con Paginación y Búsqueda:**
  - Filtrado en vivo por número de factura, correlativo, cliente o Cédula/RIF.
  - Filtros rápidos por fecha (Hoy, últimos 7 días, este mes).
  - Reimpresión directa desde el historial.
- **Formateador Rápido de Cédula / RIF:**
  - Auto-guión al escribir `V`, `J`, `E`, `G` y botones de un solo toque para agilizar la atención en mostrador.
- **Seguridad y Nube Supabase:**
  - Autenticación con Row-Level Security (RLS) en Postgres.
  - Arquitectura optimizada 100% gratuita dentro del plan Free de Supabase.

---

## 🛠️ Tecnologías

- **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide Icons.
- **Backend / Base de Datos:** Supabase (PostgreSQL con RLS).
- **Exportación:** html2pdf.js / jsPDF.
- **API Cambiaria:** DolarAPI (Tasa oficial BCV en tiempo real).

---

## 📦 Instalación y Uso Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/oscaralejandropc15-netizen/hiperrepuestos.git
   cd hiperrepuestos
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env.local` y agregar las credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   ```

4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

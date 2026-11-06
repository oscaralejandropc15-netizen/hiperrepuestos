import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { supabase } from './lib/supabaseClient';
import { calculateTotals, parseVenezuelanNumber } from './lib/formatters';
import { fetchTasaBCV } from './lib/bcvService';
import FacturadorForm from './components/FacturadorForm';
import GuiaImprimible from './components/GuiaImprimible';
import HistorialPage from './components/HistorialPage';
import AuthGate from './components/AuthGate';
import { Wrench, History, LogOut, Printer, Download, ArrowLeft, CheckCircle2, Receipt, Sun, Moon } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Navegación entre vistas principales: 'facturador' o 'historial'
  const [vista, setVista] = useState('facturador');

  // Estados principales del formulario
  const [tasaBCV, setTasaBCV] = useState('');
  const [bcvInfo, setBcvInfo] = useState(null);
  const [cargandoBCV, setCargandoBCV] = useState(false);
  const [cliente, setCliente] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
  });
  const [items, setItems] = useState([
    { id: 1, cantidad: 1, descripcion: '', precio: '' },
  ]);
  const [observaciones, setObservaciones] = useState('');
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [formaPago, setFormaPago] = useState('PUNTO');
  const [monedaIngreso, setMonedaIngreso] = useState('VES');
  const [proximoCorrelativo, setProximoCorrelativo] = useState('000001');
  const [numeroFacturaManual, setNumeroFacturaManual] = useState('');

  // Tema visual: 'light' (por defecto, amigable y de alta legibilidad para personas mayores) o 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('familycar_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('familycar_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Estados de control de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotif, setSuccessNotif] = useState(null);
  const [vistaImpresion, setVistaImpresion] = useState(null);

  // Obtener el siguiente número correlativo disponible (reutiliza huecos si se eliminó una factura previa)
  const obtenerSiguienteNumeroGuia = async () => {
    try {
      const { data, error } = await supabase
        .from('guias_despacho')
        .select('numero_guia')
        .order('numero_guia', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return 1;
      }

      const numeros = data.map(d => d.numero_guia).filter(n => typeof n === 'number' && n > 0);
      if (numeros.length === 0) return 1;

      // Buscar el primer número disponible consecutivo (desde 1 en adelante)
      const setNumeros = new Set(numeros);
      let candidato = 1;
      while (setNumeros.has(candidato)) {
        candidato++;
      }
      return candidato;
    } catch (err) {
      console.error('Error al obtener siguiente número de guía:', err);
      return 1;
    }
  };

  // Consultar próximo correlativo para mostrar en la interfaz
  const consultarProximoCorrelativo = async () => {
    try {
      const siguiente = await obtenerSiguienteNumeroGuia();
      setProximoCorrelativo(String(siguiente).padStart(6, '0'));
    } catch (err) {
      console.error('Error al consultar correlativo:', err);
      setProximoCorrelativo('000001');
    }
  };

  useEffect(() => {
    consultarProximoCorrelativo();
  }, [vista]);

  // Cargar Tasa BCV Oficial en tiempo real
  const cargarTasaBCV = async () => {
    setCargandoBCV(true);
    try {
      const data = await fetchTasaBCV();
      if (data && data.rate) {
        setTasaBCV(data.rate);
        setBcvInfo(data);
      }
    } catch (err) {
      console.error('Error al consultar BCV:', err);
    } finally {
      setCargandoBCV(false);
    }
  };

  // Consultar tasa al iniciar la aplicación
  useEffect(() => {
    cargarTasaBCV();
  }, []);

  // Verificar sesión con Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Totales reactivos en tiempo real con soporte para cobro en Bs. o en $
  const totals = calculateTotals(items, tasaBCV, monedaIngreso);

  // Limpiar y resetear el formulario
  const handleLimpiar = () => {
    setCliente({ nombre: '', documento: '', telefono: '', direccion: '' });
    setItems([{ id: Date.now(), cantidad: 1, descripcion: '', precio: '', precio_bs: '' }]);
    setObservaciones('');
    setCondicionPago('CONTADO');
    setFormaPago('PUNTO');
    setMonedaIngreso('VES');
    setError(null);
    setVistaImpresion(null);
    setNumeroFacturaManual('');
    consultarProximoCorrelativo();
  };

  // Guardar en Supabase (requiere usuario autenticado por las políticas RLS)
  const handleGuardar = async () => {
    if (!cliente.nombre.trim() || !cliente.documento.trim()) {
      setError('Por favor indica al menos el Nombre/Razón Social y la Cédula/RIF del cliente.');
      return null;
    }

    const rateClean = parseVenezuelanNumber(tasaBCV);
    const rate = rateClean > 0 ? rateClean : 1;

    const itemsValidos = items.filter((it) => {
      const hasDesc = it.descripcion && it.descripcion.trim().length > 0;
      const hasQty = parseFloat(it.cantidad) > 0;
      const cleanPrice = monedaIngreso === 'VES' 
        ? parseVenezuelanNumber(it.precio_bs ?? it.precio)
        : parseVenezuelanNumber(it.precio ?? it.precio_bs);
      const hasPrice = cleanPrice >= 0;
      return hasDesc && hasQty && hasPrice;
    });

    if (itemsValidos.length === 0) {
      setError('Debes agregar al menos un repuesto con cantidad y precio válido.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener número correlativo (manual personalizado si el usuario lo colocó, o el consecutivo automático)
      let siguienteNumero = null;
      const numManualLimpio = numeroFacturaManual ? String(numeroFacturaManual).trim().replace(/\D/g, '') : '';
      if (numManualLimpio) {
        const parsed = parseInt(numManualLimpio, 10);
        if (parsed > 0) {
          siguienteNumero = parsed;
        }
      }
      if (!siguienteNumero) {
        siguienteNumero = await obtenerSiguienteNumeroGuia();
      }

      // Guardar cabecera de la factura / guía
      let insertPayload = {
        numero_guia: siguienteNumero,
        cliente_nombre: cliente.nombre.trim(),
        cliente_documento: cliente.documento.trim(),
        cliente_telefono: cliente.telefono.trim() || null,
        cliente_direccion: cliente.direccion.trim() || null,
        tasa_bcv: rateClean,
        subtotal_usd: totals.baseImponible,
        iva_usd: totals.iva,
        total_usd: totals.totalUSD,
        total_bs: totals.totalBs,
        observaciones: observaciones.trim() || null,
        condicion_pago: condicionPago,
        forma_pago: formaPago,
      };

      let { data: guiaData, error: guiaError } = await supabase
        .from('guias_despacho')
        .insert(insertPayload)
        .select()
        .single();

      // Si las columnas condicion_pago o forma_pago no existen aún en Supabase, reintentar sin ellas de forma segura
      if (guiaError && guiaError.message && (guiaError.message.includes('condicion_pago') || guiaError.message.includes('forma_pago') || guiaError.message.includes('does not exist'))) {
        delete insertPayload.condicion_pago;
        delete insertPayload.forma_pago;
        const retry = await supabase
          .from('guias_despacho')
          .insert(insertPayload)
          .select()
          .single();
        guiaData = retry.data;
        guiaError = retry.error;
      }

      if (guiaError) throw guiaError;

      // 2. Guardar renglones de la guía con conversión precisa
      const renglones = itemsValidos.map((it) => {
        let priceUSD = 0;
        if (monedaIngreso === 'VES') {
          const bs = parseVenezuelanNumber(it.precio_bs);
          priceUSD = rate > 0 ? bs / rate : 0;
        } else {
          priceUSD = parseVenezuelanNumber(it.precio);
        }

        return {
          guia_id: guiaData.id,
          cantidad: parseFloat(it.cantidad),
          descripcion: it.descripcion.trim(),
          precio_unitario_usd: priceUSD,
          subtotal_usd: parseFloat(it.cantidad) * priceUSD,
        };
      });

      const { error: itemsError } = await supabase
        .from('items_guia')
        .insert(renglones);

      if (itemsError) throw itemsError;

      const guiaCompleta = {
        ...guiaData,
        items: itemsValidos,
        condicion_pago: condicionPago,
        forma_pago: formaPago,
      };

      setSuccessNotif(`¡Factura ${guiaData.codigo_guia} guardada exitosamente!`);
      setTimeout(() => setSuccessNotif(null), 4000);
      setNumeroFacturaManual('');
      consultarProximoCorrelativo();

      return guiaCompleta;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar la factura en Supabase.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar a PDF con html2pdf.js
  const exportarConHtml2Pdf = (codigo) => {
    const element = document.getElementById('guia-imprimible');
    if (!element) return;

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `${codigo || 'Factura'}_Familycar.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Emitir e Imprimir: Guarda en Supabase, prepara la vista y descarga el PDF
  const handleEmitirEImprimir = async () => {
    const guia = await handleGuardar();
    if (!guia) return;

    const payloadVista = {
      codigoGuia: guia.codigo_guia,
      fecha: guia.fecha || new Date().toISOString(),
      cliente: { ...cliente },
      items: items.filter((it) => it.descripcion.trim()),
      tasaBCV,
      totals,
      observaciones,
      condicionPago,
      formaPago,
    };

    setVistaImpresion(payloadVista);

    // Ejecutar exportación a PDF tras el render
    setTimeout(() => {
      exportarConHtml2Pdf(guia.codigo_guia);
    }, 300);
  };

  // Seleccionar guía del historial para reimpresión
  const handleSelectHistorial = (guia) => {
    setVista('facturador');
    setVistaImpresion({
      codigoGuia: guia.codigo_guia,
      fecha: guia.fecha,
      cliente: {
        nombre: guia.cliente_nombre,
        documento: guia.cliente_documento,
        telefono: guia.cliente_telefono || '',
        direccion: guia.cliente_direccion || '',
      },
      items: (guia.items || []).map((it) => ({
        cantidad: it.cantidad,
        descripcion: it.descripcion,
        precio: it.precio_unitario_usd,
      })),
      tasaBCV: guia.tasa_bcv,
      totals: {
        baseImponible: guia.subtotal_usd,
        baseImponibleBs: Math.round(guia.subtotal_usd * (guia.tasa_bcv || 1) * 100) / 100,
        iva: guia.iva_usd,
        ivaBs: Math.round(guia.iva_usd * (guia.tasa_bcv || 1) * 100) / 100,
        totalUSD: guia.total_usd,
        totalBs: guia.total_bs,
      },
      observaciones: guia.observaciones || '',
      condicionPago: guia.condicion_pago || 'CONTADO',
      formaPago: guia.forma_pago || 'DIVISA',
    });
  };

  // Pantalla de carga mientras se verifica la sesión
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Cargando sistema Familycar...
      </div>
    );
  }

  // Protección con AuthGate
  if (!session) {
    return <AuthGate onAuthSuccess={(s) => setSession(s)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#06080F] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Barra de Encabezado Superior Responsiva con Glassmorphism */}
      <header className="no-print bg-white/95 dark:bg-[#0B0F19]/85 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-40 shadow-sm dark:shadow-xl dark:shadow-black/40">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo y Nombre del Negocio */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Logo Familycar"
                className="relative w-8 h-8 sm:w-11 sm:h-11 object-contain rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-950 shadow-md flex-shrink-0"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-lg font-black tracking-wider text-slate-900 dark:text-white font-heading uppercase">
                  FAMILYCAR
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 bg-red-500/10 dark:bg-gradient-to-r dark:from-red-500/20 dark:to-rose-500/20 text-red-600 dark:text-rose-300 border border-red-500/30 dark:border-red-500/40 rounded-full font-bold uppercase tracking-widest shadow-sm">
                  Mostrador
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden md:block tracking-wide">
                RIF: J-412654489 • Charallave, Miranda
              </p>
            </div>
          </div>

          {/* Pestañas de Navegación Rápida y Acciones */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Navegación Facturador / Historial */}
            <div className="flex bg-slate-200/80 dark:bg-[#06080F]/90 p-0.5 sm:p-1 rounded-2xl border border-slate-300 dark:border-white/[0.08] shadow-inner">
              <button
                type="button"
                onClick={() => { setVista('facturador'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 min-h-[36px] sm:min-h-[38px] cursor-pointer ${
                  vista === 'facturador' && !vistaImpresion
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/40 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="tracking-wide">Facturar</span>
              </button>

              <button
                type="button"
                onClick={() => { setVista('historial'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 min-h-[36px] sm:min-h-[38px] cursor-pointer ${
                  vista === 'historial' && !vistaImpresion
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/40 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.04]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="tracking-wide">Historial</span>
              </button>
            </div>

            {/* Selector de Modo Claro / Modo Oscuro */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Cambiar a Modo Claro (Fácil de leer para la vista)' : 'Cambiar a Modo Oscuro'}
              className={`inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 border min-h-[36px] sm:min-h-[38px] min-w-[36px] cursor-pointer shadow-sm active:scale-95 ${
                theme === 'dark'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline font-bold ml-1.5">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden md:inline font-bold ml-1.5">Oscuro</span>
                </>
              )}
            </button>

            {/* Divisor Desktop */}
            <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* Identificador de Vendedor en Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#06080F]/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                {session?.user?.email || 'Vendedor'}
              </span>
            </div>

            {/* Botón de Cerrar Sesión Ultra Visible y Ergonómico para Teléfonos y PC */}
            <button
              onClick={() => supabase.auth.signOut()}
              title="Cerrar Sesión del Sistema"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-600 dark:bg-rose-500/15 dark:hover:bg-rose-600 text-rose-700 hover:text-white dark:text-rose-300 dark:hover:text-white border border-rose-300/80 dark:border-rose-500/30 shadow-sm transition-all duration-200 active:scale-95 min-h-[36px] sm:min-h-[38px] cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-rose-600 dark:text-rose-400 group-hover:text-white" />
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wide">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notificación de Éxito Flotante */}
      {successNotif && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-emerald-950/90 dark:bg-[#0B1A14]/90 border border-emerald-500/50 backdrop-blur-xl text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-950/60 flex items-center gap-3 text-sm font-semibold animate-slide-up max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="truncate">{successNotif}</span>
        </div>
      )}

      {/* Contenedor Principal Adaptativo */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
        {vistaImpresion ? (
          /* Modo Vista Previa y Descarga de Guía */
          <div className="space-y-4 sm:space-y-6">
            <div className="no-print glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
              <button
                onClick={() => setVistaImpresion(null)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => exportarConHtml2Pdf(vistaImpresion.codigoGuia)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm min-h-[40px] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-gradient-red text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 min-h-[40px] cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>

            {/* Vista Renderizada que captura html2pdf con scroll táctil en móviles */}
            <div className="bg-slate-200/60 dark:bg-slate-900/60 p-2 sm:p-6 lg:p-8 rounded-3xl border border-slate-300 dark:border-slate-800 overflow-x-auto print:bg-white print:p-0 print:border-none print:overflow-visible">
              <div className="min-w-[650px] sm:min-w-0">
                <GuiaImprimible {...vistaImpresion} />
              </div>
            </div>
          </div>
        ) : vista === 'historial' ? (
          /* Modo Historial de Guías Completo con Paginación */
          <HistorialPage
            onVolverAlFacturador={() => {
              setVista('facturador');
              consultarProximoCorrelativo();
            }}
            onVerGuia={handleSelectHistorial}
          />
        ) : (
          /* Modo Facturador de Mostrador */
          <FacturadorForm
            cliente={cliente}
            setCliente={setCliente}
            items={items}
            setItems={setItems}
            tasaBCV={tasaBCV}
            setTasaBCV={setTasaBCV}
            bcvInfo={bcvInfo}
            onActualizarBCV={cargarTasaBCV}
            cargandoBCV={cargandoBCV}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            condicionPago={condicionPago}
            setCondicionPago={setCondicionPago}
            formaPago={formaPago}
            setFormaPago={setFormaPago}
            monedaIngreso={monedaIngreso}
            setMonedaIngreso={setMonedaIngreso}
            proximoCorrelativo={proximoCorrelativo}
            numeroFacturaManual={numeroFacturaManual}
            setNumeroFacturaManual={setNumeroFacturaManual}
            totals={totals}
            onGuardar={handleGuardar}
            onImprimir={handleEmitirEImprimir}
            onLimpiar={handleLimpiar}
            loading={loading}
            error={error}
          />
        )}
      </main>
    </div>
  );
}

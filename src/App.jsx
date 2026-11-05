import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { supabase } from './lib/supabaseClient';
import { calculateTotals } from './lib/formatters';
import { fetchTasaBCV } from './lib/bcvService';
import FacturadorForm from './components/FacturadorForm';
import GuiaImprimible from './components/GuiaImprimible';
import HistorialPage from './components/HistorialPage';
import AuthGate from './components/AuthGate';
import { Wrench, History, LogOut, Printer, Download, ArrowLeft, CheckCircle2, Receipt } from 'lucide-react';

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
  const [proximoCorrelativo, setProximoCorrelativo] = useState('000475');

  // Estados de control de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotif, setSuccessNotif] = useState(null);
  const [vistaImpresion, setVistaImpresion] = useState(null);

  // Consultar próximo correlativo (inicia en 000475 si la base de datos está vacía)
  const consultarProximoCorrelativo = async () => {
    try {
      const { data, error } = await supabase
        .from('guias_despacho')
        .select('numero_guia')
        .order('numero_guia', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].numero_guia) {
        const next = data[0].numero_guia + 1;
        setProximoCorrelativo(String(next).padStart(6, '0'));
      } else {
        setProximoCorrelativo('000475');
      }
    } catch (err) {
      console.error('Error al consultar correlativo:', err);
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
  };

  // Guardar en Supabase (requiere usuario autenticado por las políticas RLS)
  const handleGuardar = async () => {
    if (!cliente.nombre.trim() || !cliente.documento.trim()) {
      setError('Por favor indica al menos el Nombre/Razón Social y la Cédula/RIF del cliente.');
      return null;
    }

    const rate = parseFloat(tasaBCV) || 1;
    const itemsValidos = items.filter((it) => {
      const hasDesc = it.descripcion && it.descripcion.trim().length > 0;
      const hasQty = parseFloat(it.cantidad) > 0;
      const hasPrice = (monedaIngreso === 'VES' 
        ? (parseFloat(it.precio_bs) >= 0 || parseFloat(it.precio) >= 0)
        : (parseFloat(it.precio) >= 0 || parseFloat(it.precio_bs) >= 0));
      return hasDesc && hasQty && hasPrice;
    });

    if (itemsValidos.length === 0) {
      setError('Debes agregar al menos un repuesto con cantidad y precio válido.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Guardar cabecera de la factura / guía
      let insertPayload = {
        cliente_nombre: cliente.nombre.trim(),
        cliente_documento: cliente.documento.trim(),
        cliente_telefono: cliente.telefono.trim() || null,
        cliente_direccion: cliente.direccion.trim() || null,
        tasa_bcv: parseFloat(tasaBCV) || 0,
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
          const bs = parseFloat(it.precio_bs) || 0;
          priceUSD = rate > 0 ? bs / rate : 0;
        } else {
          priceUSD = parseFloat(it.precio) || 0;
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
      margin: [6, 6, 6, 6],
      filename: `${codigo || 'Factura'}_Familycar.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
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
        iva: guia.iva_usd,
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
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col font-sans">
      {/* Barra de Encabezado Superior Responsiva con Glassmorphism */}
      <header className="no-print bg-[#0B0F19]/85 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-40 shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Logo Familycar"
                className="relative w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full border border-white/20 bg-slate-950 shadow-md flex-shrink-0"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-lg font-black tracking-wider text-white font-heading uppercase">
                  FAMILYCAR
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 text-rose-300 border border-red-500/40 rounded-full font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                  Mostrador
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden xs:block tracking-wide">
                RIF: J-412654489 • Charallave, Miranda
              </p>
            </div>
          </div>

          {/* Pestañas de Navegación Rápida con Estilo Cockpit */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-[#06080F]/90 p-1 rounded-2xl border border-white/[0.08] shadow-inner">
              <button
                type="button"
                onClick={() => { setVista('facturador'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 min-h-[38px] ${
                  vista === 'facturador' && !vistaImpresion
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/50 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="tracking-wide">Facturador</span>
              </button>

              <button
                type="button"
                onClick={() => { setVista('historial'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 min-h-[38px] ${
                  vista === 'historial' && !vistaImpresion
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/50 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="tracking-wide">Historial</span>
              </button>
            </div>

            <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-[#06080F]/80 border border-white/[0.08] rounded-2xl shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-300 truncate max-w-[150px]">
                {session?.user?.email || 'Vendedor'}
              </span>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-2xl transition-all duration-200 active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notificación de Éxito Flotante */}
      {successNotif && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-[#0B1A14]/90 border border-emerald-500/50 backdrop-blur-xl text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-950/60 flex items-center gap-3 text-sm font-semibold animate-slide-up max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="truncate">{successNotif}</span>
        </div>
      )}

      {/* Contenedor Principal Adaptativo */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {vistaImpresion ? (
          /* Modo Vista Previa y Descarga de Guía */
          <div className="space-y-4 sm:space-y-6">
            <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
              <button
                onClick={() => setVistaImpresion(null)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => exportarConHtml2Pdf(vistaImpresion.codigoGuia)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm min-h-[40px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 min-h-[40px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>

            {/* Vista Renderizada que captura html2pdf con scroll táctil en móviles */}
            <div className="bg-slate-900/60 p-2 sm:p-6 lg:p-8 rounded-3xl border border-slate-800 overflow-x-auto print:bg-white print:p-0 print:border-none print:overflow-visible">
              <div className="min-w-[650px] sm:min-w-0">
                <GuiaImprimible {...vistaImpresion} />
              </div>
            </div>
          </div>
        ) : vista === 'historial' ? (
          /* Modo Historial de Guías Completo con Paginación */
          <HistorialPage
            onVolverAlFacturador={() => setVista('facturador')}
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

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
  const [formaPago, setFormaPago] = useState('DIVISA');
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

  // Totales reactivos en tiempo real
  const totals = calculateTotals(items, tasaBCV);

  // Limpiar y resetear el formulario
  const handleLimpiar = () => {
    setCliente({ nombre: '', documento: '', telefono: '', direccion: '' });
    setItems([{ id: Date.now(), cantidad: 1, descripcion: '', precio: '' }]);
    setObservaciones('');
    setCondicionPago('CONTADO');
    setFormaPago('DIVISA');
    setError(null);
    setVistaImpresion(null);
  };

  // Guardar en Supabase (requiere usuario autenticado por las políticas RLS)
  const handleGuardar = async () => {
    if (!cliente.nombre.trim() || !cliente.documento.trim()) {
      setError('Por favor indica al menos el Nombre/Razón Social y la Cédula/RIF del cliente.');
      return null;
    }

    const itemsValidos = items.filter(
      (it) => it.descripcion.trim() && parseFloat(it.cantidad) > 0 && parseFloat(it.precio) >= 0
    );

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

      // 2. Guardar renglones de la guía
      const renglones = itemsValidos.map((it) => ({
        guia_id: guiaData.id,
        cantidad: parseFloat(it.cantidad),
        descripcion: it.descripcion.trim(),
        precio_unitario_usd: parseFloat(it.precio),
        subtotal_usd: parseFloat(it.cantidad) * parseFloat(it.precio),
      }));

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Barra de Encabezado Superior Responsiva */}
      <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <img
              src="/logo.png"
              alt="Logo Familycar"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full border border-slate-700 shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-base font-black tracking-tight text-white leading-tight">
                  FAMILYCAR
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 bg-red-600/15 text-red-400 border border-red-500/30 rounded font-bold uppercase tracking-wider">
                  Mostrador
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden xs:block">
                RIF: J-412654489 • Charallave
              </p>
            </div>
          </div>

          {/* Pestañas de Navegación Rápida */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setVista('facturador'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  vista === 'facturador' && !vistaImpresion
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Facturador</span>
              </button>

              <button
                type="button"
                onClick={() => { setVista('historial'); setVistaImpresion(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  vista === 'historial' && !vistaImpresion
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
              </button>
            </div>

            <div className="hidden sm:block h-5 w-px bg-slate-800" />

            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-mono text-slate-300 truncate max-w-[140px]">
                {session?.user?.email || 'Vendedor'}
              </span>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notificación de Éxito Flotante */}
      {successNotif && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
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

import React, { useState, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from './lib/supabaseClient';
import { calculateTotals, parseVenezuelanNumber, generarVariantesCedula } from './lib/formatters';
import { fetchTasaBCV } from './lib/bcvService';
import {
  getCorrelativoCached,
  invalidateCorrelativoCache,
  invalidateHistorialCache,
  invalidateCuentasCobrarCache,
  invalidateClientesCache,
} from './lib/queryCache';
import AppLayout from './components/layout/AppLayout';
import ToastNotification from './components/ui/ToastNotification';
import { Printer, Download, ArrowLeft } from 'lucide-react';

const AuthGate = lazy(() => import('./components/AuthGate'));
const POSWorkspace = lazy(() => import('./components/pos/POSWorkspace'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const HistorialPage = lazy(() => import('./components/HistorialPage'));
const GuiaImprimible = lazy(() => import('./components/GuiaImprimible'));

function PageLoader({ label = 'Cargando módulo...' }) {
  return (
    <div className="surface-card p-12 flex flex-col items-center justify-center gap-3 text-center animate-fade-in">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-white/10 border-t-red-600 animate-spin" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Navegación entre vistas principales: 'facturador', 'admin', 'historial'
  const [vista, setVista] = useState('facturador');

  // Estados principales del POS
  const [tasaBCV, setTasaBCV] = useState('');
  const [cargandoBCV, setCargandoBCV] = useState(false);
  const [cliente, setCliente] = useState({
    id: null,
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
  });
  const [items, setItems] = useState([]);
  const [tipoDocumento, setTipoDocumento] = useState('factura_fiscal');
  const [observaciones, setObservaciones] = useState('');
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [formaPago, setFormaPago] = useState('PAGO_MOVIL');
  const [monedaIngreso, setMonedaIngreso] = useState('VES');
  const [proximoCorrelativo, setProximoCorrelativo] = useState('000001');
  const [numeroFacturaManual, setNumeroFacturaManual] = useState('');

  // Tema visual claro/oscuro
  const [theme, setTheme] = useState(() => localStorage.getItem('familycar_theme') || 'light');

  useLayoutEffect(() => {
    localStorage.setItem('familycar_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Estados de control de UI
  const [loading, setLoading] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [error, setError] = useState(null);
  const [successNotif, setSuccessNotif] = useState(null);
  const [vistaImpresion, setVistaImpresion] = useState(null);

  const lastBcvFetchRef = useRef(0);

  const obtenerSiguienteNumeroGuia = async (force = false) => {
    try {
      return await getCorrelativoCached({ force });
    } catch (err) {
      console.error('Error al obtener siguiente número de guía:', err);
      return 1;
    }
  };

  const consultarProximoCorrelativo = async (force = false) => {
    if (!session) return;
    try {
      const siguiente = await obtenerSiguienteNumeroGuia(force);
      setProximoCorrelativo(String(siguiente).padStart(6, '0'));
    } catch (err) {
      console.error('Error al consultar correlativo:', err);
      setProximoCorrelativo('000001');
    }
  };

  useEffect(() => {
    if (session) {
      consultarProximoCorrelativo(false);
    }
  }, [session]);

  const cargarTasaBCV = async (actualizarInputActivo = false) => {
    lastBcvFetchRef.current = Date.now();
    setCargandoBCV(true);
    try {
      const data = await fetchTasaBCV();
      if (data && data.rate) {
        if (actualizarInputActivo || !tasaBCV) {
          const raw = data.usdOficial || data.rate;
          const num = typeof raw === 'number' ? raw : parseFloat(raw);
          setTasaBCV(!isNaN(num) ? num.toFixed(2) : String(raw));
        }
      }
    } catch (err) {
      console.error('Error al consultar tasas:', err);
    } finally {
      setCargandoBCV(false);
    }
  };

  useEffect(() => {
    cargarTasaBCV(true);
    const handleFocus = () => {
      if (Date.now() - lastBcvFetchRef.current >= 5 * 60 * 1000) {
        cargarTasaBCV(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => cargarTasaBCV(false), 10 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const totals = calculateTotals(items, tasaBCV, monedaIngreso, formaPago, tipoDocumento);

  const handleLimpiar = () => {
    setCliente({ id: null, nombre: '', documento: '', telefono: '', direccion: '' });
    setItems([]);
    setObservaciones('');
    setCondicionPago('CONTADO');
    setFormaPago('PAGO_MOVIL');
    setMonedaIngreso('VES');
    setTipoDocumento('factura_fiscal');
    setError(null);
    setVistaImpresion(null);
    setNumeroFacturaManual('');
    consultarProximoCorrelativo(false);
  };

  const handleGuardar = async () => {
    if (!cliente.nombre.trim() || !cliente.documento.trim()) {
      setError('Por favor indica al menos el Nombre/Razón Social y la Cédula/RIF del cliente.');
      return null;
    }

    const rateClean = Math.round((parseVenezuelanNumber(tasaBCV) || 1) * 100) / 100;
    const rate = rateClean > 0 ? rateClean : 1;

    const itemsValidos = items.filter((it) => {
      const hasDesc = it.descripcion && it.descripcion.trim().length > 0;
      const hasQty = parseFloat(it.cantidad) > 0;
      const cleanPrice =
        it.precio_divisa !== undefined
          ? parseVenezuelanNumber(it.precio_divisa)
          : monedaIngreso === 'VES'
          ? parseVenezuelanNumber(it.precio_bs ?? it.precio)
          : parseVenezuelanNumber(it.precio ?? it.precio_bs);
      return hasDesc && hasQty && cleanPrice >= 0;
    });

    if (itemsValidos.length === 0) {
      setError('Debes agregar al menos un repuesto o renglón válido al comprobante.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const esCredito =
        formaPago === 'CREDITO_TIENDA' || condicionPago === 'CRÉDITO' || condicionPago === 'CREDITO';
      let resolvedClienteId = cliente.id || null;

      if (cliente.documento?.trim() && cliente.nombre?.trim()) {
        const docLimpio = cliente.documento.trim();
        const nombreLimpio = cliente.nombre.trim();
        const telefonoLimpio = cliente.telefono?.trim() || null;
        const direccionLimpia = cliente.direccion?.trim() || null;

        try {
          const variantes = generarVariantesCedula(docLimpio);
          const orClause = variantes.map((v) => `cedula_rif.eq.${v}`).join(',');
          const { data: exist } = await supabase
            .from('clientes')
            .select('id, cedula_rif')
            .or(orClause)
            .limit(1)
            .maybeSingle();

          if (exist?.id) {
            resolvedClienteId = exist.id;
            await supabase
              .from('clientes')
              .update({
                nombre: nombreLimpio,
                telefono: telefonoLimpio,
                direccion: direccionLimpia,
                updated_at: new Date().toISOString(),
              })
              .eq('id', exist.id);
          } else {
            const { data: nuevoClient } = await supabase
              .from('clientes')
              .upsert(
                {
                  cedula_rif: docLimpio,
                  nombre: nombreLimpio,
                  telefono: telefonoLimpio,
                  direccion: direccionLimpia,
                },
                { onConflict: 'cedula_rif' }
              )
              .select('id')
              .maybeSingle();

            if (nuevoClient?.id) {
              resolvedClienteId = nuevoClient.id;
            }
          }
        } catch (cErr) {
          console.warn('Aviso registrando cliente en Supabase:', cErr);
        }
      }

      if (esCredito && !resolvedClienteId) {
        setError(
          'Para otorgar Crédito de Tienda debes seleccionar un cliente registrado previamente en la base de datos.'
        );
        setLoading(false);
        return null;
      }

      let siguienteNumero = null;
      const numManualLimpio = numeroFacturaManual
        ? String(numeroFacturaManual).trim().replace(/\D/g, '')
        : '';
      if (numManualLimpio) {
        const parsed = parseInt(numManualLimpio, 10);
        if (parsed > 0) siguienteNumero = parsed;
      }
      if (!siguienteNumero) {
        siguienteNumero = await obtenerSiguienteNumeroGuia(true);
      }

      const insertPayload = {
        numero_guia: siguienteNumero,
        cliente_id: resolvedClienteId,
        cliente_nombre: cliente.nombre.trim(),
        cliente_documento: cliente.documento.trim(),
        cliente_telefono: cliente.telefono.trim() || null,
        cliente_direccion: cliente.direccion.trim() || null,
        tasa_bcv: rateClean,
        subtotal_usd: totals.subtotalUSD ?? totals.baseImponible,
        monto_recargo_cashea_usd: totals.recargoCashea || 0,
        monto_iva_usd: totals.iva,
        iva_usd: totals.iva,
        total_usd: totals.totalUSD,
        total_bs: totals.totalBs,
        observaciones: observaciones.trim() || null,
        condicion_pago: condicionPago,
        forma_pago: formaPago,
        tipo_documento: tipoDocumento || 'factura_fiscal',
        estado_pago: esCredito ? 'pendiente' : 'pagado',
      };

      let { data: guiaData, error: guiaError } = await supabase
        .from('guias_despacho')
        .insert(insertPayload)
        .select()
        .single();

      if (
        guiaError &&
        guiaError.message &&
        (guiaError.message.includes('condicion_pago') ||
          guiaError.message.includes('tipo_documento') ||
          guiaError.message.includes('estado_pago'))
      ) {
        delete insertPayload.condicion_pago;
        delete insertPayload.forma_pago;
        delete insertPayload.tipo_documento;
        delete insertPayload.estado_pago;
        delete insertPayload.monto_recargo_cashea_usd;
        delete insertPayload.cliente_id;
        const retry = await supabase.from('guias_despacho').insert(insertPayload).select().single();
        guiaData = retry.data;
        guiaError = retry.error;
      }

      if (guiaError) throw guiaError;

      const renglones = itemsValidos.map((it) => {
        let priceUSD = 0;
        if (it.precio_divisa !== undefined && it.precio_divisa !== null && it.precio_divisa !== '') {
          priceUSD = parseVenezuelanNumber(it.precio_divisa);
        } else if (monedaIngreso === 'VES') {
          const bs = parseVenezuelanNumber(it.precio_bs);
          priceUSD = rate > 0 ? bs / rate : 0;
        } else {
          priceUSD = parseVenezuelanNumber(it.precio ?? it.precio_detal_usd);
        }

        return {
          guia_id: guiaData.id,
          producto_id: it.producto_id || null,
          cantidad: parseFloat(it.cantidad),
          descripcion: it.descripcion.trim(),
          precio_unitario_usd: priceUSD,
          subtotal_usd: parseFloat(it.cantidad) * priceUSD,
          tipo_precio: it.tipo_tarifa || 'detal',
          costo_unitario_usd: it.costo_usd || 0,
        };
      });

      let { error: itemsError } = await supabase.from('items_guia').insert(renglones);

      if (
        itemsError &&
        itemsError.message &&
        (itemsError.message.includes('producto_id') || itemsError.message.includes('tipo_precio'))
      ) {
        const renglonesBase = itemsValidos.map((it) => {
          const priceUSD = it.precio_divisa || parseVenezuelanNumber(it.precio) || 0;
          return {
            guia_id: guiaData.id,
            cantidad: parseFloat(it.cantidad),
            descripcion: it.descripcion.trim(),
            precio_unitario_usd: priceUSD,
            subtotal_usd: parseFloat(it.cantidad) * priceUSD,
          };
        });
        const retryItems = await supabase.from('items_guia').insert(renglonesBase);
        itemsError = retryItems.error;
      }

      if (itemsError) throw itemsError;

      let ventaId = null;
      try {
        const ventaPayload = {
          numero_control: String(siguienteNumero),
          tipo_documento: tipoDocumento || 'factura_fiscal',
          metodo_pago: formaPago || 'Efectivo',
          subtotal_usd: totals.subtotalUSD ?? totals.baseImponible,
          recargo_cashea_usd: totals.recargoCashea || 0,
          monto_iva_usd: totals.iva,
          total_usd: totals.totalUSD,
          tasa_bcv: rateClean,
          total_bs: totals.totalBs,
          estado: esCredito ? 'pendiente' : 'pagado',
          cliente_id: resolvedClienteId,
          cliente_nombre: cliente.nombre.trim(),
          cliente_cedula_rif: cliente.documento.trim(),
          cliente_telefono: cliente.telefono.trim() || null,
          observaciones: observaciones.trim() || null,
        };

        const { data: vData, error: vErr } = await supabase
          .from('ventas')
          .insert(ventaPayload)
          .select()
          .single();

        if (!vErr && vData?.id) {
          ventaId = vData.id;
          const vItems = itemsValidos.map((it) => {
            let priceUSD = 0;
            if (it.precio_divisa !== undefined && it.precio_divisa !== null && it.precio_divisa !== '') {
              priceUSD = parseVenezuelanNumber(it.precio_divisa);
            } else if (monedaIngreso === 'VES') {
              const bs = parseVenezuelanNumber(it.precio_bs);
              priceUSD = rate > 0 ? bs / rate : 0;
            } else {
              priceUSD = parseVenezuelanNumber(it.precio ?? it.precio_detal_usd);
            }

            return {
              venta_id: vData.id,
              producto_id: it.producto_id || null,
              codigo_corto: it.codigo_corto || null,
              referencia: it.referencia || null,
              descripcion: it.descripcion.trim(),
              marca: it.marca || null,
              cantidad: parseFloat(it.cantidad) || 1,
              precio_unitario_usd: priceUSD,
              aplica_iva: it.aplica_iva !== false,
              subtotal_usd: (parseFloat(it.cantidad) || 1) * priceUSD,
              costo_unitario_usd: it.costo_usd || 0,
              tipo_tarifa: it.tipo_tarifa || 'detal',
            };
          });

          await supabase.from('ventas_items').insert(vItems);
        }
      } catch (errVentas) {
        console.warn('Aviso guardando en tabla ventas:', errVentas);
      }

      if (esCredito) {
        try {
          await supabase.from('cuentas_cobrar').insert({
            guia_id: guiaData.id,
            venta_id: ventaId,
            cliente_id: resolvedClienteId,
            monto_total_usd: totals.totalUSD,
            monto_abonado_usd: 0,
            saldo_pendiente_usd: totals.totalUSD,
            estado: 'pendiente',
            notas: `Crédito originado en venta ${guiaData.codigo_guia || siguienteNumero}`,
          });
        } catch (cxcErr) {
          console.warn('Aviso registrando cuenta por cobrar:', cxcErr);
        }
      }

      const guiaCompleta = {
        ...guiaData,
        items: itemsValidos,
        condicion_pago: condicionPago,
        forma_pago: formaPago,
        tipo_documento: tipoDocumento,
      };

      setSuccessNotif(`Venta ${guiaData.codigo_guia} guardada exitosamente.`);
      setTimeout(() => setSuccessNotif(null), 4000);
      setNumeroFacturaManual('');
      invalidateCorrelativoCache();
      invalidateHistorialCache();
      invalidateClientesCache();
      if (esCredito) invalidateCuentasCobrarCache();
      consultarProximoCorrelativo(true);

      return guiaCompleta;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar la venta en Supabase.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Carga dinámica de html2pdf.js solo al exportar PDF
  const exportarConHtml2Pdf = async (codigo) => {
    const element = document.getElementById('guia-imprimible');
    if (!element) return;

    setExportandoPDF(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `${codigo || 'Factura'}_Familycar.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error exportando PDF:', err);
      setError('No se pudo generar el archivo PDF. Intenta usar la opción Imprimir.');
    } finally {
      setExportandoPDF(false);
    }
  };

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
      tipoDocumento: guia.tipo_documento || tipoDocumento,
    };

    setVistaImpresion(payloadVista);

    setTimeout(() => {
      exportarConHtml2Pdf(guia.codigo_guia);
    }, 350);
  };

  const handleSelectHistorial = (guia) => {
    setVista('facturador');
    const tasa = guia.tasa_bcv || 1;
    const subtotalUSD = parseFloat(guia.subtotal_usd) || 0;
    const ivaUSD = parseFloat(guia.iva_usd) || 0;
    const forma = guia.forma_pago || 'EFECTIVO';
    const docTipo =
      guia.tipo_documento ||
      (forma === 'EFECTIVO' || forma === 'CREDITO_TIENDA' ? 'nota_entrega' : 'factura_fiscal');

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
      tasaBCV: tasa,
      totals: {
        subtotalUSD,
        subtotalBs: Math.round(subtotalUSD * tasa * 100) / 100,
        baseImponible: subtotalUSD,
        baseImponibleBs: Math.round(subtotalUSD * tasa * 100) / 100,
        iva: ivaUSD,
        ivaBs: Math.round(ivaUSD * tasa * 100) / 100,
        totalUSD: guia.total_usd,
        totalBs: guia.total_bs,
      },
      observaciones: guia.observaciones || '',
      condicionPago: guia.condicion_pago || 'CONTADO',
      formaPago: forma,
      tipoDocumento: docTipo,
    });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f4f6f9] dark:bg-[#070a11] text-slate-600 dark:text-slate-400">
        <div className="w-9 h-9 rounded-full border-2 border-slate-300 dark:border-white/10 border-t-red-600 animate-spin" />
        <p className="text-xs font-medium">Iniciando sistema Familycar...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#070a11]" />}>
        <AuthGate onAuthSuccess={(s) => setSession(s)} />
      </Suspense>
    );
  }

  return (
    <AppLayout
      vista={vista}
      setVista={(nextVista) => {
        setVistaImpresion(null);
        setVista(nextVista);
      }}
      tasaBCV={tasaBCV}
      setTasaBCV={setTasaBCV}
      cargandoBCV={cargandoBCV}
      onActualizarBCV={cargarTasaBCV}
      proximoCorrelativo={proximoCorrelativo}
      itemsCarrito={items}
      session={session}
      onCerrarSesion={() => supabase.auth.signOut()}
      theme={theme}
      setTheme={setTheme}
      parseVenezuelanNumber={parseVenezuelanNumber}
    >
      <ToastNotification notification={successNotif} onClose={() => setSuccessNotif(null)} />

      {vistaImpresion ? (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <div className="no-print surface-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setVistaImpresion(null)}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 btn-secondary text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Punto de Venta</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportarConHtml2Pdf(vistaImpresion.codigoGuia)}
                disabled={exportandoPDF}
                className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 btn-secondary text-xs text-emerald-700 dark:text-emerald-400"
              >
                <Download className="w-4 h-4" />
                <span>{exportandoPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2 btn-gradient-red text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          <p className="no-print sm:hidden text-center text-xs text-slate-500 dark:text-slate-400">
            Desliza horizontalmente para inspeccionar el formato carta completo.
          </p>

          <div className="bg-slate-200/70 dark:bg-slate-900/70 p-2 sm:p-6 rounded-2xl border border-slate-300 dark:border-white/10 overflow-x-auto print:bg-white print:p-0 print:border-none print:overflow-visible">
            <div className="min-w-[680px] sm:min-w-0">
              <Suspense fallback={<PageLoader label="Preparando documento..." />}>
                <GuiaImprimible {...vistaImpresion} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : vista === 'historial' ? (
        <Suspense fallback={<PageLoader label="Cargando historial de ventas..." />}>
          <HistorialPage
            onVolverAlFacturador={() => {
              setVista('facturador');
            }}
            onVerGuia={handleSelectHistorial}
            onGuiaEliminada={() => {
              invalidateCorrelativoCache();
              invalidateHistorialCache();
              consultarProximoCorrelativo(true);
            }}
          />
        </Suspense>
      ) : vista === 'admin' ? (
        <Suspense fallback={<PageLoader label="Cargando panel de inventario..." />}>
          <AdminDashboard
            tasaBCV={tasaBCV}
            onVolverAlMostrador={() => {
              setVista('facturador');
            }}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoader label="Cargando punto de venta..." />}>
          <POSWorkspace
            cliente={cliente}
            setCliente={setCliente}
            items={items}
            setItems={setItems}
            tasaBCV={tasaBCV}
            formaPago={formaPago}
            setFormaPago={setFormaPago}
            condicionPago={condicionPago}
            setCondicionPago={setCondicionPago}
            monedaIngreso={monedaIngreso}
            setMonedaIngreso={setMonedaIngreso}
            tipoDocumento={tipoDocumento}
            setTipoDocumento={setTipoDocumento}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            numeroFacturaManual={numeroFacturaManual}
            setNumeroFacturaManual={setNumeroFacturaManual}
            proximoCorrelativo={proximoCorrelativo}
            totals={totals}
            onGuardar={handleGuardar}
            onImprimir={handleEmitirEImprimir}
            onLimpiar={handleLimpiar}
            loading={loading}
            error={error}
            setError={setError}
          />
        </Suspense>
      )}
    </AppLayout>
  );
}

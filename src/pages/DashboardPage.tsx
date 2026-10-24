import { ArrowRight, ArrowUpRight, Banknote, CheckCircle2, ClipboardCheck, CreditCard, RefreshCw, Users, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, postulacionesApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Alert, EmptyState, LoadingState, PageHeader } from '../components/Feedback';
import { asNumber, formatCurrency, formatNumber, getField, getText, isRecord, toRecordArray, unwrapData, type UnknownRecord } from '../lib/records';

function metric(raw: unknown, ...keys: string[]): unknown {
  if (!isRecord(raw)) return undefined;
  const nested = isRecord(raw.metricas) ? raw.metricas : isRecord(raw.datos) ? raw.datos : raw;
  const nestedValue = getField(nested, ...keys);
  return nestedValue ?? getField(raw, ...keys);
}

function normalizeSeries(raw: unknown, labelKeys: string[], valueKeys: string[]) {
  return toRecordArray(raw).map((item) => ({
    label: getText(item, ...labelKeys) || '—',
    value: asNumber(getField(item, ...valueKeys)),
  })).filter((item): item is { label: string; value: number } => item.value !== null);
}

function MiniBarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="bar-chart">{items.map((item, index) => <div className="bar-chart-item" key={`${item.label}-${index}`}><div className="bar-chart-value">{formatCurrency(item.value)}</div><div className="bar-chart-track"><div className={`bar-chart-fill ${index === items.length - 1 ? 'bar-chart-fill-current' : ''}`} style={{ height: `${Math.max(6, item.value / max * 100)}%` }} /></div><span>{item.label}</span></div>)}</div>;
}

function CategoryBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="category-chart">{items.slice(0, 6).map((item, index) => <div className="category-chart-row" key={`${item.label}-${index}`}><div className="category-chart-meta"><span>{item.label}</span><strong>{formatNumber(item.value)}</strong></div><div className="category-track"><div className={`category-fill category-fill-${index % 4}`} style={{ width: `${Math.max(2, item.value / max * 100)}%` }} /></div></div>)}</div>;
}

export function DashboardPage() {
  const { token } = useAuth();
  const [raw, setRaw] = useState<unknown>(null);
  const [pending, setPending] = useState<UnknownRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      adminApi.dashboard(token),
      postulacionesApi.pending(token).catch(() => null),
    ]).then(([dashboard, applications]) => {
      setRaw(unwrapData(dashboard));
      setPending(applications ? toRecordArray(applications, ['postulaciones']) : []);
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar el dashboard.'))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token, refreshKey]);

  const metrics = useMemo(() => [
    { label: 'Balance total', value: formatCurrency(metric(raw, 'balanceTotal', 'balance', 'balanceTotalSistema')), icon: Banknote, tone: 'blue', helper: 'Balance del sistema' },
    { label: 'Ganancias netas', value: formatCurrency(metric(raw, 'gananciasNetas', 'gananciaNeta', 'netEarnings')), icon: ArrowUpRight, tone: 'green', helper: 'Ganancia acumulada' },
    { label: 'Transacciones del mes', value: formatNumber(metric(raw, 'transaccionesMes', 'totalTransaccionesMes', 'transaccionesDelMes')), icon: CreditCard, tone: 'violet', helper: 'Pagos registrados' },
    { label: 'Usuarios activos', value: formatNumber(metric(raw, 'usuariosActivos', 'totalUsuariosActivos', 'clientesActivos')), icon: Users, tone: 'cyan', helper: 'Cuentas activas' },
    { label: 'Técnicos activos', value: formatNumber(metric(raw, 'tecnicosActivos', 'totalTecnicosActivos')), icon: Wrench, tone: 'orange', helper: 'Profesionales disponibles' },
    { label: 'Postulaciones pendientes', value: pending.length ? formatNumber(pending.length) : (raw && metric(raw, 'postulacionesPendientes', 'totalPostulacionesPendientes') !== undefined ? formatNumber(metric(raw, 'postulacionesPendientes', 'totalPostulacionesPendientes')) : '—'), icon: ClipboardCheck, tone: 'rose', helper: 'Por revisar' },
  ], [raw, pending]);

  const incomeSeries = useMemo(() => normalizeSeries(metric(raw, 'ingresosMensuales', 'ingresosPorMes', 'historicoIngresos'), ['mes', 'periodo', 'nombreMes', 'label'], ['ingresos', 'monto', 'total', 'valor']), [raw]);
  const categories = useMemo(() => normalizeSeries(metric(raw, 'serviciosPorCategoria', 'distribucionServiciosCategoria', 'categoriasServicios'), ['categoria', 'nombreCategoria', 'nombre', 'label'], ['cantidad', 'total', 'servicios', 'valor']), [raw]);

  return <>
    <PageHeader eyebrow="VISTA GENERAL" title="Buenos días, equipo RePara" description="Aquí tienes un resumen de la operación y los indicadores disponibles en el backend." action={<button className="button button-secondary" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /> Actualizar datos</button>} />
    {error && <Alert tone="error">{error}</Alert>}
    {loading ? <LoadingState label="Consultando métricas del backend…" /> : <>
      <div className="metrics-grid">{metrics.map(({ label, value, icon: Icon, tone, helper }) => <article className="metric-card" key={label}><div className={`metric-icon metric-${tone}`}><Icon size={19} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-helper">{helper}</div></article>)}</div>
      <div className="dashboard-grid">
        <section className="panel income-panel"><div className="panel-header"><div><h2>Ingresos mensuales</h2><p>Histórico devuelto por el endpoint administrativo</p></div><span className="panel-icon"><ArrowUpRight size={17} /></span></div>{incomeSeries.length ? <MiniBarChart items={incomeSeries} /> : <EmptyState title="Sin serie de ingresos" description="El endpoint no devolvió una lista reconocible de ingresos mensuales. No se muestran cifras simuladas." />}</section>
        <section className="panel category-panel"><div className="panel-header"><div><h2>Servicios por categoría</h2><p>Distribución de servicios registrada</p></div><span className="panel-icon panel-icon-purple"><Wrench size={17} /></span></div>{categories.length ? <CategoryBars items={categories} /> : <EmptyState title="Sin datos por categoría" description="No hay datos de categorías reconocibles en la respuesta del dashboard." />}</section>
      </div>
      <div className="panel quick-panel"><div className="panel-header"><div><h2>Accesos rápidos</h2><p>Continúa con las tareas administrativas más comunes.</p></div></div><div className="quick-links"><Link to="/postulaciones" className="quick-link"><div className="quick-link-icon quick-amber"><ClipboardCheck size={19} /></div><div><strong>Revisar postulaciones</strong><span>{pending.length ? `${pending.length} pendiente(s) por revisar` : 'Revisar expedientes de técnicos'}</span></div><ArrowRight size={17} /></Link><Link to="/usuarios" className="quick-link"><div className="quick-link-icon quick-blue"><Users size={19} /></div><div><strong>Gestionar usuarios</strong><span>Consultar cuentas y estados</span></div><ArrowRight size={17} /></Link><Link to="/pagos" className="quick-link"><div className="quick-link-icon quick-green"><CreditCard size={19} /></div><div><strong>Consultar pagos</strong><span>Ver transacciones registradas</span></div><ArrowRight size={17} /></Link></div></div>
      <div className="dashboard-note"><CheckCircle2 size={17} /><span>Las métricas se leen del endpoint <code>GET /admin/dashboard</code>. Si un indicador aparece como «—», revisa el nombre de propiedad devuelto por la API y actualiza el mapeo del frontend; no se rellenan valores ficticios.</span></div>
    </>}
  </>;
}

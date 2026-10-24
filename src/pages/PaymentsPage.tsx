import { ArrowDownToLine, CreditCard, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Alert, EmptyState, LoadingState, PageHeader, StatusPill } from '../components/Feedback';
import { formatCurrency, formatDate, getField, getText, toRecordArray, type UnknownRecord } from '../lib/records';

function paymentId(row: UnknownRecord, index: number): string {
  const id = getField(row, 'idPago', 'idTransaccion', 'id', 'pagoId');
  return typeof id === 'number' || typeof id === 'string' ? String(id) : `registro-${index}`;
}

export function PaymentsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<UnknownRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { setRows(toRecordArray(await adminApi.payments(token), ['pagos', 'transacciones'])); }
    catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'No se pudieron cargar los pagos.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load, refreshKey]);

  const filtered = useMemo(() => rows.filter((row) => `${paymentId(row, 0)} ${getText(row, 'metodoPago', 'metodo', 'metodoPagoNombre')} ${getText(row, 'estado', 'status')} ${getText(row, 'idSolicitud', 'solicitudId')} ${getText(row, 'referencia', 'codigoOperacion')}`.toLowerCase().includes(search.toLowerCase().trim())), [rows, search]);
  const total = rows.reduce((sum, row) => { const amount = getField(row, 'monto', 'montoPago', 'importe', 'total'); return sum + (typeof amount === 'number' ? amount : typeof amount === 'string' ? Number(amount) || 0 : 0); }, 0);

  function exportCsv() {
    const header = ['ID', 'Solicitud', 'Metodo', 'Monto', 'Estado', 'Fecha'];
    const lines = filtered.map((row, index) => [paymentId(row, index), getText(row, 'idSolicitud', 'solicitudId'), getText(row, 'metodoPago', 'metodo', 'metodoPagoNombre'), getText(row, 'monto', 'montoPago', 'importe', 'total'), getText(row, 'estado', 'status'), getText(row, 'fechaPago', 'fechaCreacion', 'createdAt')]);
    const csv = [header, ...lines].map((values) => values.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'repara-pagos.csv'; link.click(); URL.revokeObjectURL(url);
  }

  return <>
    <PageHeader eyebrow="CONTROL FINANCIERO" title="Pagos y transacciones" description="Consulta los pagos registrados por la plataforma. Los medios de pago están definidos como simulados en el alcance del proyecto." action={<><button className="button button-secondary" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /> Actualizar</button><button className="button button-primary" onClick={exportCsv} disabled={loading || filtered.length === 0}><ArrowDownToLine size={16} /> Exportar CSV</button></>} />
    {error && <Alert tone="error" onClose={() => setError('')}>{error}</Alert>}
    <div className="summary-grid-two"><div className="summary-card"><div className="summary-card-icon"><CreditCard size={19} /></div><span>Transacciones devueltas</span><strong>{loading ? '…' : rows.length.toLocaleString('es-PE')}</strong></div><div className="summary-card"><div className="summary-card-icon summary-card-icon-green"><span>S/</span></div><span>Suma de montos presentes en la respuesta</span><strong>{loading ? '…' : formatCurrency(total)}</strong><small>Solo incluye registros que contienen un campo de monto reconocible.</small></div></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2 className="table-panel-title">Historial de pagos</h2><p className="table-panel-subtitle">Endpoint <code>GET /admin/pagos</code></p></div><label className="table-search"><Search size={16} /><input placeholder="Buscar por ID, solicitud o método" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar pagos" /></label></div>
      {loading ? <LoadingState label="Cargando transacciones…" /> : filtered.length === 0 ? <EmptyState title="No hay pagos para mostrar" description={search ? 'Prueba con otro término de búsqueda.' : 'El backend no devolvió transacciones o el formato de lista necesita verificarse.'} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Transacción</th><th>Solicitud</th><th>Método de pago</th><th>Monto</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={paymentId(row, index)}><td><div className="transaction-cell"><div className="transaction-icon"><CreditCard size={16} /></div><div><strong>#{paymentId(row, index)}</strong><span>{getText(row, 'referencia', 'codigoOperacion') || 'Sin referencia'}</span></div></div></td><td>{getText(row, 'idSolicitud', 'solicitudId') ? `#${getText(row, 'idSolicitud', 'solicitudId')}` : '—'}</td><td>{getText(row, 'metodoPago', 'metodo', 'metodoPagoNombre') || '—'}</td><td className="amount-cell">{formatCurrency(getField(row, 'monto', 'montoPago', 'importe', 'total'))}</td><td>{formatDate(getField(row, 'fechaPago', 'fechaCreacion', 'createdAt'))}</td><td><StatusPill value={getField(row, 'estado', 'status')} /></td></tr>)}</tbody></table></div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{rows.length}</strong> pago(s)</span><span>Montos en soles peruanos cuando la API los devuelve</span></div>}
    </section>
  </>;
}

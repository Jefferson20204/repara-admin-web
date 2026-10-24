import { Check, ExternalLink, Eye, FileBadge, FileText, Filter, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { postulacionesApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Alert, EmptyState, LoadingState, PageHeader, StatusPill } from '../components/Feedback';
import { ConfirmAction } from '../components/ConfirmAction';
import { Modal } from '../components/Modal';
import { formatDate, getField, getText, humanize, isRecord, toRecordArray, type UnknownRecord } from '../lib/records';

type Application = UnknownRecord;
type ActionState = { kind: 'approve' | 'reject'; row: Application } | null;

function applicantRecord(row: Application): UnknownRecord {
  for (const key of ['usuario', 'postulante', 'usuarioPostulante', 'datosUsuario', 'cliente']) {
    const nested = row[key];
    if (isRecord(nested)) return nested;
  }
  return row;
}
function applicationId(row: Application): string {
  const id = getField(row, 'idPostulacion', 'id', 'postulacionId');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
}
function applicantName(row: Application): string {
  const person = applicantRecord(row);
  const first = getText(person, 'nombres', 'nombre', 'nombresUsuario');
  const last = getText(person, 'apellidos', 'apellido', 'apellidosUsuario');
  return `${first} ${last}`.trim() || getText(row, 'nombrePostulante', 'nombreCompleto', 'correo') || getText(person, 'correo', 'email') || 'Postulante sin nombre';
}
function applicantEmail(row: Application): string {
  return getText(applicantRecord(row), 'correo', 'email', 'correoElectronico') || getText(row, 'correoPostulante');
}
function docUrl(row: Application, ...keys: string[]): string {
  const value = getField(row, ...keys);
  return typeof value === 'string' ? value : '';
}

export function PostulacionesPage() {
  const { token } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [selected, setSelected] = useState<Application | null>(null);
  const [action, setAction] = useState<ActionState>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const result = tab === 'pending' ? await postulacionesApi.pending(token) : await postulacionesApi.all(token);
      setRows(toRecordArray(result, ['postulaciones', 'solicitudesPostulacion']));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las postulaciones.');
      setRows([]);
    } finally { setLoading(false); }
  }, [token, tab]);

  useEffect(() => { void load(); }, [load, refreshKey]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearch(q);
  }, [location.search]);

  const statusOptions = useMemo(() => [...new Set(rows.map((row) => getText(row, 'estado', 'status').toUpperCase()).filter(Boolean))], [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${applicantName(row)} ${applicantEmail(row)} ${getText(row, 'especialidadDeclarada', 'especialidad')} ${applicationId(row)}`.toLowerCase();
    const qMatch = text.includes(search.toLowerCase().trim());
    const status = getText(row, 'estado', 'status').toUpperCase();
    return qMatch && (statusFilter === 'TODOS' || status === statusFilter);
  }), [rows, search, statusFilter]);
  const pendingCount = rows.filter((row) => /PENDIENT|EN_REVISION/.test(getText(row, 'estado', 'status').toUpperCase())).length;

  async function completeAction(reason: string) {
    if (!token || !action) return;
    const id = applicationId(action.row);
    if (!id) throw new Error('No se encontró el identificador de la postulación en la respuesta del backend.');
    if (action.kind === 'approve') {
      await postulacionesApi.approve(token, id);
      setSuccess(`La postulación #${id} fue aprobada.`);
    } else {
      await postulacionesApi.reject(token, id, reason);
      setSuccess(`La postulación #${id} fue rechazada.`);
    }
    setSelected(null);
    await load();
  }

  return <>
    <PageHeader eyebrow="GESTIÓN DE TALENTO TÉCNICO" title="Postulaciones" description="Revisa los expedientes, consulta la documentación y decide qué postulantes pueden operar como técnicos en RePara." action={<button className="button button-secondary" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /> Actualizar</button>} />
    {success && <Alert tone="success" onClose={() => setSuccess('')}>{success}</Alert>}
    {error && <Alert tone="error" onClose={() => setError('')}>{error}</Alert>}
    <div className="applications-callout"><div className="callout-icon"><ShieldCheck size={20} /></div><div><strong>Verificación antes de aprobar</strong><p>Confirma la identidad, especialidad y documentos del postulante. La aprobación habilita al usuario como técnico según la lógica del backend.</p></div></div>
    <div className="panel table-panel">
      <div className="table-toolbar"><div className="tabs"><button className={`tab-button ${tab === 'pending' ? 'tab-active' : ''}`} onClick={() => { setTab('pending'); setStatusFilter('TODOS'); }}><span>Pendientes</span>{tab === 'pending' && !loading && <span className="tab-count">{rows.length}</span>}</button><button className={`tab-button ${tab === 'all' ? 'tab-active' : ''}`} onClick={() => { setTab('all'); setStatusFilter('TODOS'); }}>Todas las postulaciones</button></div><div className="toolbar-controls"><label className="table-search"><Search size={16} /><input placeholder="Buscar postulante…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar postulante" /></label><label className="filter-select"><Filter size={15} /><select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="TODOS">Todos los estados</option>{statusOptions.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select></label></div></div>
      {loading ? <LoadingState label="Cargando expedientes…" /> : filtered.length === 0 ? <EmptyState title={search || statusFilter !== 'TODOS' ? 'No hay coincidencias' : tab === 'pending' ? 'No hay postulaciones pendientes' : 'Todavía no hay postulaciones'} description={search || statusFilter !== 'TODOS' ? 'Prueba con otro texto o cambia el filtro de estado.' : 'Cuando los usuarios envíen su solicitud para ser técnicos, aparecerán aquí.'} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Postulante</th><th>Especialidad</th><th>Experiencia</th><th>Fecha de solicitud</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead><tbody>{filtered.map((row, index) => {
        const id = applicationId(row) || String(index);
        const name = applicantName(row);
        const status = getField(row, 'estado', 'status');
        return <tr key={id}><td><div className="table-person"><div className="person-avatar">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div><strong>{name}</strong><span>{applicantEmail(row) || `ID de postulación: ${id}`}</span></div></div></td><td><span className="specialty-tag">{getText(row, 'especialidadDeclarada', 'especialidad') || 'Sin especialidad'}</span></td><td>{getField(row, 'aniosExperiencia', 'experienciaAnios') !== undefined ? `${String(getField(row, 'aniosExperiencia', 'experienciaAnios'))} años` : '—'}</td><td>{formatDate(getField(row, 'fechaPostulacion', 'createdAt', 'fechaCreacion'))}</td><td><StatusPill value={status} /></td><td><div className="row-actions"><button className="icon-action" title="Ver expediente" aria-label={`Ver expediente de ${name}`} onClick={() => setSelected(row)}><Eye size={16} /></button>{/PENDIENT|EN_REVISION/.test(String(status ?? '').toUpperCase()) && <><button className="icon-action icon-action-approve" title="Aprobar" aria-label={`Aprobar ${name}`} onClick={() => setAction({ kind: 'approve', row })}><Check size={16} /></button><button className="icon-action icon-action-reject" title="Rechazar" aria-label={`Rechazar ${name}`} onClick={() => setAction({ kind: 'reject', row })}><X size={16} /></button></>}</div></td></tr>;
      })}</tbody></table></div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{rows.length}</strong> registro(s)</span><span>{tab === 'pending' ? `${pendingCount} pendiente(s)` : 'Listado completo'}</span></div>}
    </div>
    {selected && <Modal title="Detalle de la postulación" description={`Expediente #${applicationId(selected) || '—'} · enviada el ${formatDate(getField(selected, 'fechaPostulacion'))}`} onClose={() => setSelected(null)} wide>
      <div className="applicant-profile"><div className="profile-large-avatar">{applicantName(selected).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div><h3>{applicantName(selected)}</h3><p>{applicantEmail(selected) || 'Correo no disponible en la respuesta API'}</p><StatusPill value={getField(selected, 'estado', 'status')} /></div></div>
      <div className="detail-grid"><div className="detail-field"><span>Especialidad declarada</span><strong>{getText(selected, 'especialidadDeclarada', 'especialidad') || '—'}</strong></div><div className="detail-field"><span>Años de experiencia</span><strong>{getField(selected, 'aniosExperiencia', 'experienciaAnios') !== undefined ? String(getField(selected, 'aniosExperiencia', 'experienciaAnios')) : '—'}</strong></div><div className="detail-field"><span>Fecha de revisión</span><strong>{formatDate(getField(selected, 'fechaRevision'))}</strong></div><div className="detail-field"><span>Motivo de rechazo</span><strong>{getText(selected, 'motivoRechazo') || '—'}</strong></div></div>
      <h3 className="section-title">Documentación presentada</h3><div className="document-list">{[
        { label: 'Currículum vitae (CV)', url: docUrl(selected, 'cvUrl', 'urlCv'), icon: FileText },
        { label: 'Certificados', url: docUrl(selected, 'certificadosUrl', 'urlCertificados'), icon: FileBadge },
        { label: 'Documento de identidad', url: docUrl(selected, 'dniDocumentoUrl', 'documentoDniUrl', 'urlDni'), icon: ShieldCheck },
      ].map(({ label, url, icon: Icon }) => <div className="document-row" key={label}><div className="document-icon"><Icon size={18} /></div><div><strong>{label}</strong><span>{url ? 'Documento enlazado' : 'La API no devolvió una URL para este documento'}</span></div>{url ? <a className="button button-secondary button-small" href={url} target="_blank" rel="noreferrer">Abrir <ExternalLink size={14} /></a> : <span className="document-missing">No disponible</span>}</div>)}</div>
      {getText(selected, 'motivoRechazo') && <div className="rejection-note"><strong>Observación de rechazo</strong><p>{getText(selected, 'motivoRechazo')}</p></div>}
      <div className="modal-actions"><button className="button button-secondary" onClick={() => setSelected(null)}>Cerrar</button>{/PENDIENT|EN_REVISION/.test(getText(selected, 'estado', 'status').toUpperCase()) && <><button className="button button-danger button-outline-danger" onClick={() => { setAction({ kind: 'reject', row: selected }); setSelected(null); }}>Rechazar postulación</button><button className="button button-primary" onClick={() => { setAction({ kind: 'approve', row: selected }); setSelected(null); }}><Check size={16} /> Aprobar técnico</button></>}</div>
    </Modal>}
    {action && <ConfirmAction title={action.kind === 'approve' ? 'Aprobar postulación' : 'Rechazar postulación'} description={action.kind === 'approve' ? `¿Confirmas que ${applicantName(action.row)} cumple los requisitos para operar como técnico?` : `La decisión de rechazo se registrará en el expediente de ${applicantName(action.row)}.`} confirmLabel={action.kind === 'approve' ? 'Sí, aprobar técnico' : 'Confirmar rechazo'} tone={action.kind === 'approve' ? 'primary' : 'danger'} requireReason={action.kind === 'reject'} reasonLabel="Motivo del rechazo" onConfirm={completeAction} onClose={() => setAction(null)} />}
    <div className="contract-hint"><ShieldCheck size={15} /><span>La aprobación usa <code>POST /postulaciones/{'{id}'}/aprobar</code>. El body de rechazo aparece como mapa genérico en Swagger; el campo predeterminado es <code>motivoRechazo</code> y se configura con <code>VITE_REJECTION_REASON_FIELD</code>. Verifícalo con el DTO real.</span></div>
  </>;
}

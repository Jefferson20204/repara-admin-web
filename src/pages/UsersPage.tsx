import { Ban, CheckCircle2, Eye, RefreshCw, Search, Shield, Users as UsersIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Alert, EmptyState, LoadingState, PageHeader, StatusPill } from '../components/Feedback';
import { ConfirmAction } from '../components/ConfirmAction';
import { Modal } from '../components/Modal';
import { formatDate, getField, getText, humanize, toRecordArray, type UnknownRecord } from '../lib/records';

function userId(row: UnknownRecord): string {
  const value = getField(row, 'idUsuario', 'id', 'usuarioId');
  return typeof value === 'number' || typeof value === 'string' ? String(value) : '';
}
function userName(row: UnknownRecord): string {
  const combined = `${getText(row, 'nombres', 'nombre')} ${getText(row, 'apellidos', 'apellido')}`.trim();
  return combined || getText(row, 'correo', 'email') || 'Usuario sin nombre';
}

export function UsersPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<UnknownRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TODOS');
  const [suspendTarget, setSuspendTarget] = useState<UnknownRecord | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<UnknownRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { setRows(toRecordArray(await adminApi.users(token), ['usuarios', 'users'])); }
    catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load, refreshKey]);

  const roleOptions = useMemo(() => [...new Set(rows.map((row) => getText(row, 'rol', 'role').toUpperCase()).filter(Boolean))], [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${userName(row)} ${getText(row, 'correo', 'email')} ${getText(row, 'telefono', 'celular')} ${userId(row)}`.toLowerCase();
    return text.includes(search.toLowerCase().trim()) && (role === 'TODOS' || getText(row, 'rol', 'role').toUpperCase() === role);
  }), [rows, search, role]);

  async function suspend(reason: string) {
    if (!token || !suspendTarget) return;
    const id = userId(suspendTarget);
    if (!id) throw new Error('No se encontró idUsuario en la respuesta del backend.');
    await adminApi.suspendUser(token, id, reason);
    setSuccess(`Se solicitó la suspensión de ${userName(suspendTarget)}.`);
    await load();
  }

  return <>
    <PageHeader eyebrow="CUENTAS Y ACCESOS" title="Gestión de usuarios" description="Consulta las cuentas registradas, sus roles y estados. Las acciones administrativas se validan en el backend." action={<button className="button button-secondary" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /> Actualizar</button>} />
    {success && <Alert tone="success" onClose={() => setSuccess('')}>{success}</Alert>}{error && <Alert tone="error" onClose={() => setError('')}>{error}</Alert>}
    <div className="summary-strip"><div className="summary-strip-icon"><UsersIcon size={19} /></div><div><span>Usuarios recibidos del backend</span><strong>{loading ? '…' : rows.length.toLocaleString('es-PE')}</strong></div><div className="summary-strip-divider" /><div className="summary-strip-icon summary-strip-icon-green"><Shield size={19} /></div><div><span>Roles identificados</span><strong>{roleOptions.length}</strong></div></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2 className="table-panel-title">Usuarios registrados</h2><p className="table-panel-subtitle">Endpoint <code>GET /admin/usuarios</code></p></div><div className="toolbar-controls"><label className="table-search"><Search size={16} /><input placeholder="Buscar por nombre, correo o ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar usuarios" /></label><select className="plain-select" aria-label="Filtrar rol" value={role} onChange={(e) => setRole(e.target.value)}><option value="TODOS">Todos los roles</option>{roleOptions.map((item) => <option value={item} key={item}>{humanize(item)}</option>)}</select></div></div>
      {loading ? <LoadingState label="Cargando usuarios…" /> : filtered.length === 0 ? <EmptyState title="No se encontraron usuarios" description={search ? 'Prueba con otros términos de búsqueda.' : 'El backend no devolvió usuarios para mostrar.'} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Usuario</th><th>Teléfono</th><th>Rol</th><th>Fecha de registro</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead><tbody>{filtered.map((row, index) => {
        const id = userId(row) || String(index); const name = userName(row); const status = getField(row, 'estado', 'status'); const suspended = /SUSPEND|INACTIV/.test(String(status ?? '').toUpperCase());
        return <tr key={id}><td><div className="table-person"><div className="person-avatar person-avatar-blue">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div><strong>{name}</strong><span>{getText(row, 'correo', 'email') || 'Correo no disponible'}</span></div></div></td><td>{getText(row, 'telefono', 'celular') || '—'}</td><td><span className="role-tag">{humanize(getText(row, 'rol', 'role'))}</span></td><td>{formatDate(getField(row, 'fechaRegistro', 'createdAt'))}</td><td><StatusPill value={status} /></td><td><div className="row-actions"><button className="icon-action" title="Detalle disponible en la respuesta API" aria-label={`Detalle de ${name}`} onClick={() => setDetailsTarget(row)}><Eye size={16} /></button>{!suspended && <button className="icon-action icon-action-reject" title="Suspender usuario" aria-label={`Suspender ${name}`} onClick={() => setSuspendTarget(row)}><Ban size={16} /></button>}</div></td></tr>;
      })}</tbody></table></div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{rows.length}</strong> usuario(s)</span><span><CheckCircle2 size={14} /> Datos consultados en tiempo real</span></div>}
    </section>
    <div className="contract-hint"><Shield size={15} /><span>La ruta de suspensión <code>POST /admin/usuarios/{'{id}'}/suspender</code> muestra un body genérico en Swagger. El campo se configura con <code>VITE_SUSPENSION_REASON_FIELD</code>; confirmar el nombre exacto con el DTO antes de usar en producción.</span></div>
    {detailsTarget && <Modal title="Detalle del usuario" description={`Cuenta #${userId(detailsTarget) || '—'}`} onClose={() => setDetailsTarget(null)}><div className="applicant-profile"><div className="profile-large-avatar">{userName(detailsTarget).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div><h3>{userName(detailsTarget)}</h3><p>{getText(detailsTarget, 'correo', 'email') || 'Correo no disponible'}</p><StatusPill value={getField(detailsTarget, 'estado', 'status')} /></div></div><div className="detail-grid"><div className="detail-field"><span>ID de usuario</span><strong>{userId(detailsTarget) || '—'}</strong></div><div className="detail-field"><span>Rol</span><strong>{humanize(getText(detailsTarget, 'rol', 'role'))}</strong></div><div className="detail-field"><span>Teléfono</span><strong>{getText(detailsTarget, 'telefono', 'celular') || '—'}</strong></div><div className="detail-field"><span>Fecha de registro</span><strong>{formatDate(getField(detailsTarget, 'fechaRegistro', 'createdAt'))}</strong></div><div className="detail-field"><span>DNI</span><strong>{getText(detailsTarget, 'dni', 'documento') || '—'}</strong></div><div className="detail-field"><span>Correo verificado</span><strong>{getField(detailsTarget, 'correoVerificado') === true ? 'Sí' : getField(detailsTarget, 'correoVerificado') === false ? 'No' : '—'}</strong></div></div><div className="modal-actions"><button className="button button-secondary" onClick={() => setDetailsTarget(null)}>Cerrar</button></div></Modal>}
    {suspendTarget && <ConfirmAction title="Suspender usuario" description={`Esta acción puede limitar el acceso de ${userName(suspendTarget)} a RePara. Confirma que la suspensión corresponda.`} confirmLabel="Suspender usuario" tone="danger" requireReason reasonLabel="Motivo de la suspensión" onConfirm={suspend} onClose={() => setSuspendTarget(null)} />}
  </>;
}

import { Bell, CheckCircle2, Info, Send, ShieldAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Alert, PageHeader } from '../components/Feedback';

export function NotificationsPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!title.trim() || !message.trim()) { setError('Completa el título y el mensaje.'); return; }
    if (!token) { setError('La sesión ha expirado. Inicia sesión nuevamente.'); return; }
    setBusy(true);
    try {
      const result = await adminApi.sendNotification(token, title.trim(), message.trim());
      const responseMessage = typeof result === 'object' && result !== null && 'mensaje' in result && typeof result.mensaje === 'string' ? result.mensaje : 'El backend aceptó la solicitud de notificación.';
      setSuccess(responseMessage); setTitle(''); setMessage('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo enviar la notificación.'); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader eyebrow="COMUNICACIÓN" title="Centro de notificaciones" description="Redacta un aviso para la comunidad RePara y solicita el envío al backend administrativo." />
    {error && <Alert tone="error" onClose={() => setError('')}>{error}</Alert>}{success && <Alert tone="success" onClose={() => setSuccess('')}>{success}</Alert>}
    <div className="notification-layout"><section className="panel notification-editor"><div className="panel-header"><div className="panel-header-icon"><Bell size={20} /></div><div><h2>Nueva notificación</h2><p>Redacta un mensaje claro y directo.</p></div></div>
      <form className="notification-form" onSubmit={submit}><label className="field-label">Título del aviso<input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Mantenimiento programado" required /><small>{title.length}/100 caracteres</small></label><label className="field-label">Mensaje<textarea rows={6} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe aquí el contenido que recibirán los usuarios…" required /><small>{message.length}/1000 caracteres</small></label><div className="notification-target"><div className="notification-target-icon"><Bell size={17} /></div><div><strong>Audiencia</strong><span>El alcance exacto lo determina el contrato del backend para <code>POST /admin/notificar</code>.</span></div></div><button className="button button-primary notification-submit" type="submit" disabled={busy}>{busy ? 'Enviando solicitud…' : 'Enviar notificación'} <Send size={16} /></button></form>
    </section><aside className="notification-preview-column"><div className="notification-preview-card"><div className="preview-label"><span className="preview-dot" /> VISTA PREVIA</div><div className="phone-preview"><div className="phone-preview-top"><div className="phone-logo-small"><WrenchIcon /></div><div><strong>RePara</strong><span>Ahora</span></div><Bell size={16} /></div><div className="phone-preview-body"><strong>{title || 'Título de tu notificación'}</strong><p>{message || 'Aquí aparecerá el texto del aviso tal como lo redactes en el formulario.'}</p></div><span className="phone-preview-footer">Notificación de RePara</span></div><p className="preview-caption">Esta es una vista previa visual. No representa una notificación enviada ni garantiza que el dispositivo la reciba.</p></div>
      <div className="info-panel"><div className="info-panel-icon"><ShieldAlert size={19} /></div><div><strong>Antes de enviar</strong><p>El contrato publicado en Swagger muestra un body genérico para este endpoint. El formulario usa los nombres configurables en el archivo <code>.env</code> y debe verificarse con el DTO de backend antes de desplegar.</p></div></div>
      <div className="response-tip"><Info size={17} /><span>Si el backend devuelve un error, la interfaz lo mostrará y conservará el contenido para que puedas corregirlo y volver a intentar.</span></div>
    </aside></div>
  </>;
}

function WrenchIcon() { return <CheckCircle2 size={18} />; }

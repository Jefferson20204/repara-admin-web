import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Alert } from './Feedback';

export function ConfirmAction({ title, description, confirmLabel, tone = 'primary', requireReason = false, reasonLabel = 'Motivo', onConfirm, onClose }: {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (requireReason && !reason.trim()) { setError('Escribe un motivo para continuar.'); return; }
    setBusy(true); setError('');
    try { await onConfirm(reason.trim()); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); }
    finally { setBusy(false); }
  }
  return <Modal title={title} description={description} onClose={busy ? () => undefined : onClose}>
    <div className="confirm-illustration"><AlertTriangle size={23} /></div>
    {requireReason && <label className="field-label">{reasonLabel}<textarea rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Escribe el motivo…" /></label>}
    {error && <Alert tone="error">{error}</Alert>}
    <div className="modal-actions"><button className="button button-secondary" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className={`button ${tone === 'danger' ? 'button-danger' : 'button-primary'}`} type="button" disabled={busy} onClick={submit}>{busy && <LoaderCircle size={16} className="spin" />}{confirmLabel}</button></div>
  </Modal>;
}

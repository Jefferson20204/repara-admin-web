import { AlertCircle, CheckCircle2, Info, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function Alert({ tone = 'info', children, onClose }: { tone?: 'info' | 'success' | 'error'; children: ReactNode; onClose?: () => void }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Info;
  return (
    <div className={`alert alert-${tone}`} role="status">
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
      {onClose && <button className="icon-button alert-close" type="button" aria-label="Cerrar mensaje" onClick={onClose}>×</button>}
    </div>
  );
}

export function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} /> <span>{label}</span></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Info size={22} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}

export function StatusPill({ value }: { value: unknown }) {
  const raw = typeof value === 'string' ? value : 'SIN_ESTADO';
  const normalized = raw.toUpperCase();
  const tone = /APROBAD|ACTIVO|COMPLET|PAGADO|DISPONIBLE|FINALIZAD/.test(normalized) ? 'green'
    : /PENDIENT|ANALISIS|EN_REVISION|PROCESO/.test(normalized) ? 'amber'
      : /RECHAZ|SUSPEND|CANCEL|INACTIV|ERROR|FALLID/.test(normalized) ? 'red' : 'gray';
  const label = raw.replaceAll('_', ' ').toLowerCase().replace(/\b\p{L}/gu, (s) => s.toUpperCase());
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{label}</span>;
}

import { ArrowRight, Eye, EyeOff, ShieldCheck, Wrench } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api/http';

export function LoginPage() {
  const { token, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  if (token) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try { await login(email.trim(), password); navigate('/', { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.'); }
  }

  return <div className="login-page">
    <section className="login-visual"><div className="login-visual-grid" /><div className="login-visual-content"><div className="brand brand-light"><div className="brand-mark"><Wrench size={20} strokeWidth={2.6} /></div><div><span className="brand-name">RePara<span>.</span></span><small>ADMINISTRACIÓN</small></div></div><div className="login-hero-copy"><div className="login-pill"><span className="online-dot" /> PLATAFORMA DE OPERACIONES</div><h1>Todo el servicio.<br /><span>En buenas manos.</span></h1><p>Supervisa técnicos, revisa postulaciones y mantén cada servicio en movimiento desde un solo lugar.</p><div className="login-feature-list"><div><ShieldCheck size={18} /><span>Acceso protegido por roles</span></div><div><ClipboardCheckIcon /><span>Revisión de postulaciones técnicas</span></div><div><ActivityIcon /><span>Información operativa centralizada</span></div></div></div><div className="login-visual-foot"><span>REPARA · SERVICIOS TÉCNICOS A DOMICILIO</span><span>PERÚ</span></div></div></section>
    <section className="login-form-area"><div className="login-form-container"><div className="login-mobile-brand brand"><div className="brand-mark"><Wrench size={20} /></div><div><span className="brand-name">RePara<span>.</span></span><small>ADMINISTRACIÓN</small></div></div><div className="login-form-heading"><div className="login-form-icon"><ShieldCheck size={22} /></div><div className="eyebrow">BIENVENIDO DE NUEVO</div><h2>Inicia sesión</h2><p>Ingresa con tu cuenta administrativa para continuar.</p></div>
      <form onSubmit={submit} className="login-form"><label className="field-label">Correo electrónico<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@repara.pe" required /></label><label className="field-label">Contraseña<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? 'Verificando acceso…' : 'Ingresar al panel'} {!loading && <ArrowRight size={18} />}</button>
      </form>
      <div className="login-security"><ShieldCheck size={16} /><span>Solo personal autorizado. El acceso se valida con el backend de RePara.</span></div><div className="login-api">API configurada: <code>{API_BASE_URL}</code></div>
    </div><div className="login-copyright">© {new Date().getFullYear()} RePara. Todos los derechos reservados.</div></section>
  </div>;
}

function ClipboardCheckIcon() { return <span className="inline-icon"><Wrench size={17} /></span>; }
function ActivityIcon() { return <span className="inline-icon"><ShieldCheck size={17} /></span>; }

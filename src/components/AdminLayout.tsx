import {
  Activity, Bell, CreditCard, LayoutDashboard, LogOut, Menu, Search, Settings2,
  ShieldCheck, Users, Wrench, X, ClipboardCheck,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../lib/records';

const navigation = [
  { label: 'Resumen', path: '/', icon: LayoutDashboard, exact: true },
  { label: 'Postulaciones', path: '/postulaciones', icon: ClipboardCheck, badge: 'Revisión' },
  { label: 'Usuarios', path: '/usuarios', icon: Users },
  { label: 'Pagos', path: '/pagos', icon: CreditCard },
  { label: 'Notificaciones', path: '/notificaciones', icon: Bell },
];
const titles: Record<string, string> = {
  '/': 'Resumen general', '/postulaciones': 'Postulaciones', '/usuarios': 'Gestión de usuarios',
  '/pagos': 'Pagos y transacciones', '/notificaciones': 'Centro de notificaciones',
};

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pageTitle = useMemo(() => titles[location.pathname] ?? 'Administración', [location.pathname]);
  function signOut() { logout(); navigate('/login', { replace: true }); }

  return <div className="app-shell">
    {mobileMenuOpen && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)} />}
    <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wrench size={20} strokeWidth={2.6} /></div><div><span className="brand-name">RePara<span>.</span></span><small>ADMINISTRACIÓN</small></div><button className="icon-button mobile-close" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button></div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      <nav className="side-nav" aria-label="Navegación principal">
        {navigation.map(({ label, path, icon: Icon, exact, badge }) => <NavLink key={path} to={path} end={exact} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{badge && <span className="nav-mini-badge">{badge}</span>}
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="security-note"><div className="security-note-icon"><ShieldCheck size={17} /></div><div><strong>Entorno protegido</strong><span>Acceso administrativo</span></div></div>
        <button className="nav-link logout-link" onClick={signOut}><LogOut size={18} /><span>Cerrar sesión</span></button>
        <div className="sidebar-footer"><span className="online-dot" /> API conectada según disponibilidad <span className="version-tag">v1.0</span></div>
      </div>
    </aside>

    <div className="main-frame">
      <header className="topbar">
        <div className="topbar-heading"><button className="icon-button mobile-menu-button" aria-label="Abrir menú" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button><div><div className="breadcrumb">Panel <span>/</span> {pageTitle}</div><div className="topbar-subtitle">Centro de control de RePara</div></div></div>
        <div className="topbar-actions">
          <form className="global-search" onSubmit={(e) => { e.preventDefault(); if (search.trim()) navigate(`/postulaciones?q=${encodeURIComponent(search.trim())}`); }}><Search size={16} /><input aria-label="Buscar postulaciones" placeholder="Buscar postulaciones…" value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>↵</kbd></form>
          <div className="topbar-divider" />
          <div className="user-menu"><div className="user-avatar">{initials(user?.name ?? 'Administrador')}</div><div className="user-menu-text"><strong>{user?.name || 'Administrador'}</strong><span>Administrador</span></div><Activity size={15} className="user-online" /></div>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>© {new Date().getFullYear()} RePara</span><span><Settings2 size={13} /> Panel de gestión</span></footer>
    </div>
  </div>;
}

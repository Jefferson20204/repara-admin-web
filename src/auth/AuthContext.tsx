import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type LoginResponse } from '../api/services';
import { isRecord, unwrapData } from '../lib/records';

type AuthUser = { name: string; email: string; role: string };
type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'repara_admin_token';
const USER_KEY = 'repara_admin_user';

function roleOf(raw: unknown): string {
  if (!isRecord(raw)) return '';
  const nested = isRecord(raw.usuario) ? raw.usuario : isRecord(raw.user) ? raw.user : raw;
  const role = nested.rol ?? nested.role ?? raw.rol ?? raw.role;
  return typeof role === 'string' ? role.toUpperCase().replace(/^ROLE_/, '') : '';
}

function userOf(raw: unknown): AuthUser {
  const data = unwrapData<unknown>(raw);
  const outer = isRecord(data) ? data : {};
  const nested = isRecord(outer.usuario) ? outer.usuario : isRecord(outer.user) ? outer.user : outer;
  const first = typeof nested.nombres === 'string' ? nested.nombres : typeof nested.nombre === 'string' ? nested.nombre : '';
  const last = typeof nested.apellidos === 'string' ? nested.apellidos : '';
  return {
    name: `${first} ${last}`.trim() || (typeof nested.correo === 'string' ? nested.correo : 'Administrador'),
    email: typeof nested.correo === 'string' ? nested.correo : '',
    role: roleOf(outer) || roleOf(nested) || 'ADMIN',
  };
}

function tokenOf(raw: unknown): string {
  const data = unwrapData<unknown>(raw);
  if (!isRecord(data)) return '';
  const nested = isRecord(data.usuario) ? data.usuario : isRecord(data.user) ? data.user : data;
  const token = data.token ?? data.accessToken ?? data.jwt ?? nested.token;
  return typeof token === 'string' ? token : '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem(USER_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored) as AuthUser; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('repara:unauthorized', onUnauthorized);
    return () => window.removeEventListener('repara:unauthorized', onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      const data = unwrapData<LoginResponse>(response);
      const role = roleOf(data);
      if (role && role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
        throw new Error('Esta cuenta no tiene permisos de administrador.');
      }
      const accessToken = tokenOf(response);
      if (!accessToken) throw new Error('El backend respondió, pero no se encontró el JWT en la respuesta de login. Verifica el esquema de autenticación.');
      const profile = userOf(data);
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
      setToken(accessToken);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return context;
}

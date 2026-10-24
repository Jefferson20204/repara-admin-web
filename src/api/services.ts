import { apiRequest } from './http';

export type LoginResponse = {
  token?: string;
  accessToken?: string;
  tipoToken?: string;
  rol?: string;
  usuario?: Record<string, unknown>;
  idUsuario?: number | string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  [key: string]: unknown;
};

export const authApi = {
  login: (correo: string, contrasena: string) =>
    apiRequest<unknown>('/autenticacion/login', { method: 'POST', body: { correo, contrasena } }),
};

export const adminApi = {
  dashboard: (token: string) => apiRequest<unknown>('/admin/dashboard', { token }),
  users: (token: string) => apiRequest<unknown>('/admin/usuarios', { token }),
  payments: (token: string) => apiRequest<unknown>('/admin/pagos', { token }),
  suspendUser: (token: string, id: string | number, reason: string) => {
    const field = import.meta.env.VITE_SUSPENSION_REASON_FIELD || 'motivoSuspension';
    return apiRequest<unknown>(`/admin/usuarios/${encodeURIComponent(String(id))}/suspender`, {
      method: 'POST', token, body: { [field]: reason },
    });
  },
  sendNotification: (token: string, title: string, message: string) => {
    const titleField = import.meta.env.VITE_NOTIFICATION_TITLE_FIELD || 'titulo';
    const messageField = import.meta.env.VITE_NOTIFICATION_MESSAGE_FIELD || 'mensaje';
    return apiRequest<unknown>('/admin/notificar', {
      method: 'POST', token, body: { [titleField]: title, [messageField]: message },
    });
  },
};

export const postulacionesApi = {
  pending: (token: string) => apiRequest<unknown>('/postulaciones/pendientes', { token }),
  all: (token: string) => apiRequest<unknown>('/postulaciones/todas', { token }),
  approve: (token: string, id: string | number) =>
    apiRequest<unknown>(`/postulaciones/${encodeURIComponent(String(id))}/aprobar`, { method: 'POST', token }),
  reject: (token: string, id: string | number, reason: string) => {
    // Swagger currently shows a generic Map. Verify this property name against the live DTO.
    const field = import.meta.env.VITE_REJECTION_REASON_FIELD || 'motivoRechazo';
    return apiRequest<unknown>(`/postulaciones/${encodeURIComponent(String(id))}/rechazar`, {
      method: 'POST', token, body: { [field]: reason },
    });
  },
};

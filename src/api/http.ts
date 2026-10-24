import { isRecord } from '../lib/records';

const configuredBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const API_BASE_URL = configuredBase.replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(`No se pudo conectar con el backend. Revisa la API en ${API_BASE_URL}.`, 0, error);
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try { parsed = JSON.parse(text) as unknown; }
    catch { parsed = text; }
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('repara:unauthorized'));
  }

  if (!response.ok) {
    let message = `La solicitud falló (HTTP ${response.status}).`;
    if (isRecord(parsed)) {
      const candidate = parsed.mensaje ?? parsed.message ?? parsed.error;
      if (typeof candidate === 'string' && candidate) message = candidate;
    } else if (typeof parsed === 'string' && parsed) {
      message = parsed.slice(0, 220);
    }
    throw new ApiError(message, response.status, parsed);
  }

  if (isRecord(parsed) && parsed.exito === false) {
    const message = typeof parsed.mensaje === 'string' ? parsed.mensaje : 'El backend indicó que la operación no tuvo éxito.';
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}

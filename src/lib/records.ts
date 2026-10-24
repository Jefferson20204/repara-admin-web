export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getField(record: UnknownRecord | null | undefined, ...keys: string[]): unknown {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function getText(record: UnknownRecord | null | undefined, ...keys: string[]): string {
  const value = getField(record, ...keys);
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function unwrapData<T = unknown>(raw: unknown): T {
  if (isRecord(raw) && 'datos' in raw) return raw.datos as T;
  return raw as T;
}

export function toRecordArray(raw: unknown, nestedKeys: string[] = []): UnknownRecord[] {
  const data = unwrapData<unknown>(raw);
  if (Array.isArray(data)) return data.filter(isRecord);
  if (isRecord(data)) {
    for (const key of [...nestedKeys, 'content', 'items', 'results', 'resultados', 'data']) {
      const value = data[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  return [];
}

export function formatDate(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
}

export function formatCurrency(value: unknown): string {
  const numeric = asNumber(value);
  if (numeric === null) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatNumber(value: unknown): string {
  const numeric = asNumber(value);
  if (numeric === null) return '—';
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(numeric);
}

export function humanize(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Sin especificar';
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-PE'));
}

export function initials(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'RP';
}

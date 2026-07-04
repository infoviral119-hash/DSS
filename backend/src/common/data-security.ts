import type { AuthUser } from '../modules/auth/auth.service';

export type DataScope = 'national' | 'province' | 'city';

export interface SecurityContext extends AuthUser {
  dataScope?: DataScope;
  scopeRegion?: string | null;
  canRevealPii?: boolean;
}

const NATIONAL_ROLES = new Set(['admin', 'auditor', 'direktur', 'ketua_yayasan']);

const ROLE_DEFAULT_SCOPE: Record<string, DataScope> = {
  admin: 'national',
  auditor: 'national',
  direktur: 'national',
  ketua_yayasan: 'national',
  supervisor: 'province',
  operator: 'city',
  psikolog: 'city',
};

export function resolveDataScope(user: SecurityContext): DataScope {
  if (user.dataScope) return user.dataScope;
  return ROLE_DEFAULT_SCOPE[user.role] ?? 'city';
}

export function applyRowScope<T extends Record<string, unknown>>(
  rows: T[],
  user?: SecurityContext | null,
): T[] {
  if (!user) return rows;
  if (NATIONAL_ROLES.has(user.role)) return rows;

  const scope = resolveDataScope(user);
  const region = user.scopeRegion?.trim();
  if (!region || scope === 'national') return rows;

  if (scope === 'province') {
    return rows.filter((r) => {
      const prov = String(r.provinsi ?? '');
      return prov.toLowerCase().includes(region.toLowerCase());
    });
  }

  return rows.filter((r) => {
    const kab = String(r.kabupaten ?? '');
    return kab.toLowerCase().includes(region.toLowerCase());
  });
}

export function maskName(value: string): string {
  if (!value || value.length <= 1) return '*';
  return `${value.charAt(0)}${'*'.repeat(Math.min(value.length - 1, 8))}`;
}

export function maskAddress(value: string): string {
  if (!value) return '***';
  return value.length > 4 ? `${value.slice(0, 4)}${'*'.repeat(6)}` : '****';
}

export function maskPhone(value: string): string {
  if (!value || value.length < 4) return '****';
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(value.length - 6, 2))}${value.slice(-2)}`;
}

const ADMIN_ROLES = new Set(['admin', 'auditor', 'direktur', 'supervisor']);

const SENSITIVE_FIELDS = ['nama_korban', 'alamat', 'catatan'] as const;

export function maskCaseRecord(
  record: Record<string, unknown>,
  user?: SecurityContext | null,
  revealedFields: Set<string> = new Set(),
): Record<string, unknown> {
  if (!user || ADMIN_ROLES.has(user.role) || user.canRevealPii) return record;

  const out = { ...record };
  for (const field of SENSITIVE_FIELDS) {
    if (revealedFields.has(field)) continue;
    const val = String(out[field] ?? '');
    if (!val) continue;
    if (field === 'nama_korban') out[field] = maskName(val);
    else if (field === 'alamat') out[field] = maskAddress(val);
    else if (field === 'catatan') out[field] = '********';
    out[`${field}_masked`] = true;
  }
  return out;
}

export function canRevealField(user?: SecurityContext | null, field?: string): boolean {
  if (!user || !field) return false;
  if (user.canRevealPii || user.role === 'admin') return true;
  if (user.role === 'supervisor' && field === 'nama_korban') return true;
  if (user.role === 'auditor') return true;
  return false;
}

export function roleToSecuritySlug(role: string): string {
  const map: Record<string, string> = {
    admin: 'super_admin',
    operator: 'operator',
    supervisor: 'supervisor',
    auditor: 'auditor',
    psikolog: 'analyst',
    direktur: 'executive',
    ketua_yayasan: 'executive',
  };
  return map[role] ?? role;
}

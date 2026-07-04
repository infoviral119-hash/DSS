import type { AuthUser } from './shared'

type SecurityContext = AuthUser
type CaseRow = Record<string, unknown>

const NATIONAL_ROLES = new Set(['admin', 'auditor', 'direktur', 'ketua_yayasan'])
const ADMIN_ROLES = new Set(['admin', 'auditor', 'direktur', 'supervisor'])
const ROLE_DEFAULT_SCOPE: Record<string, string> = {
  admin: 'national', auditor: 'national', direktur: 'national', ketua_yayasan: 'national',
  supervisor: 'province', operator: 'city', psikolog: 'city',
}

function resolveDataScope(user: SecurityContext) {
  return user.dataScope || ROLE_DEFAULT_SCOPE[user.role] || 'city'
}

export function applyRowScope(rows: CaseRow[], user?: AuthUser | null): CaseRow[] {
  if (!user || NATIONAL_ROLES.has(user.role)) return rows
  const scope = resolveDataScope(user)
  const region = user.scopeRegion?.trim()
  if (!region || scope === 'national') return rows
  if (scope === 'province') {
    return rows.filter((r) => String(r.provinsi ?? '').toLowerCase().includes(region.toLowerCase()))
  }
  return rows.filter((r) => String(r.kabupaten ?? '').toLowerCase().includes(region.toLowerCase()))
}

function maskName(value: string) {
  if (!value || value.length <= 1) return '*'
  return `${value.charAt(0)}${'*'.repeat(Math.min(value.length - 1, 8))}`
}

function maskAddress(value: string) {
  if (!value) return '***'
  return value.length > 4 ? `${value.slice(0, 4)}${'*'.repeat(6)}` : '****'
}

const SENSITIVE_FIELDS = ['nama_korban', 'alamat', 'catatan'] as const

export function maskCaseRecord(record: CaseRow, user?: AuthUser | null): CaseRow {
  if (!user || ADMIN_ROLES.has(user.role) || user.canRevealPii) return record
  const out = { ...record }
  for (const field of SENSITIVE_FIELDS) {
    const val = String(out[field] ?? '')
    if (!val) continue
    if (field === 'nama_korban') out[field] = maskName(val)
    else if (field === 'alamat') out[field] = maskAddress(val)
    else if (field === 'catatan') out[field] = '********'
    out[`${field}_masked`] = true
  }
  return out
}

export function processCases(raw: CaseRow[], user?: AuthUser | null) {
  const scoped = applyRowScope(raw, user)
  return scoped.map((c) => maskCaseRecord(c, user))
}

import * as XLSX from 'xlsx'
import type { AuthUser, Env } from './shared'
import { dbClient } from './shared'
import { normalizeKabupaten, resolveCoords } from './coords'
import {
  CASE_FIELDS, COLUMN_ALIASES, MIN_LOGBOOK_YEAR,
  type CaseFieldKey, type ColumnIssue, type ImportBatch, type ImportLogEntry, type ImportRow,
} from './import-constants'
import { parseLogbookFile } from './logbook-parser'

type BatchStore = {
  headers: string[]
  mapping: Record<string, string>
  rawRows: Record<string, unknown>[]
  isLogbook?: boolean
  logbookFormat?: string | null
  skippedRows?: number
  rows?: ImportRow[]
  logs: ImportLogEntry[]
  emptyColumns?: ColumnIssue[]
  invalidColumns?: ColumnIssue[]
  validRows?: number
  errorRows?: number
  duplicateRows?: number
  warningRows?: number
  importedCaseIds?: string[]
  failed?: { row: number; message: string }[]
}

const memory = new Map<string, ImportBatch & { rawRows?: Record<string, unknown>[]; isLogbook?: boolean; logbookFormat?: string | null; skippedRows?: number }>()

function appendLog(batch: ImportBatch, action: ImportLogEntry['action'], message: string, meta?: Record<string, unknown>) {
  if (!batch.logs) batch.logs = []
  batch.logs.push({ at: new Date().toISOString(), action, message, meta })
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

function parseCsv(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const text = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const row: Record<string, unknown> = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })
    return row
  })
  return { headers, rows }
}

function parseFile(buffer: ArrayBuffer, fileName: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'csv') return parseCsv(buffer)
  if (['xlsx', 'xls', 'ods'].includes(ext)) {
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    return { headers, rows }
  }
  throw new Error('Format tidak didukung. Gunakan Excel, CSV, atau ODS.')
}

function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    norm: h.toLowerCase().trim().replace(/[_\s]+/g, ' '),
  }))
  for (const field of CASE_FIELDS) {
    const aliases = COLUMN_ALIASES[field.key as CaseFieldKey]
    const match = normalizedHeaders.find(
      (h) => h.norm === field.label.toLowerCase() || aliases.some((a) => h.norm === a || h.norm.includes(a)),
    )
    if (match) mapping[field.key] = match.original
  }
  return mapping
}

function storePayload(batch: ImportBatch, extra: BatchStore): BatchStore {
  return {
    headers: batch.headers,
    mapping: batch.mapping,
    rawRows: extra.rawRows ?? [],
    isLogbook: extra.isLogbook,
    logbookFormat: extra.logbookFormat,
    skippedRows: extra.skippedRows,
    rows: batch.rows,
    logs: batch.logs,
    emptyColumns: batch.emptyColumns,
    invalidColumns: batch.invalidColumns,
    validRows: batch.validRows,
    errorRows: batch.errorRows,
    duplicateRows: batch.duplicateRows,
    warningRows: batch.warningRows,
    importedCaseIds: batch.importedCaseIds,
  }
}

async function persistBatch(env: Env, batch: ImportBatch, extra: BatchStore, userId?: string) {
  const db = dbClient(env)
  const payload = storePayload(batch, extra)
  await db.from('import_batches').upsert({
    id: batch.id,
    file_name: batch.fileName,
    file_type: batch.fileType,
    tahun: batch.tahun,
    total_rows: batch.totalRows,
    success_rows: batch.validRows,
    error_rows: batch.errorRows,
    status: batch.status,
    column_mapping: batch.mapping,
    error_report: payload,
    imported_by: userId ?? null,
    completed_at: batch.completedAt ?? null,
  })
}

async function loadBatch(env: Env, batchId: string) {
  const cached = memory.get(batchId)
  if (cached) return cached

  const db = dbClient(env)
  const { data } = await db.from('import_batches').select('*').eq('id', batchId).maybeSingle()
  if (!data) throw new Error('Batch tidak ditemukan.')

  const report = (data.error_report ?? {}) as BatchStore
  const batch: ImportBatch & { rawRows?: Record<string, unknown>[]; isLogbook?: boolean; logbookFormat?: string | null; skippedRows?: number } = {
    id: data.id,
    fileName: data.file_name,
    fileType: data.file_type,
    tahun: data.tahun,
    headers: report.headers ?? [],
    mapping: (data.column_mapping ?? report.mapping ?? {}) as Record<string, string>,
    rows: report.rows ?? [],
    totalRows: data.total_rows ?? report.rawRows?.length ?? 0,
    validRows: report.validRows ?? data.success_rows ?? 0,
    errorRows: report.errorRows ?? data.error_rows ?? 0,
    duplicateRows: report.duplicateRows ?? 0,
    warningRows: report.warningRows ?? 0,
    emptyColumns: report.emptyColumns ?? [],
    invalidColumns: report.invalidColumns ?? [],
    logs: report.logs ?? [],
    status: data.status as ImportBatch['status'],
    importedCaseIds: report.importedCaseIds ?? [],
    createdAt: data.started_at ?? new Date().toISOString(),
    completedAt: data.completed_at ?? undefined,
    rawRows: report.rawRows ?? [],
    isLogbook: report.isLogbook,
    logbookFormat: report.logbookFormat,
    skippedRows: report.skippedRows,
  }
  memory.set(batchId, batch)
  return batch
}

function isValidDate(value: string) {
  if (!value) return true
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)
}

function fieldInvalid(field: CaseFieldKey, value: string | number | null): string | null {
  if (value === null || value === '') return null
  const str = String(value).trim()
  if (field === 'usia' || field === 'lama_pendampingan') {
    const n = Number(str)
    if (Number.isNaN(n) || n < 0 || n > 150) return 'format angka tidak valid'
  }
  if (field === 'latitude' && (Number(str) < -90 || Number(str) > 90)) return 'latitude tidak valid'
  if (field === 'longitude' && (Number(str) < -180 || Number(str) > 180)) return 'longitude tidak valid'
  if ((field === 'tanggal' || field === 'tanggal_selesai') && !isValidDate(str)) return 'format tanggal tidak valid'
  return null
}

function geocodeIfMissing(
  kecamatan: string | null, kabupaten: string | null, provinsi: string,
  latitude: number | null, longitude: number | null, seed: string,
) {
  if (latitude != null && longitude != null) return { latitude, longitude }
  const resolved = resolveCoords(kecamatan ?? undefined, kabupaten ?? undefined, provinsi, seed)
  return resolved ? { latitude: resolved[0], longitude: resolved[1] } : { latitude, longitude }
}

function sanitizeTanggal(tanggal: string, nomorRegister: string) {
  const year = Number(tanggal.slice(0, 4))
  if (year >= 2010 && year <= 2035) return tanggal
  const fromRegister = nomorRegister.match(/20\d{2}/)?.[0]
  if (fromRegister) return `${fromRegister}${tanggal.slice(4)}`
  if (year >= 2900 && year <= 2999) return tanggal.replace(/^29/, '20')
  return tanggal
}

function sanitizeRecord(data: Record<string, string | number | null>) {
  const coords = geocodeIfMissing(
    data.kecamatan ? String(data.kecamatan) : null,
    data.kabupaten ? String(data.kabupaten) : null,
    String(data.provinsi || 'Jawa Barat'),
    typeof data.latitude === 'number' ? data.latitude : data.latitude ? Number(data.latitude) || null : null,
    typeof data.longitude === 'number' ? data.longitude : data.longitude ? Number(data.longitude) || null : null,
    String(data.nomor_register ?? ''),
  )
  const usia = data.usia
  return {
    nomor_register: String(data.nomor_register ?? ''),
    tanggal: sanitizeTanggal(String(data.tanggal ?? '2021-01-01'), String(data.nomor_register ?? '')),
    nama_korban: String(data.nama_korban ?? ''),
    jenis_kelamin: String(data.jenis_kelamin || 'Perempuan'),
    usia: typeof usia === 'number' ? usia : usia ? Number(usia) || null : null,
    pendidikan: data.pendidikan,
    pekerjaan: data.pekerjaan,
    status: String(data.status || 'Aktif'),
    jenis_kekerasan: String(data.jenis_kekerasan ?? 'Tidak diketahui'),
    kategori: data.kategori,
    pelaku: data.pelaku,
    hubungan_pelaku: data.hubungan_pelaku,
    psikolog_nama: data.psikolog_nama,
    status_pendampingan: String(data.status_pendampingan || 'Berjalan'),
    tanggal_selesai: data.tanggal_selesai,
    lama_pendampingan: data.lama_pendampingan,
    alamat: data.alamat,
    rt: data.rt,
    rw: data.rw,
    kelurahan: data.kelurahan,
    kecamatan: data.kecamatan,
    kabupaten: normalizeKabupaten(data.kabupaten ? String(data.kabupaten) : '') || data.kabupaten,
    provinsi: String(data.provinsi || 'Jawa Barat'),
    latitude: coords.latitude,
    longitude: coords.longitude,
    catatan: data.catatan,
  }
}

export async function createPreview(env: Env, buffer: ArrayBuffer, fileName: string, user?: AuthUser) {
  const isLogbook = /logbook/i.test(fileName)
  let headers: string[]
  let rows: Record<string, unknown>[]
  let detectedTahun: number | null = null
  let logbookFormat: string | null = null
  let skippedRows = 0

  if (isLogbook) {
    const parsed = parseLogbookFile(buffer, fileName)
    headers = parsed.headers
    rows = parsed.rows
    detectedTahun = parsed.tahun
    logbookFormat = parsed.format
    skippedRows = parsed.skippedRows
  } else {
    const parsed = parseFile(buffer, fileName)
    headers = parsed.headers
    rows = parsed.rows
  }

  if (isLogbook && detectedTahun && detectedTahun < MIN_LOGBOOK_YEAR) {
    throw new Error(`Data sebelum ${MIN_LOGBOOK_YEAR} tidak diimport.`)
  }
  if (headers.length === 0) throw new Error('File kosong atau tidak memiliki header.')

  const batchId = crypto.randomUUID()
  const mapping = isLogbook
    ? Object.fromEntries(CASE_FIELDS.map((f) => [f.key, f.key]).filter(([k]) => headers.includes(k)))
    : suggestMapping(headers)
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  const batch: ImportBatch = {
    id: batchId,
    fileName,
    fileType: ext,
    tahun: detectedTahun,
    headers,
    mapping,
    rows: [],
    totalRows: rows.length,
    validRows: 0,
    errorRows: 0,
    duplicateRows: 0,
    warningRows: 0,
    emptyColumns: [],
    invalidColumns: [],
    logs: [],
    status: 'preview',
    importedCaseIds: [],
    createdAt: new Date().toISOString(),
  }
  appendLog(batch, 'preview', `Preview ${rows.length} baris dari ${fileName}`, { skippedRows, logbookFormat })

  const stored = { ...batch, rawRows: rows.slice(0, 10000), isLogbook, logbookFormat, skippedRows }
  memory.set(batchId, stored)
  await persistBatch(env, batch, storePayload(batch, stored), user?.id)

  return {
    batchId,
    fileName,
    fileType: ext,
    headers,
    suggestedMapping: mapping,
    previewRows: rows.slice(0, 10),
    totalRows: rows.length,
    isLogbook,
    logbookFormat,
    detectedTahun,
    skippedRows,
  }
}

export async function validateBatch(env: Env, batchId: string, mapping: Record<string, string>, tahun?: number) {
  const stored = await loadBatch(env, batchId)
  const rawRows = stored.rawRows ?? []
  stored.mapping = mapping
  stored.tahun = tahun ?? stored.tahun ?? null

  const seenRegisters = new Set<string>()
  const validatedRows: ImportRow[] = []
  const errors: { row: number; field: string; message: string }[] = []
  const warnings: { row: number; field?: string; message: string }[] = []
  const duplicates: { row: number; nomorRegister: string }[] = []
  const emptyColumnMap = new Map<string, { label: string; rows: number[] }>()
  const invalidColumnMap = new Map<string, { label: string; rows: number[] }>()

  for (const field of CASE_FIELDS) {
    if (field.required && !mapping[field.key]) {
      emptyColumnMap.set(field.key, { label: field.label, rows: [] })
    }
  }

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2
    const data: Record<string, string | number | null> = {}
    const rowErrors: string[] = []
    const rowWarnings: string[] = []

    for (const field of CASE_FIELDS) {
      const sourceCol = mapping[field.key]
      if (!sourceCol) {
        if (field.required) {
          rowErrors.push(`${field.label} wajib diisi`)
          errors.push({ row: rowNumber, field: field.key, message: `${field.label} tidak termapping` })
          const entry = emptyColumnMap.get(field.key) ?? { label: field.label, rows: [] }
          entry.rows.push(rowNumber)
          emptyColumnMap.set(field.key, entry)
        }
        data[field.key] = null
        continue
      }
      const val = stored.isLogbook ? raw[field.key] : raw[sourceCol]
      const strVal = val !== null && val !== undefined ? String(val).trim() : ''

      if (field.required && !strVal) {
        rowErrors.push(`${field.label} kosong`)
        errors.push({ row: rowNumber, field: field.key, message: `${field.label} kosong` })
        const entry = emptyColumnMap.get(field.key) ?? { label: field.label, rows: [] }
        entry.rows.push(rowNumber)
        emptyColumnMap.set(field.key, entry)
      }

      if (field.key === 'usia' || field.key === 'lama_pendampingan') {
        data[field.key] = strVal ? Number(strVal) : null
      } else if (field.key === 'latitude' || field.key === 'longitude') {
        data[field.key] = strVal ? parseFloat(strVal) : null
      } else {
        data[field.key] = strVal || null
      }

      const invalidMsg = fieldInvalid(field.key as CaseFieldKey, data[field.key])
      if (strVal && invalidMsg) {
        rowErrors.push(`${field.label}: ${invalidMsg}`)
        errors.push({ row: rowNumber, field: field.key, message: invalidMsg })
        const entry = invalidColumnMap.get(field.key) ?? { label: field.label, rows: [] }
        entry.rows.push(rowNumber)
        invalidColumnMap.set(field.key, entry)
      }
    }

    const register = String(data.nomor_register ?? '')
    let isDuplicate = false
    if (register) {
      const key = `${register}_${data.tanggal ?? ''}`
      if (seenRegisters.has(key)) {
        isDuplicate = true
        rowWarnings.push('Duplikat dalam file')
        duplicates.push({ row: rowNumber, nomorRegister: register })
      }
      seenRegisters.add(key)
    }

    if (!data.kecamatan && !data.kabupaten) {
      rowWarnings.push('Data wilayah tidak lengkap — geocoding diperlukan')
    }
    for (const w of rowWarnings) warnings.push({ row: rowNumber, message: w })

    validatedRows.push({ rowNumber, data, errors: rowErrors, warnings: rowWarnings, isDuplicate })
  })

  const emptyColumns: ColumnIssue[] = [...emptyColumnMap.entries()].map(([field, v]) => ({
    field, label: v.label, count: v.rows.length || rawRows.length, rows: v.rows.slice(0, 20),
  }))
  const invalidColumns: ColumnIssue[] = [...invalidColumnMap.entries()].map(([field, v]) => ({
    field, label: v.label, count: v.rows.length, rows: v.rows.slice(0, 20),
  }))

  stored.rows = validatedRows
  stored.validRows = validatedRows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length
  stored.errorRows = validatedRows.filter((r) => r.errors.length > 0).length
  stored.duplicateRows = validatedRows.filter((r) => r.isDuplicate).length
  stored.warningRows = validatedRows.filter((r) => r.warnings.length > 0).length
  stored.emptyColumns = emptyColumns
  stored.invalidColumns = invalidColumns
  stored.status = 'validated'
  appendLog(stored, 'validate', `Validasi selesai: ${stored.validRows} valid, ${stored.errorRows} error`, {
    duplicateRows: stored.duplicateRows,
  })

  memory.set(batchId, stored)
  await persistBatch(env, stored, storePayload(stored, stored))

  const previewSource = rawRows.slice(0, 10).map((raw) => {
    if (stored.isLogbook) return raw
    const row: Record<string, unknown> = {}
    for (const field of CASE_FIELDS) {
      const col = mapping[field.key]
      if (col) row[field.key] = raw[col]
    }
    return row
  })

  return {
    batchId,
    totalRows: stored.totalRows,
    validRows: stored.validRows,
    errorRows: stored.errorRows,
    warningRows: stored.warningRows,
    duplicateRows: stored.duplicateRows,
    emptyColumns,
    invalidColumns,
    errors: errors.slice(0, 100),
    warnings: warnings.slice(0, 100),
    duplicates: duplicates.slice(0, 50),
    previewRows: previewSource,
  }
}

export async function executeImport(env: Env, batchId: string, skipDuplicates = true, user?: AuthUser) {
  const stored = await loadBatch(env, batchId)
  if (stored.status !== 'validated') throw new Error('Batch belum divalidasi.')

  stored.status = 'importing'
  const toImport = stored.rows.filter((r) => r.errors.length === 0 && (!skipDuplicates || !r.isDuplicate))
  const db = dbClient(env)
  const importedIds: string[] = []
  const failed: { row: number; message: string }[] = []
  const records = toImport.map((row) => ({ id: crypto.randomUUID(), ...sanitizeRecord(row.data) }))

  const chunkSize = 50
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    const { data, error } = await db.from('cases').insert(chunk).select('id')
    if (error) {
      for (const row of chunk) {
        const { error: singleError } = await db.from('cases').insert(row).select('id')
        if (singleError) failed.push({ row: i + 1, message: singleError.message })
        else importedIds.push(row.id!)
      }
    } else if (data) {
      importedIds.push(...data.map((d) => d.id))
    }
  }

  stored.importedCaseIds = importedIds
  stored.status = failed.length === toImport.length ? 'failed' : 'completed'
  stored.completedAt = new Date().toISOString()
  appendLog(stored, 'import', `Import ${importedIds.length} baris, gagal ${failed.length}`, { imported: importedIds.length, failed: failed.length })

  if (importedIds.length > 0) {
    const links = importedIds.map((caseId) => ({ batch_id: batchId, case_id: caseId }))
    for (let i = 0; i < links.length; i += 100) {
      await db.from('import_batch_cases').insert(links.slice(i, i + 100))
    }
  }

  const extra = { ...storePayload(stored, stored), failed, importedCaseIds: importedIds }
  memory.set(batchId, stored)
  await persistBatch(env, stored, extra, user?.id)

  return { batchId, status: stored.status, imported: importedIds.length, failed: failed.length, errors: failed.slice(0, 20) }
}

export async function rollback(env: Env, batchId: string) {
  const batch = await loadBatch(env, batchId)
  if (batch.status !== 'completed') throw new Error('Hanya batch selesai yang bisa di-rollback.')

  const db = dbClient(env)
  const { data: links } = await db.from('import_batch_cases').select('case_id').eq('batch_id', batchId)
  const caseIds = links?.map((l) => l.case_id) ?? batch.importedCaseIds
  let removed = 0
  if (caseIds.length > 0) {
    await db.from('cases').delete().in('id', caseIds)
    removed = caseIds.length
  }
  await db.from('import_batches').update({ status: 'rolled_back', rolled_back_at: new Date().toISOString() }).eq('id', batchId)

  batch.status = 'rolled_back'
  appendLog(batch, 'rollback', `Rollback ${removed} kasus dihapus`)
  memory.set(batchId, batch)
  return { batchId, status: 'rolled_back', removed }
}

export async function getHistory(env: Env) {
  const db = dbClient(env)
  const { data } = await db.from('import_batches').select('*').order('started_at', { ascending: false }).limit(50)
  const dbBatches = (data ?? []).map((row) => {
    const report = (row.error_report ?? {}) as BatchStore
    return {
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      tahun: row.tahun,
      totalRows: row.total_rows ?? 0,
      validRows: report.validRows ?? row.success_rows ?? 0,
      errorRows: report.errorRows ?? row.error_rows ?? 0,
      warningRows: report.warningRows ?? 0,
      duplicateRows: report.duplicateRows ?? 0,
      status: row.status,
      createdAt: row.started_at,
      completedAt: row.completed_at,
      logCount: report.logs?.length ?? 0,
    }
  })
  return { batches: dbBatches }
}

export async function getBatchLog(env: Env, batchId: string) {
  const batch = await loadBatch(env, batchId)
  return { batchId, fileName: batch.fileName, logs: batch.logs ?? [] }
}

export function listDocFiles() {
  return { files: [], path: 'cloud', minYear: MIN_LOGBOOK_YEAR, note: 'Upload file via preview di lingkungan cloud' }
}

export function importDocFolder() {
  throw new Error('Import folder doc hanya tersedia di backend lokal.')
}

export async function handleImport(
  path: string,
  method: string,
  env: Env,
  user: AuthUser,
  request: Request,
  body?: Record<string, unknown>,
): Promise<unknown | null> {
  if (path === '/api/import/preview' && method === 'POST') {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) throw new Error('File wajib diupload.')
    const buffer = await file.arrayBuffer()
    return createPreview(env, buffer, file.name, user)
  }

  if (path === '/api/import/validate' && method === 'POST') {
    return validateBatch(env, String(body?.batchId ?? ''), (body?.mapping as Record<string, string>) ?? {}, body?.tahun ? Number(body.tahun) : undefined)
  }

  if (path === '/api/import/execute' && method === 'POST') {
    return executeImport(env, String(body?.batchId ?? ''), body?.skipDuplicates !== false, user)
  }

  const rollbackMatch = path.match(/^\/api\/import\/rollback\/([^/]+)$/)
  if (rollbackMatch && method === 'POST') return rollback(env, rollbackMatch[1])

  if (path === '/api/import/history' && method === 'GET') return getHistory(env)

  const logMatch = path.match(/^\/api\/import\/log\/([^/]+)$/)
  if (logMatch && method === 'GET') return getBatchLog(env, logMatch[1])

  if (path === '/api/import/doc-files' && method === 'GET') return listDocFiles()

  if (path === '/api/import/doc-folder' && method === 'POST') return importDocFolder()

  const batchMatch = path.match(/^\/api\/import\/batch\/([^/]+)$/)
  if (batchMatch && method === 'GET') {
    const batch = await loadBatch(env, batchMatch[1])
    return batch
  }

  return null
}

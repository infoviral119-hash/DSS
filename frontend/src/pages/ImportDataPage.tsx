import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Loader2,
  History,
  FolderOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  previewImport,
  validateImport,
  executeImport,
  rollbackImport,
  getImportHistory,
  getImportLog,
  getDocFiles,
  importDocFolder,
} from '@/lib/import-api'
import { api } from '@/lib/api'
import { CASE_FIELDS, type ImportStep, type PreviewResponse, type ValidationResponse, type ImportLogEntry } from '@/types/import'

const TAHUN_LIST = [2021, 2022, 2023, 2024, 2025]
const ACCEPT = '.xlsx,.xls,.csv,.ods'
const STEPS: ImportStep[] = ['upload', 'mapping', 'validate', 'import', 'done']

export function ImportDataPage() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<ImportStep>('upload')
  const [tahun, setTahun] = useState(2024)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [validation, setValidation] = useState<ValidationResponse | null>(null)
  const [progress, setProgress] = useState(0)
  const [logBatchId, setLogBatchId] = useState<string | null>(null)
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([])

  const { data: history } = useQuery({
    queryKey: ['import-history'],
    queryFn: getImportHistory,
  })

  const { data: docFiles } = useQuery({
    queryKey: ['doc-files'],
    queryFn: getDocFiles,
  })

  const { data: setup } = useQuery({
    queryKey: ['supabase-setup'],
    queryFn: async () => (await api.get('/api/setup/supabase')).data,
  })

  const bulkImportMutation = useMutation({
    mutationFn: importDocFolder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['import-history'] }),
  })

  const previewMutation = useMutation({
    mutationFn: previewImport,
    onSuccess: async (data) => {
      setPreview(data)
      setMapping(data.suggestedMapping)
      if (data.detectedTahun) setTahun(data.detectedTahun)
      if (data.isLogbook) {
        const result = await validateImport(data.batchId, data.suggestedMapping, data.detectedTahun)
        setValidation(result)
        setStep('validate')
      } else {
        setStep('mapping')
      }
    },
  })

  const validateMutation = useMutation({
    mutationFn: () => validateImport(preview!.batchId, mapping, tahun),
    onSuccess: (data) => {
      setValidation(data)
      setStep('validate')
    },
  })

  const executeMutation = useMutation({
    mutationFn: () => executeImport(preview!.batchId),
    onMutate: () => {
      setStep('import')
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 12, 90))
      }, 200)
      return () => clearInterval(interval)
    },
    onSuccess: () => {
      setProgress(100)
      setStep('done')
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: rollbackImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['import-history'] }),
  })

  const openLog = async (batchId: string) => {
    setLogBatchId(batchId)
    const data = await getImportLog(batchId)
    setImportLogs(data.logs)
  }

  const previewFields = validation?.previewRows?.length
    ? Object.keys(validation.previewRows[0])
    : preview?.headers ?? []

  const handleFile = useCallback(
    (file: File) => previewMutation.mutate(file),
    [previewMutation]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setStep('upload')
    setPreview(null)
    setMapping({})
    setValidation(null)
    setProgress(0)
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                step === s
                  ? 'bg-primary text-white'
                  : i < stepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
            <span className="hidden text-xs capitalize sm:inline">{s}</span>
            {i < 4 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Tahun Data:</span>
        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs dark:bg-black/20"
        >
          {TAHUN_LIST.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {setup?.needsRlsSetup && (
        <Card className="border-orange-400">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-orange-600">Setup Supabase diperlukan</p>
            <p className="text-xs text-muted-foreground">
              Jalankan SQL di{' '}
              <a href={setup.sqlEditorUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                Supabase SQL Editor
              </a>
              {' '}atau tambahkan SUPABASE_SERVICE_ROLE_KEY di .env
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderOpen className="h-4 w-4" />
            Data Logbook JaRI 2021+ ({docFiles?.files.length ?? 0} file)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Import otomatis: LOGBOOK 2021–2025. File 2018–2020 diabaikan.
          </p>
          {!docFiles?.files?.length && (
            <p className="rounded-md border border-dashed border-amber-300 bg-amber-50/50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              Production: upload file manual di bawah, atau dari PC jalankan{' '}
              <code className="rounded bg-black/5 px-1">npm run import:logbook</code>{' '}
              (butuh <code className="rounded bg-black/5 px-1">import.auth.env</code> + folder <code className="rounded bg-black/5 px-1">doc/</code>).
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {docFiles?.files.map((f) => (
              <span key={f.fileName} className="rounded-md bg-secondary px-2 py-1 text-xs">
                {f.fileName} ({Math.round(f.size / 1024)} KB)
              </span>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => bulkImportMutation.mutate()}
            disabled={bulkImportMutation.isPending || !docFiles?.files.length}
          >
            {bulkImportMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Import Semua dari folder doc
          </Button>
          {bulkImportMutation.isSuccess && (
            <p className="text-xs text-green-600">
              {bulkImportMutation.data.totalImported} baris dari {bulkImportMutation.data.totalFiles} file berhasil diimport
            </p>
          )}
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              className={cn(
                'cursor-pointer border-2 border-dashed transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-border'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <CardContent className="flex flex-col items-center gap-3 p-10">
                <Upload className="h-10 w-10 text-primary" />
                <p className="text-sm font-medium">Drag & drop file logbook di sini</p>
                <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls), CSV, ODS</p>
                <input
                  id="file-input"
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {previewMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses file...
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(step === 'mapping' || step === 'validate') && preview && (
          <motion.div key="mapping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  {preview.fileName} — {preview.totalRows} baris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">Mapping Kolom Otomatis</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CASE_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="w-32 truncate text-xs">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </span>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="h-7 flex-1 rounded border border-border bg-white/50 px-1 text-xs dark:bg-black/20"
                      >
                        <option value="">— skip —</option>
                        {preview.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview Data (10 baris pertama)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {preview.headers.map((h) => (
                        <th key={h} className="px-2 py-1.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {preview.headers.map((h) => (
                          <td key={h} className="px-2 py-1.5">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {step === 'mapping' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>Batal</Button>
                <Button size="sm" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>
                  {validateMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Validasi Data
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'validate' && validation && (
          <motion.div key="validate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { label: 'Preview', value: validation.totalRows, color: 'text-primary' },
                { label: 'Valid', value: validation.validRows, color: 'text-green-600' },
                { label: 'Error', value: validation.errorRows, color: 'text-red-500' },
                { label: 'Warning', value: validation.warningRows, color: 'text-amber-500' },
                { label: 'Duplikat', value: validation.duplicateRows, color: 'text-orange-500' },
                { label: 'Kolom Kosong', value: validation.emptyColumns.length, color: 'text-rose-500' },
                { label: 'Kolom Invalid', value: validation.invalidColumns.length, color: 'text-purple-600' },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview Data ({Math.min(10, validation.previewRows.length)} baris)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {previewFields.map((h) => (
                        <th key={h} className="px-2 py-1.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validation.previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {previewFields.map((h) => (
                          <td key={h} className="px-2 py-1.5">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {validation.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-red-500">
                    <XCircle className="h-4 w-4" />
                    Error Report ({validation.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-1">Baris</th>
                        <th className="px-2 py-1">Field</th>
                        <th className="px-2 py-1">Pesan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.errors.map((e, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-2 py-1">{e.row}</td>
                          <td className="px-2 py-1">{e.field}</td>
                          <td className="px-2 py-1">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {validation.emptyColumns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-rose-600">Kolom Kosong ({validation.emptyColumns.length})</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-1">Kolom</th>
                        <th className="px-2 py-1">Jumlah</th>
                        <th className="px-2 py-1">Contoh Baris</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.emptyColumns.map((c) => (
                        <tr key={c.field} className="border-b border-border/50">
                          <td className="px-2 py-1">{c.label}</td>
                          <td className="px-2 py-1">{c.count}</td>
                          <td className="px-2 py-1">{c.rows?.join(', ') ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {validation.invalidColumns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-purple-600">Kolom Invalid ({validation.invalidColumns.length})</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-1">Kolom</th>
                        <th className="px-2 py-1">Jumlah</th>
                        <th className="px-2 py-1">Contoh Baris</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.invalidColumns.map((c) => (
                        <tr key={c.field} className="border-b border-border/50">
                          <td className="px-2 py-1">{c.label}</td>
                          <td className="px-2 py-1">{c.count}</td>
                          <td className="px-2 py-1">{c.rows?.join(', ') ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {validation.warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Warning ({validation.warningRows})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-1">Baris</th>
                        <th className="px-2 py-1">Pesan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.warnings.map((w, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-2 py-1">{w.row}</td>
                          <td className="px-2 py-1">{w.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {validation.duplicates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                    Duplikat ({validation.duplicates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-2 py-1">Baris</th>
                        <th className="px-2 py-1">Nomor Register</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.duplicates.map((d, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-2 py-1">{d.row}</td>
                          <td className="px-2 py-1">{d.nomorRegister}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>Kembali</Button>
              <Button
                size="sm"
                onClick={() => executeMutation.mutate()}
                disabled={validation.validRows === 0 || executeMutation.isPending}
              >
                Import {validation.validRows} Baris
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'import' && (
          <motion.div key="import" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Mengimport data...</p>
                <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold">Import Selesai</p>
                <p className="text-sm text-muted-foreground">
                  {validation?.validRows} baris berhasil diimport untuk tahun {tahun}
                </p>
                <Button size="sm" onClick={reset}>Import File Baru</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Import Log & Histori
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!history?.batches.length ? (
            <p className="text-xs text-muted-foreground">Belum ada histori import.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-2 py-1.5">File</th>
                    <th className="px-2 py-1.5">Tahun</th>
                    <th className="px-2 py-1.5">Total</th>
                    <th className="px-2 py-1.5">Valid</th>
                    <th className="px-2 py-1.5">Error</th>
                    <th className="px-2 py-1.5">Warning</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.batches.map((b) => (
                    <tr key={b.id} className="border-b border-border/50">
                      <td className="px-2 py-1.5">{b.fileName}</td>
                      <td className="px-2 py-1.5">{b.tahun ?? '—'}</td>
                      <td className="px-2 py-1.5">{b.totalRows}</td>
                      <td className="px-2 py-1.5">{b.validRows}</td>
                      <td className="px-2 py-1.5">{b.errorRows}</td>
                      <td className="px-2 py-1.5">{b.warningRows ?? 0}</td>
                      <td className="px-2 py-1.5">
                        <span className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-medium',
                          b.status === 'completed' && 'bg-green-100 text-green-700',
                          b.status === 'rolled_back' && 'bg-orange-100 text-orange-700',
                          b.status === 'failed' && 'bg-red-100 text-red-700',
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openLog(b.id)}>
                            Log
                          </Button>
                          {b.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-orange-600"
                              onClick={() => rollbackMutation.mutate(b.id)}
                              disabled={rollbackMutation.isPending}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {logBatchId && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium">Import Log — {logBatchId.slice(0, 8)}</p>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setLogBatchId(null)}>Tutup</Button>
              </div>
              {importLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Log kosong.</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
                  {importLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 border-b border-border/40 py-1">
                      <span className="shrink-0 text-muted-foreground">{new Date(log.at).toLocaleString('id-ID')}</span>
                      <span className="shrink-0 rounded bg-secondary px-1 font-medium uppercase">{log.action}</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

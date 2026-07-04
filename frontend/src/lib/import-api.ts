import { api } from './api'
import type {
  PreviewResponse,
  ValidationResponse,
  ExecuteResponse,
  ImportHistoryItem,
} from '@/types/import'

export async function previewImport(file: File): Promise<PreviewResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<PreviewResponse>('/api/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function validateImport(
  batchId: string,
  mapping: Record<string, string>,
  tahun?: number
): Promise<ValidationResponse> {
  const { data } = await api.post<ValidationResponse>('/api/import/validate', {
    batchId,
    mapping,
    tahun,
  })
  return data
}

export async function executeImport(
  batchId: string,
  skipDuplicates = true
): Promise<ExecuteResponse> {
  const { data } = await api.post<ExecuteResponse>('/api/import/execute', {
    batchId,
    skipDuplicates,
  })
  return data
}

export async function rollbackImport(batchId: string) {
  const { data } = await api.post(`/api/import/rollback/${batchId}`)
  return data
}

export async function getImportLog(batchId: string): Promise<{ batchId: string; fileName: string; logs: import('@/types/import').ImportLogEntry[] }> {
  const { data } = await api.get(`/api/import/log/${batchId}`)
  return data
}

export async function getImportHistory(): Promise<{ batches: ImportHistoryItem[] }> {
  const { data } = await api.get('/api/import/history')
  return data
}

export async function getDocFiles(): Promise<{ files: { fileName: string; size: number; tahun: number }[] }> {
  const { data } = await api.get('/api/import/doc-files')
  return data
}

export async function importDocFolder(): Promise<{
  totalFiles: number
  totalImported: number
  results: { fileName: string; totalRows: number; validRows: number; imported: number }[]
}> {
  const { data } = await api.post('/api/import/doc-folder')
  return data
}

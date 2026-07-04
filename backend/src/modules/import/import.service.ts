import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import {
  CASE_FIELDS,
  COLUMN_ALIASES,
  MIN_LOGBOOK_YEAR,
  type ImportBatch,
  type ImportRow,
  type CaseFieldKey,
  type ColumnIssue,
  type ImportLogEntry,
} from './import.constants';
import { parseLogbookFile } from './logbook-parser';
import { SupabaseService } from '../supabase/supabase.service';
import { geocodeIfMissing } from '../../common/id-coords';
import { normalizeKabupaten } from '../../common/wilayah-labels';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportService {
  private batches = new Map<string, ImportBatch>();

  constructor(private supabaseService: SupabaseService) {}

  private appendLog(batch: ImportBatch, action: ImportLogEntry['action'], message: string, meta?: Record<string, unknown>) {
    if (!batch.logs) batch.logs = [];
    batch.logs.push({ at: new Date().toISOString(), action, message, meta });
  }

  private isValidDate(value: string) {
    if (!value) return true;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value);
  }

  private fieldInvalid(field: CaseFieldKey, value: string | number | null): string | null {
    if (value === null || value === '') return null;
    const str = String(value).trim();
    if (field === 'usia' || field === 'lama_pendampingan') {
      const n = Number(str);
      if (Number.isNaN(n) || n < 0 || n > 150) return 'format angka tidak valid';
    }
    if (field === 'latitude' && (Number(str) < -90 || Number(str) > 90)) return 'latitude tidak valid';
    if (field === 'longitude' && (Number(str) < -180 || Number(str) > 180)) return 'longitude tidak valid';
    if (field === 'tanggal' || field === 'tanggal_selesai') {
      if (!this.isValidDate(str)) return 'format tanggal tidak valid';
    }
    return null;
  }

  private sanitizeTanggal(tanggal: string, nomorRegister: string) {
    const year = Number(tanggal.slice(0, 4));
    if (year >= 2010 && year <= 2035) return tanggal;
    const fromRegister = nomorRegister.match(/20\d{2}/)?.[0];
    if (fromRegister) return `${fromRegister}${tanggal.slice(4)}`;
    if (year >= 2900 && year <= 2999) return tanggal.replace(/^29/, '20');
    return tanggal;
  }

  private sanitizeRecord(data: Record<string, string | number | null>) {
    const usia = data.usia;
    const coords = geocodeIfMissing(
      data.kecamatan ? String(data.kecamatan) : null,
      data.kabupaten ? String(data.kabupaten) : null,
      data.provinsi ? String(data.provinsi) : 'Jawa Barat',
      typeof data.latitude === 'number' ? data.latitude : data.latitude ? Number(data.latitude) || null : null,
      typeof data.longitude === 'number' ? data.longitude : data.longitude ? Number(data.longitude) || null : null,
      String(data.nomor_register ?? ''),
    );
    return {
      nomor_register: String(data.nomor_register ?? ''),
      tanggal: this.sanitizeTanggal(String(data.tanggal ?? '2021-01-01'), String(data.nomor_register ?? '')),
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
      outcome: data.outcome,
    };
  }

  parseFile(buffer: Buffer, fileName: string): { headers: string[]; rows: Record<string, unknown>[] } {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'csv') {
      const content = buffer.toString('utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as Record<string, unknown>[];
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      return { headers, rows: records };
    }

    if (['xlsx', 'xls', 'ods'].includes(ext)) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers, rows };
    }

    throw new BadRequestException('Format tidak didukung. Gunakan Excel, CSV, atau ODS.');
  }

  suggestMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = headers.map((h) => ({
      original: h,
      norm: h.toLowerCase().trim().replace(/[_\s]+/g, ' '),
    }));

    for (const field of CASE_FIELDS) {
      const aliases = COLUMN_ALIASES[field.key as CaseFieldKey];
      const match = normalizedHeaders.find(
        (h) =>
          h.norm === field.label.toLowerCase() ||
          aliases.some((a) => h.norm === a || h.norm.includes(a)),
      );
      if (match) mapping[field.key] = match.original;
    }
    return mapping;
  }

  createPreview(buffer: Buffer, fileName: string) {
    const isLogbook = /logbook/i.test(fileName);
    let headers: string[];
    let rows: Record<string, unknown>[];
    let detectedTahun: number | null = null;
    let logbookFormat: string | null = null;
    let skippedRows = 0;

    if (isLogbook) {
      const parsed = parseLogbookFile(buffer, fileName);
      headers = parsed.headers;
      rows = parsed.rows;
      detectedTahun = parsed.tahun;
      logbookFormat = parsed.format;
      skippedRows = parsed.skippedRows;
    } else {
      const parsed = this.parseFile(buffer, fileName);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (isLogbook && detectedTahun && detectedTahun < MIN_LOGBOOK_YEAR) {
      throw new BadRequestException(`Data sebelum ${MIN_LOGBOOK_YEAR} tidak diimport. Gunakan file ${MIN_LOGBOOK_YEAR} ke atas.`);
    }

    if (headers.length === 0) throw new BadRequestException('File kosong atau tidak memiliki header.');

    const batchId = uuidv4();
    const mapping = isLogbook
      ? Object.fromEntries(CASE_FIELDS.map((f) => [f.key, f.key]).filter(([k]) => headers.includes(k)))
      : this.suggestMapping(headers);
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

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
    };
    this.appendLog(batch, 'preview', `Preview ${rows.length} baris dari ${fileName}`, {
      skippedRows,
      logbookFormat,
    });
    this.batches.set(batchId, { ...batch, rawRows: rows, isLogbook, logbookFormat, skippedRows } as ImportBatch & {
      rawRows: Record<string, unknown>[];
      isLogbook?: boolean;
      logbookFormat?: string;
      skippedRows?: number;
    });

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
    };
  }

  validateBatch(batchId: string, mapping: Record<string, string>, tahun?: number) {
    const batch = this.batches.get(batchId);
    if (!batch) throw new NotFoundException('Batch tidak ditemukan.');

    const stored = batch as ImportBatch & { rawRows?: Record<string, unknown>[] };
    const rawRows = stored.rawRows ?? [];
    batch.mapping = mapping;
    batch.tahun = tahun ?? null;

    const seenRegisters = new Set<string>();
    const validatedRows: ImportRow[] = [];
    const errors: { row: number; field: string; message: string }[] = [];
    const warnings: { row: number; field?: string; message: string }[] = [];
    const duplicates: { row: number; nomorRegister: string }[] = [];
    const emptyColumnMap = new Map<string, { label: string; rows: number[] }>();
    const invalidColumnMap = new Map<string, { label: string; rows: number[] }>();

    for (const field of CASE_FIELDS) {
      if (field.required && !mapping[field.key]) {
        emptyColumnMap.set(field.key, { label: field.label, rows: [] });
      }
    }

    rawRows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const data: Record<string, string | number | null> = {};
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];

      for (const field of CASE_FIELDS) {
        const sourceCol = mapping[field.key];
        if (!sourceCol) {
          if (field.required) {
            rowErrors.push(`${field.label} wajib diisi`);
            errors.push({ row: rowNumber, field: field.key, message: `${field.label} tidak termapping` });
            const entry = emptyColumnMap.get(field.key) ?? { label: field.label, rows: [] };
            entry.rows.push(rowNumber);
            emptyColumnMap.set(field.key, entry);
          }
          data[field.key] = null;
          continue;
        }
        const val = (stored as { isLogbook?: boolean }).isLogbook
          ? raw[field.key]
          : raw[sourceCol];
        const strVal = val !== null && val !== undefined ? String(val).trim() : '';

        if (field.required && !strVal) {
          rowErrors.push(`${field.label} kosong`);
          errors.push({ row: rowNumber, field: field.key, message: `${field.label} kosong` });
          const entry = emptyColumnMap.get(field.key) ?? { label: field.label, rows: [] };
          entry.rows.push(rowNumber);
          emptyColumnMap.set(field.key, entry);
        }

        if (field.key === 'usia' || field.key === 'lama_pendampingan') {
          data[field.key] = strVal ? Number(strVal) : null;
        } else if (field.key === 'latitude' || field.key === 'longitude') {
          data[field.key] = strVal ? parseFloat(strVal) : null;
        } else {
          data[field.key] = strVal || null;
        }

        const invalidMsg = this.fieldInvalid(field.key as CaseFieldKey, data[field.key]);
        if (strVal && invalidMsg) {
          rowErrors.push(`${field.label}: ${invalidMsg}`);
          errors.push({ row: rowNumber, field: field.key, message: invalidMsg });
          const entry = invalidColumnMap.get(field.key) ?? { label: field.label, rows: [] };
          entry.rows.push(rowNumber);
          invalidColumnMap.set(field.key, entry);
        }
      }

      const register = String(data.nomor_register ?? '');
      let isDuplicate = false;
      if (register) {
        const key = `${register}_${data.tanggal ?? ''}`;
        if (seenRegisters.has(key)) {
          isDuplicate = true;
          rowWarnings.push('Duplikat dalam file');
          duplicates.push({ row: rowNumber, nomorRegister: register });
        }
        seenRegisters.add(key);
      }

      if (!data.kecamatan && !data.kabupaten) {
        rowWarnings.push('Data wilayah tidak lengkap — geocoding diperlukan');
      }

      for (const w of rowWarnings) {
        warnings.push({ row: rowNumber, message: w });
      }

      validatedRows.push({ rowNumber, data, errors: rowErrors, warnings: rowWarnings, isDuplicate });
    });

    const emptyColumns: ColumnIssue[] = [...emptyColumnMap.entries()].map(([field, v]) => ({
      field,
      label: v.label,
      count: v.rows.length || rawRows.length,
      rows: v.rows.slice(0, 20),
    }));

    const invalidColumns: ColumnIssue[] = [...invalidColumnMap.entries()].map(([field, v]) => ({
      field,
      label: v.label,
      count: v.rows.length,
      rows: v.rows.slice(0, 20),
    }));

    batch.rows = validatedRows;
    batch.validRows = validatedRows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length;
    batch.errorRows = validatedRows.filter((r) => r.errors.length > 0).length;
    batch.duplicateRows = validatedRows.filter((r) => r.isDuplicate).length;
    batch.warningRows = validatedRows.filter((r) => r.warnings.length > 0).length;
    batch.emptyColumns = emptyColumns;
    batch.invalidColumns = invalidColumns;
    batch.status = 'validated';

    this.appendLog(batch, 'validate', `Validasi selesai: ${batch.validRows} valid, ${batch.errorRows} error, ${batch.warningRows} warning`, {
      duplicateRows: batch.duplicateRows,
      emptyColumns: emptyColumns.length,
      invalidColumns: invalidColumns.length,
    });

    const previewSource = rawRows.slice(0, 10).map((raw) => {
      if ((stored as { isLogbook?: boolean }).isLogbook) return raw;
      const row: Record<string, unknown> = {};
      for (const field of CASE_FIELDS) {
        const col = mapping[field.key];
        if (col) row[field.key] = raw[col];
      }
      return row;
    });

    return {
      batchId,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      errorRows: batch.errorRows,
      warningRows: batch.warningRows,
      duplicateRows: batch.duplicateRows,
      emptyColumns,
      invalidColumns,
      errors: errors.slice(0, 100),
      warnings: warnings.slice(0, 100),
      duplicates: duplicates.slice(0, 50),
      previewRows: previewSource,
    };
  }

  async executeImport(batchId: string, skipDuplicates = true) {
    const batch = this.batches.get(batchId);
    if (!batch || batch.status !== 'validated') {
      throw new BadRequestException('Batch belum divalidasi.');
    }

    batch.status = 'importing';
    const toImport = batch.rows.filter(
      (r) => r.errors.length === 0 && (!skipDuplicates || !r.isDuplicate),
    );

    const db = this.supabaseService.db;
    const importedIds: string[] = [];
    const failed: { row: number; message: string }[] = [];

    const records = toImport.map((row) => ({
      id: uuidv4(),
      ...this.sanitizeRecord(row.data),
    }));

    if (db) {
      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { data, error } = await db.from('cases').insert(chunk).select('id');
        if (error) {
          for (const row of chunk) {
            const { error: singleError } = await db.from('cases').insert(row).select('id');
            if (singleError) {
              failed.push({ row: i + 1, message: singleError.message });
            } else {
              importedIds.push(row.id!);
            }
          }
        } else if (data) {
          importedIds.push(...data.map((d) => d.id));
        }
      }
    } else {
      importedIds.push(...records.map((r) => r.id!));
    }

    batch.importedCaseIds = importedIds;
    batch.status = failed.length === toImport.length ? 'failed' : 'completed';
    batch.completedAt = new Date().toISOString();

    this.appendLog(batch, 'import', `Import ${importedIds.length} baris, gagal ${failed.length}`, {
      imported: importedIds.length,
      failed: failed.length,
    });

    if (this.supabaseService.db) {
      const report = {
        warningRows: batch.warningRows,
        duplicateRows: batch.duplicateRows,
        emptyColumns: batch.emptyColumns,
        invalidColumns: batch.invalidColumns,
        logs: batch.logs,
        importedCaseIds: importedIds,
        failed,
      };

      await this.supabaseService.db.from('import_batches').insert({
        id: batchId,
        file_name: batch.fileName,
        file_type: batch.fileType,
        tahun: batch.tahun,
        total_rows: batch.totalRows,
        success_rows: importedIds.length,
        error_rows: failed.length,
        status: batch.status,
        column_mapping: batch.mapping,
        error_report: report,
        completed_at: batch.completedAt,
      });

      if (importedIds.length > 0) {
        const links = importedIds.map((caseId) => ({ batch_id: batchId, case_id: caseId }));
        const chunkSize = 100;
        for (let i = 0; i < links.length; i += chunkSize) {
          await this.supabaseService.db.from('import_batch_cases').insert(links.slice(i, i + chunkSize));
        }
      }
    }

    return {
      batchId,
      status: batch.status,
      imported: importedIds.length,
      failed: failed.length,
      errors: failed.slice(0, 20),
    };
  }

  async rollback(batchId: string) {
    let batch = this.batches.get(batchId);
    const db = this.supabaseService.db;

    if (!batch && db) {
      const { data } = await db.from('import_batches').select('*').eq('id', batchId).maybeSingle();
      if (data) {
        const report = (data.error_report ?? {}) as Record<string, unknown>;
        batch = {
          id: data.id,
          fileName: data.file_name,
          fileType: data.file_type,
          tahun: data.tahun,
          headers: [],
          mapping: (data.column_mapping ?? {}) as Record<string, string>,
          rows: [],
          totalRows: data.total_rows ?? 0,
          validRows: data.success_rows ?? 0,
          errorRows: data.error_rows ?? 0,
          duplicateRows: Number(report.duplicateRows ?? 0),
          warningRows: Number(report.warningRows ?? 0),
          emptyColumns: (report.emptyColumns as ColumnIssue[]) ?? [],
          invalidColumns: (report.invalidColumns as ColumnIssue[]) ?? [],
          logs: (report.logs as ImportLogEntry[]) ?? [],
          status: data.status === 'rolled_back' ? 'rolled_back' : 'completed',
          importedCaseIds: (report.importedCaseIds as string[]) ?? [],
          createdAt: data.started_at ?? new Date().toISOString(),
          completedAt: data.completed_at ?? undefined,
        };
      }
    }

    if (!batch) throw new NotFoundException('Batch tidak ditemukan.');
    if (batch.status !== 'completed') throw new BadRequestException('Hanya batch selesai yang bisa di-rollback.');

    let removed = 0;
    if (db) {
      const { data: links } = await db.from('import_batch_cases').select('case_id').eq('batch_id', batchId);
      const caseIds = links?.map((l) => l.case_id) ?? batch.importedCaseIds;
      if (caseIds.length > 0) {
        await db.from('cases').delete().in('id', caseIds);
        removed = caseIds.length;
      }
      await db
        .from('import_batches')
        .update({ status: 'rolled_back', rolled_back_at: new Date().toISOString() })
        .eq('id', batchId);
    } else {
      removed = batch.importedCaseIds.length;
    }

    batch.status = 'rolled_back';
    this.appendLog(batch, 'rollback', `Rollback ${removed} kasus dihapus`);
    this.batches.set(batchId, batch);

    return { batchId, status: 'rolled_back', removed };
  }

  async getHistory() {
    const memory = Array.from(this.batches.values())
      .filter((b) => ['completed', 'rolled_back', 'failed'].includes(b.status))
      .map((b) => this.toHistoryItem(b));

    const db = this.supabaseService.db;
    if (!db) return { batches: memory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };

    const { data } = await db
      .from('import_batches')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    const dbBatches = (data ?? []).map((row) => {
      const report = (row.error_report ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        tahun: row.tahun,
        totalRows: row.total_rows ?? 0,
        validRows: row.success_rows ?? 0,
        errorRows: row.error_rows ?? 0,
        warningRows: Number(report.warningRows ?? 0),
        duplicateRows: Number(report.duplicateRows ?? 0),
        status: row.status,
        createdAt: row.started_at,
        completedAt: row.completed_at,
        logCount: Array.isArray(report.logs) ? report.logs.length : 0,
      };
    });

    const merged = new Map<string, ReturnType<typeof this.toHistoryItem>>();
    for (const b of dbBatches) merged.set(b.id, b);
    for (const b of memory) merged.set(b.id, b);

    return { batches: [...merged.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
  }

  private toHistoryItem(b: ImportBatch) {
    return {
      id: b.id,
      fileName: b.fileName,
      fileType: b.fileType,
      tahun: b.tahun,
      totalRows: b.totalRows,
      validRows: b.validRows,
      errorRows: b.errorRows,
      warningRows: b.warningRows,
      duplicateRows: b.duplicateRows,
      status: b.status,
      createdAt: b.createdAt,
      completedAt: b.completedAt,
      logCount: b.logs?.length ?? 0,
    };
  }

  async getBatchLog(batchId: string) {
    const batch = this.batches.get(batchId);
    if (batch?.logs?.length) {
      return { batchId, fileName: batch.fileName, logs: batch.logs };
    }

    const db = this.supabaseService.db;
    if (db) {
      const { data } = await db.from('import_batches').select('file_name, error_report').eq('id', batchId).maybeSingle();
      if (data) {
        const report = (data.error_report ?? {}) as Record<string, unknown>;
        return {
          batchId,
          fileName: data.file_name,
          logs: (report.logs as ImportLogEntry[]) ?? [],
        };
      }
    }

    throw new NotFoundException('Log import tidak ditemukan.');
  }

  getBatch(batchId: string) {
    const batch = this.batches.get(batchId);
    if (!batch) throw new NotFoundException('Batch tidak ditemukan.');
    return batch;
  }

  listDocFiles() {
    const docPath = path.resolve(process.cwd(), '..', 'doc');
    if (!fs.existsSync(docPath)) return { files: [], path: docPath };

    const files = fs
      .readdirSync(docPath)
      .filter((f) => /\.(xlsx|xls|csv|ods)$/i.test(f))
      .map((f) => ({
        fileName: f,
        size: fs.statSync(path.join(docPath, f)).size,
        tahun: Number(f.match(/(20\d{2}|201\d)/)?.[1] ?? 0),
      }))
      .filter((f) => f.tahun >= MIN_LOGBOOK_YEAR)
      .sort((a, b) => a.tahun - b.tahun);

    return { files, path: docPath, minYear: MIN_LOGBOOK_YEAR };
  }

  async importDocFolder() {
    const docPath = path.resolve(process.cwd(), '..', 'doc');
    if (!fs.existsSync(docPath)) throw new BadRequestException('Folder doc tidak ditemukan.');

    const fileNames = fs
      .readdirSync(docPath)
      .filter((f) => {
        if (!/logbook/i.test(f) || !/\.xlsx$/i.test(f)) return false;
        const tahun = Number(f.match(/(20\d{2}|201\d)/)?.[1] ?? 0);
        return tahun >= MIN_LOGBOOK_YEAR;
      });
    const results: Array<{
      fileName: string;
      batchId: string;
      totalRows: number;
      validRows: number;
      imported: number;
      format: string | null;
    }> = [];

    for (const fileName of fileNames.sort()) {
      const buffer = fs.readFileSync(path.join(docPath, fileName));
      const preview = this.createPreview(buffer, fileName);
      const validation = this.validateBatch(preview.batchId, preview.suggestedMapping, preview.detectedTahun ?? undefined);
      const execution = await this.executeImport(preview.batchId);

      results.push({
        fileName,
        batchId: preview.batchId,
        totalRows: preview.totalRows,
        validRows: validation.validRows,
        imported: execution.imported,
        format: preview.logbookFormat ?? null,
      });
    }

    return {
      totalFiles: results.length,
      totalImported: results.reduce((s, r) => s + r.imported, 0),
      minYear: MIN_LOGBOOK_YEAR,
      results,
    };
  }
}

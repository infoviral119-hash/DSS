import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import { resolveTables } from './backup.constants';

export type BackupPayload = {
  version: string;
  exportedAt: string;
  targets: string[];
  tables: Record<string, Record<string, unknown>[]>;
  recordCounts: Record<string, number>;
};

@Injectable()
export class BackupStorageService {
  private readonly root: string;

  constructor(private config: ConfigService) {
    this.root = path.resolve(process.cwd(), 'storage', 'backups');
    fs.mkdirSync(this.root, { recursive: true });
  }

  getRoot() {
    return this.root;
  }

  async exportTables(targets: string[]): Promise<{ buffer: Buffer; tables: string[]; recordCounts: Record<string, number> }> {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (!databaseUrl) throw new Error('DATABASE_URL tidak dikonfigurasi');

    const tables = resolveTables(targets.length ? targets : ['entire_database']);
    const { Client } = await import('pg');
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const payload: BackupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      targets,
      tables: {},
      recordCounts: {},
    };

    for (const table of tables) {
      try {
        const { rows } = await client.query(`SELECT * FROM ${table}`);
        payload.tables[table] = rows as Record<string, unknown>[];
        payload.recordCounts[table] = rows.length;
      } catch {
        payload.tables[table] = [];
        payload.recordCounts[table] = 0;
      }
    }

    await client.end();
    const raw = Buffer.from(JSON.stringify(payload));
    const buffer = gzipSync(raw);
    return { buffer, tables, recordCounts: payload.recordCounts };
  }

  saveFile(id: string, buffer: Buffer): string {
    const filePath = path.join(this.root, `${id}.json.gz`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  readFile(filePath: string): BackupPayload {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(this.root, path.basename(filePath));
    const buffer = gunzipSync(fs.readFileSync(abs));
    return JSON.parse(buffer.toString()) as BackupPayload;
  }

  sha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  getDirSize(): number {
    if (!fs.existsSync(this.root)) return 0;
    return fs.readdirSync(this.root).reduce((sum, f) => {
      try {
        return sum + fs.statSync(path.join(this.root, f)).size;
      } catch {
        return sum;
      }
    }, 0);
  }

  previewRestore(payload: BackupPayload, restoreTargets: string[]): {
    tables: { name: string; backupCount: number; added: number; updated: number; deleted: number; conflicts: number }[];
    totalAffected: number;
  } {
    const tables = resolveTables(restoreTargets.length ? restoreTargets : payload.targets);
    const rows = tables.map((name) => {
      const backupCount = payload.recordCounts[name] ?? payload.tables[name]?.length ?? 0;
      return { name, backupCount, added: backupCount, updated: 0, deleted: 0, conflicts: 0 };
    });
    const totalAffected = rows.reduce((s, r) => s + r.added, 0);
    return { tables: rows, totalAffected };
  }

  async restoreTables(payload: BackupPayload, restoreTargets: string[]): Promise<number> {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (!databaseUrl) throw new Error('DATABASE_URL tidak dikonfigurasi');

    const tables = resolveTables(restoreTargets.length ? restoreTargets : payload.targets);
    const { Client } = await import('pg');
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    let affected = 0;
    try {
      await client.query('BEGIN');
      for (const table of tables) {
        const rows = payload.tables[table] ?? [];
        if (!rows.length) continue;

        const cols = Object.keys(rows[0]);
        const colList = cols.map((c) => `"${c}"`).join(', ');
        await client.query(`DELETE FROM ${table}`);
        for (const row of rows) {
          const vals = cols.map((_, i) => `$${i + 1}`).join(', ');
          const params = cols.map((c) => row[c]);
          await client.query(`INSERT INTO ${table} (${colList}) VALUES (${vals})`, params);
        }
        affected += rows.length;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      await client.end();
    }
    return affected;
  }
}

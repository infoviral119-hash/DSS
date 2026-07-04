import { Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { Public } from '../auth/public.decorator';
import { getSupabaseProjectRef } from '../../config/env-folder.loader';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

@Public()
@Controller('setup')
export class SetupController {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  private migrationsDir() {
    return path.resolve(process.cwd(), '..', 'supabase', 'migrations');
  }

  private sqlEditorUrl() {
    const ref = getSupabaseProjectRef() || this.config.get<string>('SUPABASE_URL')?.split('.')[0]?.replace('https://', '');
    return `https://supabase.com/dashboard/project/${ref}/sql/new`;
  }

  @Get('supabase')
  async checkSupabase() {
    const db = this.supabase.db;
    if (!db) {
      return { connected: false, message: 'Supabase tidak dikonfigurasi di .env' };
    }

    const projectRef = getSupabaseProjectRef();
    const { count, error: countError } = await db
      .from('cases')
      .select('*', { count: 'exact', head: true });

    const tableMissing =
      countError?.message?.includes('Could not find the table') ||
      countError?.code === 'PGRST205';

    const testRow = {
      nomor_register: `TEST-${Date.now()}`,
      tanggal: '2021-01-01',
      nama_korban: 'Test Koneksi',
      jenis_kelamin: 'Perempuan',
      jenis_kekerasan: 'Test',
      status: 'Aktif',
    };

    const { error: insertError } = tableMissing
      ? { error: { message: 'Schema belum dijalankan' } }
      : await db.from('cases').insert(testRow);

    const needsSchema =
      tableMissing || insertError?.message?.includes('Could not find the table');

    if (!insertError && !needsSchema) {
      await db.from('cases').delete().eq('nomor_register', testRow.nomor_register);
    }

    const rlsSql = fs.readFileSync(path.join(this.migrationsDir(), '002_rls_policies.sql'), 'utf8');
    const schemaSql = this.getBootstrapSql();

    return {
      connected: true,
      projectRef,
      usesServiceRole: this.supabase.usesServiceRole(),
      casesCount: count ?? 0,
      canInsert: !insertError && !needsSchema,
      insertError: insertError?.message ?? null,
      countError: countError?.message ?? null,
      needsSchema,
      needsRlsSetup: Boolean(insertError) && !needsSchema,
      schemaSql: needsSchema ? schemaSql : undefined,
      rlsSql: insertError && !needsSchema ? rlsSql : undefined,
      sqlEditorUrl: this.sqlEditorUrl(),
    };
  }

  private getBootstrapSql() {
    const dir = this.migrationsDir();
    const files = ['001_initial_schema.sql', '002_rls_policies.sql'];
    return files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n\n');
  }

  @Post('apply-schema')
  async applySchema() {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      return {
        applied: false,
        message: 'Tambahkan DATABASE_URL di DSS_Project_New.env atau jalankan SQL di Supabase SQL Editor',
        sql: this.getBootstrapSql(),
        sqlEditorUrl: this.sqlEditorUrl(),
      };
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(this.getBootstrapSql());
    await client.end();
    this.supabase.connect();

    return { applied: true, projectRef: getSupabaseProjectRef() };
  }

  @Post('apply-rls')
  async applyRls() {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    const sqlPath = databaseUrl
      ? path.join(this.migrationsDir(), '002_rls_policies.sql')
      : path.join(this.migrationsDir(), '003_disable_rls_dev.sql');

    if (!databaseUrl) {
      const sql = fs.readFileSync(path.join(this.migrationsDir(), '003_disable_rls_dev.sql'), 'utf8');
      return {
        applied: false,
        message: 'Tambahkan DATABASE_URL di .env atau jalankan SQL di Supabase SQL Editor',
        sql,
        sqlEditorUrl: this.sqlEditorUrl(),
      };
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(sql);
    await client.end();
    this.supabase.connect();

    return { applied: true };
  }

  @Post('reload')
  reload() {
    this.supabase.connect();
    return {
      reloaded: true,
      usesServiceRole: this.supabase.usesServiceRole(),
      projectRef: getSupabaseProjectRef(),
    };
  }
}

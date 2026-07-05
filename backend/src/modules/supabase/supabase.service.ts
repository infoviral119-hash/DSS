import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    if (process.env.CLOUDFLARE_WORKER === '1') {
      this.connect();
      return;
    }
    this.connect();
    await this.tryApplyRlsOnStartup();
  }

  private async tryApplyRlsOnStartup() {
    const db = this.client;
    if (!db) return;

    const testRegister = `TEST-${Date.now()}`;
    const { error: insertError } = await db.from('cases').insert({
      nomor_register: testRegister,
      tanggal: '2021-01-01',
      nama_korban: 'Test',
      jenis_kelamin: 'Perempuan',
      jenis_kekerasan: 'Test',
      status: 'Aktif',
    });

    if (!insertError) {
      await db.from('cases').delete().eq('nomor_register', testRegister);
      return;
    }

    if (!insertError.message?.includes('row-level security')) return;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const { Client } = await import('pg');
      const sql = fs.readFileSync(
        path.resolve(process.cwd(), '..', 'supabase', 'migrations', '002_rls_policies.sql'),
        'utf8',
      );
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      await client.query(sql);
      await client.end();
      this.connect();
      console.log('RLS policies applied via DATABASE_URL');
    } catch (err) {
      console.warn('RLS auto-apply skipped:', (err as Error).message);
    }
  }

  private readServiceRoleFromFiles(): string {
    const root = path.resolve(process.cwd(), '..');
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(root, '.env'),
      path.resolve(root, 'DSS_Project_New.env'),
      path.resolve(root, 'service_role.env'),
      path.resolve(root, 'service role.env'),
      path.resolve(root, 'anon public1.env'),
    ];

    const url = this.config.get<string>('SUPABASE_URL') ?? '';
    const urlRef = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

    for (const file of candidates) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
      const value = match?.[1]?.trim();
      if (value?.startsWith('eyJ')) {
        try {
          const ref = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).ref;
          if (!urlRef || ref === urlRef) return value;
        } catch {
          return value;
        }
      }

      const tokens = content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
      for (const token of tokens) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
          if (payload.role === 'service_role' && (!urlRef || payload.ref === urlRef)) return token;
        } catch {
          /* skip */
        }
      }
    }
    return '';
  }

  connect() {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() || this.readServiceRoleFromFiles();
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY');
    const key = serviceKey || anonKey;

    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      console.log(`Supabase connected (${serviceKey ? 'service_role' : 'anon'})`);
    }
  }

  get db(): SupabaseClient | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  usesServiceRole(): boolean {
    const key =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() || this.readServiceRoleFromFiles();
    return Boolean(key?.startsWith('eyJ'));
  }
}

import * as path from 'path';
import { loadEnvFromFolder } from '../config/env-folder.loader';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportService } from '../modules/import/import.service';
import { SupabaseService } from '../modules/supabase/supabase.service';

loadEnvFromFolder(path.resolve(__dirname, '../..'));

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const supabase = app.get(SupabaseService);
  const importService = app.get(ImportService);

  supabase.connect();
  if (!supabase.db) {
    throw new Error('Supabase tidak terhubung. Cek SUPABASE_* / DATABASE_URL di backend/.env');
  }

  if (!supabase.usesServiceRole()) {
    console.warn('Peringatan: pakai anon key — pastikan RLS mengizinkan insert cases.');
  }

  const before = await supabase.db.from('cases').select('*', { count: 'exact', head: true });
  console.log(`Kasus sebelum import: ${before.count ?? 0}`);

  const result = await importService.importDocFolder();
  console.log(JSON.stringify(result, null, 2));

  const after = await supabase.db.from('cases').select('*', { count: 'exact', head: true });
  console.log(`Kasus setelah import: ${after.count ?? 0}`);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

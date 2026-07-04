import { loadEnvFromFolder } from '../config/env-folder.loader';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportService } from '../modules/import/import.service';
import { SupabaseService } from '../modules/supabase/supabase.service';

loadEnvFromFolder(path.resolve(__dirname, '../..'));

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService);
  const importService = app.get(ImportService);

  supabase.connect();

  const db = supabase.db;
  if (db) {
    const test = await db.from('cases').insert({
      nomor_register: `TEST-${Date.now()}`,
      tanggal: '2021-01-01',
      nama_korban: 'Test',
      jenis_kelamin: 'Perempuan',
      jenis_kekerasan: 'Test',
      status: 'Aktif',
    });
    console.log('insert test:', test.error?.message ?? 'OK');
    if (!test.error) {
      await db.from('cases').delete().eq('nomor_register', test.error ? '' : `TEST-${Date.now()}`);
    }
  }

  const result = await importService.importDocFolder();
  console.log(JSON.stringify(result, null, 2));

  const count = await db?.from('cases').select('*', { count: 'exact', head: true });
  console.log('cases in db:', count?.count ?? 0);

  await app.close();
}

import * as path from 'path';
main().catch(console.error);

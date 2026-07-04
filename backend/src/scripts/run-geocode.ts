import * as path from 'path';
import { loadEnvFromFolder } from '../config/env-folder.loader';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CasesService } from '../modules/cases/cases.service';
import { SupabaseService } from '../modules/supabase/supabase.service';

loadEnvFromFolder(path.resolve(__dirname, '../..'));

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService);
  const casesService = app.get(CasesService);

  supabase.connect();
  const result = await casesService.geocodeBackfill(true);
  console.log(JSON.stringify(result, null, 2));
  await app.close();
}

main().catch(console.error);

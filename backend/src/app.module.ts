import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { CasesModule } from './modules/cases/cases.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ImportModule } from './modules/import/import.module';
import { AiModule } from './modules/ai/ai.module';
import { SetupModule } from './modules/setup/setup.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MasterModule } from './modules/master/master.module';
import { GisModule } from './modules/gis/gis.module';
import { ForecastModule } from './modules/forecast/forecast.module';

import { DevModule } from './modules/dev/dev.module';
import { SecurityModule } from './modules/security/security.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    AuthModule,
    SupabaseModule,
    CasesModule,
    AnalyticsModule,
    GisModule,
    ForecastModule,
    ImportModule,
    AiModule,
    SetupModule,
    ReportsModule,
    MasterModule,
    DevModule,
    SecurityModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

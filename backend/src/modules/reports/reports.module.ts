import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportMailService } from './report-mail.service';
import { CasesModule } from '../cases/cases.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiModule } from '../ai/ai.module';
import { GisModule } from '../gis/gis.module';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [CasesModule, AnalyticsModule, AiModule, GisModule, ForecastModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportMailService],
  exports: [ReportsService, ReportMailService],
})
export class ReportsModule {}

import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsChartsService } from './analytics-charts.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsChartsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

import { Module } from '@nestjs/common';
import { DevSmokeController } from './dev-smoke.controller';
import { DevSmokeService } from './dev-smoke.service';
import { CasesModule } from '../cases/cases.module';
import { ForecastModule } from '../forecast/forecast.module';
import { ReportsModule } from '../reports/reports.module';
import { AiModule } from '../ai/ai.module';
import { GisModule } from '../gis/gis.module';

@Module({
  imports: [CasesModule, ForecastModule, ReportsModule, AiModule, GisModule],
  controllers: [DevSmokeController],
  providers: [DevSmokeService],
})
export class DevModule {}

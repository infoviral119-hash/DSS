import { Module } from '@nestjs/common';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { ForecastMlClient } from './forecast-ml.client';

@Module({
  controllers: [ForecastController],
  providers: [ForecastService, ForecastMlClient],
  exports: [ForecastService, ForecastMlClient],
})
export class ForecastModule {}

import { Controller, Get, Query } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('intelligence')
  getIntelligence(@Query() query: Record<string, string | undefined>) {
    return this.forecastService.getIntelligence(query);
  }

  @Get('ml-status')
  getMlStatus() {
    return this.forecastService.getMlStatus();
  }
}

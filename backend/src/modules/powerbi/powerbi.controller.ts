import { Controller, Get } from '@nestjs/common';
import { PowerBiService } from './powerbi.service';

@Controller('powerbi')
export class PowerBiController {
  constructor(private readonly powerBiService: PowerBiService) {}

  @Get('status')
  getStatus() {
    return this.powerBiService.getStatus();
  }

  @Get('embed')
  getEmbed() {
    return this.powerBiService.getEmbedConfig();
  }
}

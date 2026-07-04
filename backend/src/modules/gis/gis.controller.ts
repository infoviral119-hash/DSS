import { Controller, Get, Query, Param } from '@nestjs/common';
import { GisService } from './gis.service';
import type { BoundaryFeatureCollection } from './data/boundaries';

@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Get('map')
  getMap(@Query() query: Record<string, string | undefined>) {
    return this.gisService.getMapData(query);
  }

  @Get('stats')
  getStats(@Query() query: Record<string, string | undefined>) {
    return this.gisService.getStats(query);
  }

  @Get('insights')
  getInsights(@Query() query: Record<string, string | undefined>) {
    return this.gisService.getInsights(query);
  }

  @Get('boundaries/:level')
  getBoundaries(@Param('level') level: 'provinsi' | 'kabupaten' | 'kecamatan'): BoundaryFeatureCollection {
    return this.gisService.getBoundaries(level);
  }

  @Get('services')
  getServices() {
    return this.gisService.getServices();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsChartsService } from './analytics-charts.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly chartsService: AnalyticsChartsService,
  ) {}

  @Get('trends')
  getTrends(@Query() query: Record<string, string | undefined>) {
    return this.analyticsService.getTrends(query);
  }

  @Get('demographics')
  getDemographics(@Query() query: Record<string, string | undefined>) {
    return this.analyticsService.getDemographics(query);
  }

  @Get('overview')
  getOverview(@Query() query: Record<string, string | undefined>) {
    return this.analyticsService.getOverview(query);
  }

  @Get('pendampingan')
  getPendampingan(@Query() query: Record<string, string | undefined>) {
    return this.analyticsService.getPendampingan(query);
  }

  @Get('forecast')
  getForecast(@Query() query: Record<string, string | undefined>) {
    const months = query.months ? Number(query.months) : 6;
    return this.analyticsService.getForecast(query, months);
  }

  @Get('pareto')
  getPareto(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getPareto(query);
  }

  @Get('treemap')
  getTreemap(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getTreemap(query);
  }

  @Get('sunburst')
  getSunburst(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getSunburst(query);
  }

  @Get('heatmap')
  getHeatmap(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getHeatmap(query);
  }

  @Get('stacked-area')
  getStackedArea(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getStackedArea(query);
  }

  @Get('sankey')
  getSankey(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getSankey(query);
  }

  @Get('funnel')
  getFunnel(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getFunnel(query);
  }

  @Get('waterfall')
  getWaterfall(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getWaterfall(query);
  }

  @Get('scatter')
  getScatter(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getScatter(query);
  }

  @Get('bubble')
  getBubble(@Query() query: Record<string, string | undefined>) {
    return this.chartsService.getBubble(query);
  }
}

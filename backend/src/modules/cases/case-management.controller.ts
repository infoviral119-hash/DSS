import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CaseManagementService } from './case-management.service';
import type { AuthUser } from '../auth/auth.service';

@Controller('cases/management')
@UseGuards(JwtAuthGuard)
export class CaseManagementController {
  constructor(private cm: CaseManagementService) {}

  @Get('kpis')
  kpis(@Query() query: Record<string, string>, @Req() req: { user: AuthUser }) {
    return this.cm.getKpis(query, req.user);
  }

  @Get('list')
  list(@Query() query: Record<string, string>, @Req() req: { user: AuthUser }) {
    return this.cm.list(query, req.user);
  }

  @Get('quality')
  quality(@Query() query: Record<string, string>, @Req() req: { user: AuthUser }) {
    return this.cm.getQuality(query, req.user);
  }

  @Get('analytics')
  analytics(@Query() query: Record<string, string>, @Req() req: { user: AuthUser }) {
    return this.cm.getQuickAnalytics(query, req.user);
  }

  @Get('saved-filters')
  savedFilters(@Req() req: { user: AuthUser }) {
    return this.cm.getSavedFilters(req.user.id);
  }

  @Post('saved-filters')
  saveFilter(@Body() body: { name: string; filters: Record<string, unknown> }, @Req() req: { user: AuthUser }) {
    return this.cm.saveFilter(req.user.id, body.name, body.filters);
  }

  @Delete('saved-filters/:id')
  deleteFilter(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.cm.deleteSavedFilter(req.user.id, id);
  }

  @Get('preferences')
  preferences(@Req() req: { user: AuthUser }) {
    return this.cm.getPreferences(req.user.id);
  }

  @Post('preferences')
  savePreferences(@Body() body: { visibleColumns: string[]; columnOrder: string[] }, @Req() req: { user: AuthUser }) {
    return this.cm.savePreferences(req.user.id, body.visibleColumns, body.columnOrder);
  }

  @Post('export')
  exportCases(@Body() body: { ids?: string[]; format?: string; scope?: string }, @Query() query: Record<string, string>, @Req() req: { user: AuthUser }) {
    return this.cm.exportCases(body, query, req.user);
  }

  @Post('bulk')
  bulk(@Body() body: { action: string; ids: string[] }, @Req() req: { user: AuthUser }) {
    return this.cm.bulkAction(body, req.user);
  }

  @Get(':id')
  detail(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.cm.getDetail(id, req.user);
  }
}

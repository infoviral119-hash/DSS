import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';

import { CasesService } from './cases.service';

import type { AuthUser } from '../auth/auth.service';



@Controller('cases')

export class CasesController {

  constructor(private readonly casesService: CasesService) {}



  @Get()

  findAll(@Query() query: Record<string, string | undefined>, @Req() req: { user?: AuthUser }) {

    return this.casesService.findAll(query, req.user);

  }



  @Get('stats')

  getStats(@Query() query: Record<string, string | undefined>, @Req() req: { user?: AuthUser }) {

    return this.casesService.getStats(query, req.user);

  }



  @Get('map')

  getMapPoints(@Query() query: Record<string, string | undefined>, @Req() req: { user?: AuthUser }) {

    return this.casesService.getMapPoints(query, req.user);

  }



  @Get('filter-options')

  getFilterOptions(@Req() req: { user?: AuthUser }) {

    return this.casesService.getFilterOptions(req.user);

  }



  @Post('reveal-field')

  revealField(@Body() body: { caseId: string; field: string }, @Req() req: { user: AuthUser }) {

    return this.casesService.revealField(req.user, body.caseId, body.field);

  }



  @Post('geocode-backfill')

  geocodeBackfill(@Body() body?: { force?: boolean }) {

    return this.casesService.geocodeBackfill(body?.force ?? false);

  }

}



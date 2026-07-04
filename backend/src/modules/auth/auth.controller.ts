import { Controller, Get, Post, Req } from '@nestjs/common';
import type { AuthUser } from './auth.service';
import { SecurityService } from '../security/security.service';

@Controller('auth')
export class AuthController {
  constructor(private security: SecurityService) {}

  @Get('me')
  me(@Req() req: { user: AuthUser }) {
    return req.user;
  }

  @Post('track-login')
  trackLogin(@Req() req: { user: AuthUser; ip?: string; headers?: Record<string, string> }) {
    const sessionId = `sess-${Date.now().toString(36)}`;
    this.security.trackLogin({
      userId: req.user.id,
      email: req.user.email,
      success: true,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
      sessionId,
    });
    return { ok: true, sessionId };
  }
}
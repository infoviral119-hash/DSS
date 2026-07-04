import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/roles.decorator';
import { SkipRoles } from '../auth/skip-roles.decorator';
import { SkipPermissions } from '../auth/roles.decorator';
import { PermissionsGuard } from './permissions.guard';
import { SecurityService } from './security.service';
import { MfaService } from './mfa.service';
import { NotificationService } from './notification.service';
import { SchedulerService } from './scheduler.service';
import type { AuthUser } from '../auth/auth.service';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'system_admin', 'auditor')
@Permissions('Security.View')
export class SecurityController {
  constructor(
    private security: SecurityService,
    private mfa: MfaService,
    private notifications: NotificationService,
    private scheduler: SchedulerService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.security.getDashboard();
  }

  @Get('users')
  listUsers() {
    return this.security.listUsers();
  }

  @Patch('users/:id')
  @Roles('admin', 'super_admin', 'system_admin')
  @Permissions('User.Create')
  updateUser(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.security.updateUser(id, body, req.user.id);
  }

  @Get('roles')
  getRoles() {
    return this.security.getRoles();
  }

  @Get('roles/:slug/permissions')
  getRoleMatrix(@Param('slug') slug: string) {
    return this.security.getRoleMatrix(slug);
  }

  @Get('permissions')
  getPermissions() {
    return this.security.getPermissions();
  }

  @Get('my-permissions')
  myPermissions(@Req() req: { user: AuthUser }) {
    return this.security.getUserPermissions(req.user.role);
  }

  @Get('login-history')
  getLoginHistory() {
    return this.security.getLoginHistory();
  }

  @Get('sessions')
  getSessions() {
    return this.security.getSessions();
  }

  @Post('sessions/:id/terminate')
  @Roles('admin', 'super_admin', 'system_admin')
  killSession(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.security.killSession(id, req.user.id);
  }

  @Get('password-policy')
  getPasswordPolicy() {
    return this.security.getPasswordPolicy();
  }

  @Patch('password-policy')
  @Roles('admin', 'super_admin', 'system_admin')
  updatePasswordPolicy(@Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.security.updatePasswordPolicy(body, req.user.id);
  }

  @Get('center')
  getSecurityCenter() {
    return this.security.getSecurityCenter();
  }

  @Get('audit')
  @Permissions('Audit.Export')
  getAudit(@Query('limit') limit?: string) {
    return this.security.getAuditTrail(limit ? parseInt(limit, 10) : 100);
  }

  @Get('organizations')
  getOrganizations() {
    return this.security.getOrganizations();
  }

  @Get('departments')
  getDepartments() {
    return this.security.getDepartments();
  }

  @Get('user-groups')
  getUserGroups() {
    return this.security.getUserGroups();
  }

  @Get('system-health')
  getSystemHealth() {
    return this.security.getSystemHealth();
  }

  @Get('api-keys')
  getApiKeys() {
    return this.security.getApiKeys();
  }

  @Post('api-keys')
  @Roles('admin', 'super_admin', 'system_admin')
  createApiKey(@Body() body: { name: string; rateLimit?: number; expiresDays?: number }, @Req() req: { user: AuthUser }) {
    return this.security.createApiKey(body.name, req.user.id, body.rateLimit, body.expiresDays);
  }

  @Delete('api-keys/:id')
  @Roles('admin', 'super_admin', 'system_admin')
  revokeApiKey(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.security.revokeApiKey(id, req.user.id);
  }

  @Get('backups')
  getBackups() {
    return this.security.getBackups();
  }

  @Get('data-retention')
  getDataRetention() {
    return this.security.getDataRetention();
  }

  @Get('config')
  getConfig() {
    return this.security.getConfig();
  }

  @Get('trusted-devices')
  getTrustedDevices(@Query('userId') userId?: string) {
    return this.security.getTrustedDevices(userId);
  }

  @Get('mfa/status')
  mfaStatus(@Req() req: { user: AuthUser }) {
    return this.mfa.getStatus(req.user.id);
  }

  @Post('mfa/setup-authenticator')
  mfaSetup(@Req() req: { user: AuthUser }) {
    return this.mfa.setupAuthenticator(req.user.id, req.user.email);
  }

  @Post('mfa/verify-authenticator')
  mfaVerify(@Body() body: { token: string }, @Req() req: { user: AuthUser }) {
    return this.mfa.verifyAuthenticator(req.user.id, body.token);
  }

  @Post('mfa/send-email-otp')
  mfaSendEmail(@Req() req: { user: AuthUser }) {
    return this.mfa.sendEmailOtp(req.user.id, req.user.email);
  }

  @Post('mfa/verify-email-otp')
  mfaVerifyEmail(@Body() body: { code: string }, @Req() req: { user: AuthUser }) {
    return this.mfa.verifyEmailOtp(req.user.id, body.code);
  }

  @Post('mfa/reset/:userId')
  @Roles('admin', 'super_admin', 'system_admin')
  mfaReset(@Param('userId') userId: string, @Req() req: { user: AuthUser }) {
    return this.mfa.resetMfa(userId, req.user.id);
  }

  @Post('pii/reveal')
  revealPii(@Body() body: { caseId: string; field: string }, @Req() req: { user: AuthUser; ip?: string }) {
    return this.security.logPiiReveal(req.user.id, body.caseId, body.field, req.ip);
  }

  @Get('search')
  @SkipRoles()
  @SkipPermissions()
  globalSearch(@Query('q') q?: string) {
    return this.security.globalSearch(q ?? '');
  }

  @Get('notifications')
  @SkipRoles()
  @SkipPermissions()
  listNotifications(@Req() req: { user: AuthUser }) {
    return this.notifications.list(req.user.id);
  }

  @Get('notifications/unread-count')
  @SkipRoles()
  @SkipPermissions()
  unreadCount(@Req() req: { user: AuthUser }) {
    return this.notifications.unreadCount(req.user.id);
  }

  @Patch('notifications/:id/read')
  @SkipRoles()
  @SkipPermissions()
  markNotificationRead(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.notifications.markRead(id, req.user.id);
  }

  @Post('notifications/read-all')
  @SkipRoles()
  @SkipPermissions()
  markAllRead(@Req() req: { user: AuthUser }) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Get('scheduler/jobs')
  listSchedulerJobs() {
    return this.scheduler.listJobs();
  }

  @Patch('scheduler/jobs/:id')
  @Roles('admin', 'super_admin', 'system_admin')
  toggleSchedulerJob(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.scheduler.toggleJob(id, body.enabled);
  }

  @Delete('trusted-devices/:id')
  @SkipRoles()
  @SkipPermissions()
  removeTrustedDevice(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.security.removeTrustedDevice(id, req.user.id, req.user.role);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/roles.decorator';
import { PermissionsGuard } from '../security/permissions.guard';
import { BackupService } from './backup.service';
import type { AuthUser } from '../auth/auth.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'system_admin', 'supervisor', 'auditor', 'operator')
@Permissions('Backup.View')
export class BackupController {
  constructor(private backup: BackupService) {}

  @Get('dashboard')
  getDashboard() {
    return this.backup.getDashboard();
  }

  @Get('health')
  getHealth() {
    return this.backup.getHealth();
  }

  @Get('storage')
  getStorage() {
    return this.backup.getStorage();
  }

  @Get('meta')
  getMeta() {
    return this.backup.getMeta();
  }

  @Get('jobs')
  listJobs() {
    return this.backup.listJobs();
  }

  @Post('jobs')
  @Roles('admin', 'super_admin', 'system_admin', 'supervisor')
  @Permissions('Backup.Run')
  createJob(@Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.backup.createJob(body, req.user.id);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.backup.getJobDetail(id);
  }

  @Post('jobs/:id/clone')
  @Roles('admin', 'super_admin', 'system_admin', 'supervisor')
  @Permissions('Backup.Run')
  cloneJob(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.backup.cloneJob(id, req.user.id);
  }

  @Get('jobs/:id/logs')
  jobLogs(@Param('id') id: string) {
    return this.backup.getLogs({ jobId: id });
  }

  @Patch('jobs/:id')
  @Roles('admin', 'super_admin', 'system_admin', 'supervisor')
  @Permissions('Backup.Manage')
  updateJob(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.backup.updateJob(id, body, req.user.id);
  }

  @Delete('jobs/:id')
  @Roles('admin', 'super_admin', 'system_admin')
  @Permissions('Backup.Manage')
  deleteJob(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.backup.deleteJob(id, req.user.id);
  }

  @Post('run')
  @Roles('admin', 'super_admin', 'system_admin', 'supervisor')
  @Permissions('Backup.Run')
  runBackup(@Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.backup.runBackup(body as Parameters<BackupService['runBackup']>[0], req.user.id);
  }

  @Get('recovery')
  listRecoveryPoints() {
    return this.backup.listRecoveryPoints();
  }

  @Get('recovery/:id')
  getRecoveryPoint(@Param('id') id: string) {
    return this.backup.getRecoveryPointDetail(id);
  }

  @Get('logs')
  getLogs(@Query('jobId') jobId?: string, @Query('recoveryPointId') recoveryPointId?: string) {
    return this.backup.getLogs({ jobId, recoveryPointId });
  }

  @Post('restore/preview')
  @Roles('admin', 'super_admin', 'system_admin')
  @Permissions('Backup.Restore')
  previewRestore(@Body() body: { recoveryPointId: string; targets?: string[] }) {
    return this.backup.previewRestore(body.recoveryPointId, body.targets ?? []);
  }

  @Post('restore')
  @Roles('admin', 'super_admin', 'system_admin')
  @Permissions('Backup.Restore')
  restore(@Body() body: { recoveryPointId: string; targets?: string[]; reason?: string }, @Req() req: { user: AuthUser }) {
    return this.backup.restore(body.recoveryPointId, body, req.user.id);
  }

  @Get('history')
  listHistory() {
    return this.backup.listHistory();
  }

  @Get('restore-history')
  listRestoreHistory() {
    return this.backup.listRestoreHistory();
  }

  @Get('repository')
  listRepositories() {
    return this.backup.listRepositories();
  }

  @Get('repository/:id')
  getRepository(@Param('id') id: string) {
    return this.backup.getRepositoryDetail(id);
  }

  @Post('repository')
  @Roles('admin', 'super_admin', 'system_admin')
  @Permissions('Backup.Manage')
  createRepository(@Body() body: Record<string, unknown>, @Req() req: { user: AuthUser }) {
    return this.backup.createRepository(body, req.user.id);
  }
}

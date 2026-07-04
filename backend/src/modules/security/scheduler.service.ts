import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationService } from './notification.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.warn(e)), 60_000);
    this.tick().catch(() => {});
  }

  private get db() {
    return this.supabase.db;
  }

  async listJobs() {
    if (!this.db) return [];
    const { data } = await this.db.from('scheduled_jobs').select('*').order('name');
    return (data ?? []).map((j) => ({
      id: j.id,
      name: j.name,
      jobType: j.job_type,
      intervalMinutes: j.interval_minutes,
      enabled: j.enabled,
      lastRunAt: j.last_run_at,
      nextRunAt: j.next_run_at,
    }));
  }

  async toggleJob(id: string, enabled: boolean) {
    if (!this.db) throw new Error('DB offline');
    await this.db.from('scheduled_jobs').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id);
    return { ok: true };
  }

  private async tick() {
    if (!this.db) return;
    const now = new Date();
    const { data: jobs } = await this.db.from('scheduled_jobs').select('*').eq('enabled', true);
    for (const job of jobs ?? []) {
      const next = job.next_run_at ? new Date(job.next_run_at) : new Date(0);
      if (next > now) continue;
      await this.runJob(job.job_type, job.name);
      const nextRun = new Date(now.getTime() + (job.interval_minutes ?? 60) * 60_000);
      await this.db.from('scheduled_jobs').update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString(),
        updated_at: now.toISOString(),
      }).eq('id', job.id);
    }
  }

  private async runJob(type: string, name: string) {
    this.logger.log(`Running job: ${name} (${type})`);
    switch (type) {
      case 'session_cleanup':
        await this.db!.from('active_sessions')
          .update({ status: 'expired' })
          .lt('last_active_at', new Date(Date.now() - 24 * 3600_000).toISOString())
          .eq('status', 'active');
        break;
      case 'retention_cleanup': {
        const { data: rules } = await this.db!.from('data_retention').select('*');
        for (const r of rules ?? []) {
          if (r.resource === 'login_history') {
            const cutoff = new Date(Date.now() - r.retention_days * 86400000).toISOString();
            await this.db!.from('login_history').delete().lt('created_at', cutoff);
          }
        }
        break;
      }
      case 'security_digest':
        await this.notifications.notifyAdmins('Security Digest', 'Laporan keamanan harian tersedia di Security Center.', 'information');
        break;
      case 'backup_check': {
        const { data: last } = await this.db!.from('backups').select('*').order('created_at', { ascending: false }).limit(1);
        const stale = !last?.length || new Date(last[0].created_at) < new Date(Date.now() - 48 * 3600_000);
        if (stale) {
          await this.notifications.notifyAdmins('Backup Failed', 'Backup terakhir sudah lebih dari 48 jam.', 'critical');
        }
        break;
      }
      default:
        break;
    }
  }
}

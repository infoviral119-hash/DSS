import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { queueEmail, listEmailQueue, type EmailQueueItem } from './report-store';

@Injectable()
export class ReportMailService {
  private readonly logger = new Logger(ReportMailService.name);

  constructor(private config: ConfigService) {}

  async sendReportEmail(input: { to: string; subject: string; body: string; reportUrl?: string }) {
    const body = `${input.body}\n\nUnduh laporan: ${input.reportUrl ?? 'e-Insight DSS'}`;
    const queued = queueEmail({ to: input.to, subject: input.subject, body });

    const webhook = this.config.get<string>('REPORT_EMAIL_WEBHOOK')?.trim();
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: input.to, subject: input.subject, body }),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          queued.status = 'sent';
          queued.sentAt = new Date().toISOString();
          this.logger.log(`Email terkirim ke ${input.to}`);
        } else {
          queued.status = 'failed';
          this.logger.warn(`Webhook email gagal: ${res.status}`);
        }
      } catch (err) {
        queued.status = 'failed';
        this.logger.warn(`Webhook email error: ${err}`);
      }
    } else {
      this.logger.log(`Email di-queue (set REPORT_EMAIL_WEBHOOK): ${input.to}`);
    }

    return queued;
  }

  getQueue(): EmailQueueItem[] {
    return listEmailQueue();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  async send(input: { to: string; subject: string; body: string; html?: string }) {
    const webhook = this.config.get<string>('REPORT_EMAIL_WEBHOOK')?.trim()
      ?? this.config.get<string>('SECURITY_EMAIL_WEBHOOK')?.trim();

    if (!webhook) {
      this.logger.warn(`Email skipped (set REPORT_EMAIL_WEBHOOK): ${input.to} — ${input.subject}`);
      return { ok: false, queued: false, reason: 'webhook_not_configured' };
    }

    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: input.to,
          subject: input.subject,
          body: input.body,
          html: input.html ?? input.body.replace(/\n/g, '<br>'),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        this.logger.log(`Email terkirim ke ${input.to}`);
        return { ok: true, queued: false };
      }
      this.logger.warn(`Email webhook gagal: ${res.status}`);
      return { ok: false, queued: false, reason: `http_${res.status}` };
    } catch (err) {
      this.logger.warn(`Email error: ${err}`);
      return { ok: false, queued: false, reason: String(err) };
    }
  }
}

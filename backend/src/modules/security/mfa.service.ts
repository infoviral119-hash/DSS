import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from './email.service';

@Injectable()
export class MfaService {
  constructor(
    private supabase: SupabaseService,
    private email: EmailService,
  ) {}

  private get db() {
    return this.supabase.db;
  }

  async getStatus(userId: string) {
    if (!this.db) return { enabled: false, methods: [] };
    const { data: profile } = await this.db.from('profiles').select('mfa_enabled').eq('id', userId).single();
    const { data: mfa } = await this.db.from('mfa_settings').select('*').eq('user_id', userId).maybeSingle();
    const methods: string[] = [];
    if (mfa?.authenticator_enabled) methods.push('authenticator');
    if (mfa?.email_otp_enabled) methods.push('email_otp');
    if ((mfa?.recovery_codes as string[] | null)?.length) methods.push('recovery_code');
    return { enabled: profile?.mfa_enabled ?? false, methods, hasBackup: Boolean((mfa?.backup_codes as string[] | null)?.length) };
  }

  async setupAuthenticator(userId: string, email: string) {
    if (!this.db) throw new Error('DB offline');
    const secret = generateSecret();
    const otpauth = generateURI({ issuer: 'e-Insight DSS', label: email, secret });
    await this.db.from('mfa_settings').upsert({
      user_id: userId,
      totp_secret: secret,
      updated_at: new Date().toISOString(),
    });
    return { secret, otpauth };
  }

  async verifyAuthenticator(userId: string, token: string) {
    if (!this.db) throw new Error('DB offline');
    const { data: mfa } = await this.db.from('mfa_settings').select('*').eq('user_id', userId).single();
    if (!mfa?.totp_secret) throw new Error('MFA belum di-setup');
    const result = await verify({ token, secret: mfa.totp_secret });
    if (!result.valid) throw new Error('Kode OTP tidak valid');
    const recoveryCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex'));
    await this.db.from('mfa_settings').update({
      authenticator_enabled: true,
      recovery_codes: recoveryCodes,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    await this.db.from('profiles').update({ mfa_enabled: true }).eq('id', userId);
    return { ok: true, recoveryCodes };
  }

  async sendEmailOtp(userId: string, email: string) {
    if (!this.db) throw new Error('DB offline');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await this.db.from('mfa_settings').upsert({
      user_id: userId,
      pending_email_otp: createHash('sha256').update(code).digest('hex'),
      email_otp_expires_at: expires,
      updated_at: new Date().toISOString(),
    });

    const sent = await this.email.send({
      to: email,
      subject: 'e-Insight — Kode OTP MFA',
      body: `Kode OTP Anda: ${code}\n\nBerlaku 10 menit. Jangan bagikan kode ini.`,
      html: `<p>Kode OTP MFA e-Insight:</p><h2>${code}</h2><p>Berlaku 10 menit.</p>`,
    });

    return {
      ok: true,
      emailSent: sent.ok,
      devCode: !sent.ok && process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyEmailOtp(userId: string, code: string) {
    if (!this.db) throw new Error('DB offline');
    const { data: mfa } = await this.db.from('mfa_settings').select('*').eq('user_id', userId).single();
    if (!mfa?.pending_email_otp) throw new Error('OTP belum diminta');
    if (mfa.email_otp_expires_at && new Date(mfa.email_otp_expires_at) < new Date()) {
      throw new Error('OTP expired');
    }
    const hash = createHash('sha256').update(code).digest('hex');
    if (hash !== mfa.pending_email_otp) throw new Error('OTP salah');
    await this.db.from('mfa_settings').update({
      email_otp_enabled: true,
      pending_email_otp: null,
      email_otp_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    await this.db.from('profiles').update({ mfa_enabled: true }).eq('id', userId);
    return { ok: true };
  }

  async resetMfa(userId: string, actorId: string) {
    if (!this.db) throw new Error('DB offline');
    await this.db.from('mfa_settings').delete().eq('user_id', userId);
    await this.db.from('profiles').update({ mfa_enabled: false, updated_by: actorId }).eq('id', userId);
    return { ok: true };
  }
}

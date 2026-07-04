import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

export type ApiKeyAuth = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  apiKeyId: string;
  apiKeyName: string;
};

@Injectable()
export class ApiKeyService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.db;
  }

  async validate(rawKey: string): Promise<ApiKeyAuth | null> {
    if (!this.db || !rawKey?.startsWith('ei_')) return null;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const { data: keyRow } = await this.db
      .from('api_keys')
      .select('id, name, created_by, expires_at, revoked_at, rate_limit')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .maybeSingle();

    if (!keyRow) return null;
    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) return null;

    const { data: profile } = await this.db
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', keyRow.created_by)
      .maybeSingle();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      apiKeyId: keyRow.id,
      apiKeyName: keyRow.name,
    };
  }

  assertValid(rawKey: string) {
    return this.validate(rawKey).then((u) => {
      if (!u) throw new UnauthorizedException('API key tidak valid');
      return u;
    });
  }
}

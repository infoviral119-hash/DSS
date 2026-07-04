import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  dataScope?: string;
  scopeRegion?: string | null;
  canRevealPii?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  private userDb(token: string) {
    const url = this.config.get<string>('SUPABASE_URL');
    const anon = this.config.get<string>('SUPABASE_ANON_KEY');
    if (!url || !anon) return null;
    return createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async validateToken(token: string): Promise<AuthUser | null> {
    const db = this.supabase.db;
    if (!db) return null;

    const { data: authData, error } = await db.auth.getUser(token);
    if (error || !authData.user) return null;

    const authUser = authData.user;
    const email = authUser.email ?? '';
    const fullName = String(
      authUser.user_metadata?.full_name ?? email.split('@')[0] ?? 'User',
    );

    const profile = await this.ensureProfile(token, authUser.id, email, fullName);

    return {
      id: authUser.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      dataScope: profile.data_scope ?? 'national',
      scopeRegion: profile.scope_region ?? null,
      canRevealPii: profile.can_reveal_pii ?? false,
    };
  }

  private async ensureProfile(token: string, id: string, email: string, fullName: string) {
    const userDb = this.userDb(token);
    if (!userDb) throw new UnauthorizedException('Supabase tidak dikonfigurasi');

    const { data: existing } = await userDb.from('profiles').select('*').eq('id', id).maybeSingle();
    if (existing) return existing;

    const { data: created } = await userDb
      .from('profiles')
      .insert({ id, email, full_name: fullName, role: 'operator' })
      .select()
      .single();

    if (created) return created;

    return {
      id,
      email,
      full_name: fullName,
      role: 'operator',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.db;
  }

  async list(userId: string, limit = 50) {
    if (!this.db) return [];
    const { data } = await this.db
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      read: Boolean(n.read_at),
      createdAt: n.created_at,
    }));
  }

  async create(input: {
    userId: string;
    title: string;
    message: string;
    category?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!this.db) return null;
    const { data } = await this.db.from('user_notifications').insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      category: input.category ?? 'information',
      metadata: input.metadata ?? null,
    }).select().single();
    return data;
  }

  async markRead(id: string, userId: string) {
    if (!this.db) return { ok: false };
    await this.db.from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    return { ok: true };
  }

  async markAllRead(userId: string) {
    if (!this.db) return { ok: false };
    await this.db.from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .eq('user_id', userId);
    return { ok: true };
  }

  async unreadCount(userId: string) {
    if (!this.db) return 0;
    const { count } = await this.db
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    return count ?? 0;
  }

  async notifyAdmins(title: string, message: string, category = 'information') {
    if (!this.db) return;
    const { data: admins } = await this.db.from('profiles').select('id').eq('role', 'admin');
    for (const a of admins ?? []) {
      await this.create({ userId: a.id, title, message, category });
    }
  }

  async notifySecurityEvent(userId: string, type: string, detail: string) {
    const map: Record<string, { title: string; category: string }> = {
      login_new: { title: 'Login Baru', category: 'information' },
      password_changed: { title: 'Password Berubah', category: 'warning' },
      login_failed: { title: 'Failed Login', category: 'warning' },
      account_locked: { title: 'Akun Terkunci', category: 'critical' },
      new_device: { title: 'Perangkat Baru', category: 'warning' },
      backup_failed: { title: 'Backup Gagal', category: 'critical' },
    };
    const meta = map[type] ?? { title: 'Security Alert', category: 'information' };
    await this.create({
      userId,
      title: meta.title,
      message: detail,
      category: meta.category,
      metadata: { type },
    });
  }
}

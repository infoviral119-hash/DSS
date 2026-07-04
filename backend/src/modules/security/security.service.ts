import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { listAudit } from '../reports/report-store';
import { roleToSecuritySlug } from '../../common/data-security';
import { NotificationService } from './notification.service';

function parseBrowser(ua?: string) {
  if (!ua) return 'Browser';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function parseDeviceType(ua?: string) {
  if (!ua) return 'Desktop';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Tablet/i.test(ua)) return 'Tablet';
  if (/Mobile/i.test(ua)) return 'Mobile';
  return /Mac/i.test(ua) ? 'Laptop' : 'Desktop';
}

@Injectable()
export class SecurityService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationService,
  ) {}

  private get db() {
    return this.supabase.db;
  }

  async logAudit(input: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
    ip?: string;
    browser?: string;
    device?: string;
  }) {
    if (!this.db) return;
    await this.db.from('audit_logs').insert({
      user_id: input.userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      old_data: input.oldData ?? null,
      new_data: input.newData ?? null,
      ip_address: input.ip,
      browser: input.browser,
      device: input.device,
    });
  }

  async trackLogin(input: {
    userId: string;
    email: string;
    success: boolean;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    const browser = parseBrowser(input.userAgent);
    const device = input.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop';
    const os = input.userAgent?.includes('Windows') ? 'Windows' : input.userAgent?.includes('Mac') ? 'macOS' : 'Unknown';

    if (this.db) {
      await this.db.from('login_history').insert({
        user_id: input.userId,
        email: input.email,
        event_type: input.success ? 'login_success' : 'login_failed',
        success: input.success,
        ip_address: input.ip,
        browser,
        device,
        os,
      });

      if (input.success && input.sessionId) {
        await this.db.from('active_sessions').upsert({
          id: input.sessionId,
          user_id: input.userId,
          browser,
          device,
          os,
          ip_address: input.ip,
          login_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          status: 'active',
        });
        await this.db.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', input.userId);
        await this.registerTrustedDevice(input.userId, input.userAgent, device, input.ip);
        await this.notifications.notifySecurityEvent(
          input.userId,
          'login_new',
          `Login dari ${device} (${browser}) IP ${input.ip ?? '-'}`,
        );
      }
    }
  }

  private async registerTrustedDevice(userId: string, userAgent?: string, deviceType?: string, ip?: string) {
    if (!this.db) return;
    const ua = userAgent ?? 'unknown';
    const fingerprint = createHash('sha256').update(`${userId}:${ua}`).digest('hex').slice(0, 32);
    const { data: existing } = await this.db
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (existing) {
      await this.db.from('trusted_devices').update({ last_used_at: new Date().toISOString() }).eq('id', existing.id);
      return;
    }

    await this.db.from('trusted_devices').insert({
      user_id: userId,
      device_name: `${deviceType ?? 'Device'} — ${parseBrowser(userAgent)}`,
      device_type: deviceType ?? 'Desktop',
      fingerprint,
    });
    await this.notifications.notifySecurityEvent(
      userId,
      'new_device',
      `Perangkat baru terdeteksi (${deviceType}) IP ${ip ?? '-'}`,
    );
  }

  async getDashboard() {
    const users = await this.listUsers();
    const sessions = (await this.getSessions()).filter((s) => s.status === 'active');
    const logins = await this.getLoginHistory(200);
    const failed = logins.filter((l) => !l.success).length;
    const locked = users.filter((u) => u.status === 'locked').length;
    const mfa = users.filter((u) => u.mfaEnabled).length;
    let apiCalls = 0;
    if (this.db) {
      const { count } = await this.db.from('api_keys').select('*', { count: 'exact', head: true });
      apiCalls = count ?? 0;
    }

    return {
      totalUsers: users.length,
      onlineUsers: sessions.length,
      offlineUsers: Math.max(0, users.length - sessions.length),
      lockedAccounts: locked,
      failedLogin: failed,
      mfaEnabled: mfa,
      expiredPassword: 0,
      activeSessions: sessions.length,
      apiCalls,
      securityScore: Math.max(60, 100 - failed * 2 - locked * 5),
      backupStatus: 'OK',
      systemHealth: this.supabase.isConnected() ? 'Healthy' : 'Degraded',
    };
  }

  async listUsers() {
    if (!this.db) return [];
    const { data } = await this.db.from('profiles').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    return (data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      username: p.username ?? p.email?.split('@')[0],
      employeeId: p.employee_id,
      role: p.role,
      status: p.status ?? 'active',
      mfaEnabled: p.mfa_enabled ?? false,
      dataScope: p.data_scope,
      scopeRegion: p.scope_region,
      canRevealPii: p.can_reveal_pii ?? false,
      avatarUrl: p.avatar_url,
      lastLogin: p.last_login_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  async updateUser(id: string, patch: Record<string, unknown>, actorId: string) {
    if (!this.db) throw new Error('DB offline');
    const map: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (patch.fullName) map.full_name = patch.fullName;
    if (patch.role) map.role = patch.role;
    if (patch.status) map.status = patch.status;
    if (patch.mfaEnabled != null) map.mfa_enabled = patch.mfaEnabled;
    if (patch.dataScope) map.data_scope = patch.dataScope;
    if (patch.scopeRegion != null) map.scope_region = patch.scopeRegion;
    if (patch.canRevealPii != null) map.can_reveal_pii = patch.canRevealPii;
    const { data, error } = await this.db.from('profiles').update(map).eq('id', id).select().single();
    if (error) throw error;
    await this.logAudit({ userId: actorId, action: 'user.update', entityType: 'user', entityId: id, newData: patch });
    return data;
  }

  async getRoles() {
    if (!this.db) return [];
    const { data } = await this.db.from('security_roles').select('*').order('name');
    return (data ?? []).map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      isSystem: r.is_system,
    }));
  }

  async getPermissions() {
    if (!this.db) return [];
    const { data } = await this.db.from('permissions').select('*').order('module');
    return (data ?? []).map((p) => ({
      code: p.code,
      module: p.module,
      action: p.action,
      description: p.description,
    }));
  }

  async getRoleMatrix(roleSlug: string) {
    const slug = roleSlug === 'admin' ? 'super_admin' : roleSlug;
    if (!this.db) return [];
    const { data: role } = await this.db.from('security_roles').select('id').eq('slug', slug).maybeSingle();
    if (!role) {
      const perms = await this.getPermissions();
      return perms.map((p) => ({ ...p, granted: false }));
    }
    const { data: links } = await this.db.from('role_permissions').select('permission_id').eq('role_id', role.id);
    const grantedIds = new Set((links ?? []).map((l) => l.permission_id));
    const perms = await this.getPermissions();
    const { data: permRows } = await this.db.from('permissions').select('id, code, module, action');
    const idToCode = new Map((permRows ?? []).map((p) => [p.id, p.code]));
    const grantedCodes = new Set([...grantedIds].map((id) => idToCode.get(id)).filter(Boolean));
    return perms.map((p) => ({ ...p, granted: grantedCodes.has(p.code) }));
  }

  async getUserPermissions(role: string): Promise<string[]> {
    if (role === 'admin') {
      const perms = await this.getPermissions();
      return perms.map((p) => p.code);
    }
    const matrix = await this.getRoleMatrix(roleToSecuritySlug(role));
    return matrix.filter((p) => p.granted).map((p) => p.code);
  }

  async getLoginHistory(limit = 100) {
    if (!this.db) return [];
    const { data } = await this.db.from('login_history').select('*').order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map((l) => ({
      id: l.id,
      userId: l.user_id,
      email: l.email,
      eventType: l.event_type,
      success: l.success,
      ipAddress: l.ip_address,
      browser: l.browser,
      device: l.device,
      os: l.os,
      location: l.location,
      createdAt: l.created_at,
    }));
  }

  async getSessions() {
    if (!this.db) return [];
    const { data } = await this.db.from('active_sessions').select('*').order('login_at', { ascending: false });
    return (data ?? []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ip_address,
      location: s.location,
      loginAt: s.login_at,
      lastActiveAt: s.last_active_at,
      status: s.status,
    }));
  }

  async killSession(id: string, actorId: string) {
    if (!this.db) throw new Error('DB offline');
    await this.db.from('active_sessions').update({ status: 'terminated', last_active_at: new Date().toISOString() }).eq('id', id);
    await this.db.from('security_events').insert({
      severity: 'warning',
      category: 'session',
      message: `Session ${id} terminated`,
      user_id: actorId,
    });
    return { ok: true };
  }

  async getPasswordPolicy() {
    if (!this.db) return null;
    const { data } = await this.db.from('password_policies').select('*').limit(1).maybeSingle();
    if (!data) return null;
    return {
      minLength: data.min_length,
      requireUppercase: data.require_uppercase,
      requireLowercase: data.require_lowercase,
      requireNumber: data.require_number,
      requireSymbol: data.require_symbol,
      expirationDays: data.expiration_days,
      historyCount: data.history_count,
      lockoutAttempts: data.lockout_attempts,
      sessionTimeoutMinutes: data.session_timeout_minutes,
    };
  }

  async updatePasswordPolicy(patch: Record<string, unknown>, actorId: string) {
    if (!this.db) throw new Error('DB offline');
    const map: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.minLength != null) map.min_length = patch.minLength;
    if (patch.requireUppercase != null) map.require_uppercase = patch.requireUppercase;
    if (patch.requireLowercase != null) map.require_lowercase = patch.requireLowercase;
    if (patch.requireNumber != null) map.require_number = patch.requireNumber;
    if (patch.requireSymbol != null) map.require_symbol = patch.requireSymbol;
    if (patch.expirationDays != null) map.expiration_days = patch.expirationDays;
    if (patch.historyCount != null) map.history_count = patch.historyCount;
    if (patch.lockoutAttempts != null) map.lockout_attempts = patch.lockoutAttempts;
    if (patch.sessionTimeoutMinutes != null) map.session_timeout_minutes = patch.sessionTimeoutMinutes;
    const { data: existing } = await this.db.from('password_policies').select('id').limit(1).maybeSingle();
    if (existing) {
      await this.db.from('password_policies').update(map).eq('id', existing.id);
    } else {
      await this.db.from('password_policies').insert(map);
    }
    await this.db.from('security_events').insert({
      severity: 'information',
      category: 'policy',
      message: 'Password policy updated',
      user_id: actorId,
    });
    return this.getPasswordPolicy();
  }

  async getSecurityCenter() {
    const logins = await this.getLoginHistory(50);
    const users = await this.listUsers();
    let events: unknown[] = [];
    if (this.db) {
      const { data } = await this.db.from('security_events').select('*').order('created_at', { ascending: false }).limit(20);
      events = (data ?? []).map((e) => ({
        id: e.id,
        severity: e.severity,
        category: e.category,
        message: e.message,
        createdAt: e.created_at,
      }));
    }
    const failed = logins.filter((l) => !l.success).length;
    return {
      securityScore: Math.max(70, 100 - failed * 3),
      suspiciousLogin: logins.filter((l) => !l.success).slice(0, 5),
      failedLogin: failed,
      expiredPassword: 0,
      inactiveUser: users.filter((u) => !u.lastLogin).length,
      lockedUser: users.filter((u) => u.status === 'locked').length,
      blockedIp: 0,
      apiAbuse: 0,
      expiredToken: 0,
      events,
    };
  }

  async getAuditTrail(limit = 100) {
    if (this.db) {
      const { data } = await this.db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (data?.length) {
        return data.map((a) => ({
          id: a.id,
          userId: a.user_id,
          action: a.action,
          entityType: a.entity_type,
          entityId: a.entity_id,
          oldValue: a.old_data,
          newValue: a.new_data,
          ip: a.ip_address,
          browser: a.browser,
          device: a.device,
          createdAt: a.created_at,
        }));
      }
    }
    return listAudit();
  }

  async getOrganizations() {
    if (!this.db) return [];
    const { data } = await this.db.from('organizations').select('*').is('deleted_at', null).order('name');
    return (data ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      code: o.code,
      level: o.level,
      timezone: o.timezone,
      region: o.region,
      brandColor: o.brand_color,
    }));
  }

  async getDepartments() {
    if (!this.db) return [];
    const { data } = await this.db.from('departments').select('*').is('deleted_at', null).order('name');
    return (data ?? []).map((d) => ({ id: d.id, name: d.name, code: d.code, organizationId: d.organization_id }));
  }

  async getUserGroups() {
    if (!this.db) return [];
    const { data } = await this.db.from('user_groups').select('*').order('name');
    return (data ?? []).map((g) => ({ id: g.id, name: g.name, slug: g.slug, description: g.description }));
  }

  getSystemHealth() {
    return {
      cpu: 24,
      ram: 58,
      storage: 42,
      database: this.supabase.isConnected() ? 'Connected' : 'Offline',
      api: 'OK',
      supabase: this.supabase.isConnected() ? 'OK' : 'Offline',
      realtime: 'OK',
      scheduler: 'OK',
    };
  }

  async getApiKeys() {
    if (!this.db) return [];
    const { data } = await this.db.from('api_keys').select('id, name, key_prefix, rate_limit, expires_at, created_at, revoked_at').is('revoked_at', null).order('created_at', { ascending: false });
    return (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      rateLimit: k.rate_limit,
      expiresAt: k.expires_at,
      createdAt: k.created_at,
    }));
  }

  async createApiKey(name: string, actorId: string, rateLimit = 1000, expiresDays = 365) {
    if (!this.db) throw new Error('DB offline');
    const rawKey = `ei_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);
    const expiresAt = new Date(Date.now() + expiresDays * 86400000).toISOString();
    const { data, error } = await this.db.from('api_keys').insert({
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      rate_limit: rateLimit,
      expires_at: expiresAt,
      created_by: actorId,
    }).select().single();
    if (error) throw error;
    await this.logAudit({ userId: actorId, action: 'api_key.create', entityType: 'api_key', entityId: data.id, newData: { name } });
    return { id: data.id, name, key: rawKey, keyPrefix, expiresAt, rateLimit };
  }

  async revokeApiKey(id: string, actorId: string) {
    if (!this.db) throw new Error('DB offline');
    await this.db.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id);
    await this.logAudit({ userId: actorId, action: 'api_key.revoke', entityType: 'api_key', entityId: id });
    return { ok: true };
  }

  async getBackups() {
    if (!this.db) return [];
    const { data } = await this.db.from('backups').select('*').order('created_at', { ascending: false }).limit(20);
    return (data ?? []).map((b) => ({
      id: b.id,
      backupType: b.backup_type,
      status: b.status,
      sizeKb: b.size_kb,
      createdAt: b.created_at,
    }));
  }

  async getDataRetention() {
    if (!this.db) return [];
    const { data } = await this.db.from('data_retention').select('*').order('resource');
    return (data ?? []).map((r) => ({ resource: r.resource, retentionDays: r.retention_days }));
  }

  async getConfig() {
    if (!this.db) {
      return { general: { appName: 'e-Insight DSS' } };
    }
    const { data } = await this.db.from('system_config').select('*');
    const out: Record<string, unknown> = {
      general: { appName: 'e-Insight DSS', timezone: 'Asia/Jakarta', language: 'id' },
      email: { smtpHost: '', smtpPort: 587 },
      theme: { primaryColor: '#1e40af' },
    };
    for (const row of data ?? []) {
      out[row.key] = row.value;
    }
    return out;
  }

  async getTrustedDevices(userId?: string) {
    if (!this.db) return [];
    let q = this.db.from('trusted_devices').select('*').order('last_used_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return (data ?? []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      deviceName: d.device_name,
      deviceType: d.device_type,
      lastUsedAt: d.last_used_at,
    }));
  }

  async logPiiReveal(userId: string, caseId: string, field: string, ip?: string) {
    await this.logAudit({
      userId,
      action: 'pii.reveal',
      entityType: 'case',
      entityId: caseId,
      newData: { field },
      ip,
    });
  }

  async globalSearch(q: string) {
    const term = q.trim().toLowerCase();
    if (!term || !this.db) {
      return { users: [], roles: [], permissions: [], audit: [], sessions: [], organizations: [] };
    }

    const [users, roles, permissions, audit, sessions, organizations] = await Promise.all([
      this.db.from('profiles').select('id, email, full_name, role').or(`email.ilike.%${term}%,full_name.ilike.%${term}%`).limit(8),
      this.db.from('security_roles').select('slug, name, description').or(`name.ilike.%${term}%,slug.ilike.%${term}%`).limit(8),
      this.db.from('permissions').select('code, module, action').or(`code.ilike.%${term}%,module.ilike.%${term}%`).limit(8),
      this.db.from('audit_logs').select('id, action, entity_type, created_at').ilike('action', `%${term}%`).limit(8),
      this.db.from('active_sessions').select('id, user_id, device, browser, status').or(`device.ilike.%${term}%,browser.ilike.%${term}%`).limit(8),
      this.db.from('organizations').select('id, name, code').or(`name.ilike.%${term}%,code.ilike.%${term}%`).limit(8),
    ]);

    return {
      users: (users.data ?? []).map((u) => ({ id: u.id, label: u.full_name, sub: u.email, type: 'user' })),
      roles: (roles.data ?? []).map((r) => ({ id: r.slug, label: r.name, sub: r.slug, type: 'role' })),
      permissions: (permissions.data ?? []).map((p) => ({ id: p.code, label: p.code, sub: p.module, type: 'permission' })),
      audit: (audit.data ?? []).map((a) => ({ id: a.id, label: a.action, sub: a.entity_type, type: 'audit' })),
      sessions: (sessions.data ?? []).map((s) => ({ id: s.id, label: s.device, sub: s.browser, type: 'session' })),
      organizations: (organizations.data ?? []).map((o) => ({ id: o.id, label: o.name, sub: o.code, type: 'organization' })),
    };
  }

  async removeTrustedDevice(id: string, userId: string, actorRole?: string) {
    if (!this.db) throw new Error('DB offline');
    let q = this.db.from('trusted_devices').delete().eq('id', id);
    if (actorRole !== 'admin') q = q.eq('user_id', userId);
    await q;
    return { ok: true };
  }
}

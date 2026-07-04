import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read<T>(file: string, fallback: T): T {
  ensureDir();
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
}

function write<T>(file: string, data: T) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

export interface LoginEvent {
  id: string;
  userId?: string;
  email?: string;
  eventType: string;
  success: boolean;
  ipAddress?: string;
  browser?: string;
  device?: string;
  os?: string;
  location?: string;
  createdAt: string;
}

export interface SessionRow {
  id: string;
  userId: string;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  loginAt: string;
  lastActiveAt: string;
  status: string;
}

export function listLoginHistory(limit = 100) {
  return read<LoginEvent[]>('security-login-history.json', [])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function addLoginEvent(row: LoginEvent) {
  const list = read<LoginEvent[]>('security-login-history.json', []);
  list.unshift(row);
  write('security-login-history.json', list.slice(0, 500));
}

export function listSessions() {
  return read<SessionRow[]>('security-sessions.json', []);
}

export function upsertSession(row: SessionRow) {
  const list = listSessions().filter((s) => s.id !== row.id);
  list.unshift(row);
  write('security-sessions.json', list.slice(0, 200));
}

export function terminateSession(id: string) {
  write('security-sessions.json', listSessions().map((s) =>
    s.id === id ? { ...s, status: 'terminated' } : s,
  ));
}

export function getPasswordPolicy() {
  return read('security-password-policy.json', {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    expirationDays: 90,
    historyCount: 5,
    lockoutAttempts: 5,
    sessionTimeoutMinutes: 480,
  });
}

export function savePasswordPolicy(policy: Record<string, unknown>) {
  write('security-password-policy.json', { ...getPasswordPolicy(), ...policy, updatedAt: new Date().toISOString() });
  return getPasswordPolicy();
}

export function listSecurityEvents(limit = 50) {
  return read<{ id: string; severity: string; category: string; message: string; createdAt: string }[]>(
    'security-events.json', [],
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function addSecurityEvent(input: { severity: string; category: string; message: string; userId?: string }) {
  const list = read<{ id: string; severity: string; category: string; message: string; createdAt: string }[]>('security-events.json', []);
  list.unshift({ id: `SEC-${Date.now().toString(36)}`, ...input, createdAt: new Date().toISOString() });
  write('security-events.json', list.slice(0, 300));
}

import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomBytes } from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function filePath(name: string) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf-8');
  return p;
}

function readJson<T>(name: string): T[] {
  return JSON.parse(fs.readFileSync(filePath(name), 'utf-8')) as T[];
}

function writeJson<T>(name: string, data: T[]) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf-8');
}

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly';
  category: string;
  format: string;
  email: string;
  filters: Record<string, string>;
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReportLayout {
  id: string;
  name: string;
  widgets: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  version: string;
  snapshot: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  note?: string;
}

export interface ApprovalRecord {
  reportId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  reviewer: string | null;
  reviewedAt: string | null;
  note: string;
  history: { status: string; by: string; at: string; note?: string }[];
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  reportId?: string;
  format?: string;
  at: string;
  detail?: string;
}

export interface ShareLink {
  id: string;
  token: string;
  reportId: string;
  passwordHash?: string;
  permission: 'read' | 'edit';
  watermark: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  accessCount: number;
}

export interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

export function listSchedules() {
  return readJson<ReportSchedule>('report-schedules.json').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveSchedule(item: ReportSchedule) {
  const list = listSchedules().filter((s) => s.id !== item.id);
  list.unshift(item);
  writeJson('report-schedules.json', list.slice(0, 100));
  return item;
}

export function deleteSchedule(id: string) {
  writeJson('report-schedules.json', listSchedules().filter((s) => s.id !== id));
}

export function listLayouts() {
  return readJson<ReportLayout>('report-layouts.json');
}

export function saveLayout(item: ReportLayout) {
  const list = listLayouts().filter((l) => l.id !== item.id);
  list.unshift(item);
  writeJson('report-layouts.json', list.slice(0, 50));
  return item;
}

export function listVersions(reportId: string) {
  return readJson<ReportVersion>('report-versions.json').filter((v) => v.reportId === reportId);
}

export function saveVersion(item: ReportVersion) {
  const all = readJson<ReportVersion>('report-versions.json');
  all.unshift(item);
  writeJson('report-versions.json', all.slice(0, 300));
  return item;
}

export function getApproval(reportId: string): ApprovalRecord {
  const list = readJson<ApprovalRecord>('report-approvals.json');
  return list.find((a) => a.reportId === reportId) ?? {
    reportId,
    status: 'draft',
    reviewer: null,
    reviewedAt: null,
    note: '',
    history: [],
  };
}

export function saveApproval(record: ApprovalRecord) {
  const list = readJson<ApprovalRecord>('report-approvals.json').filter((a) => a.reportId !== record.reportId);
  list.unshift(record);
  writeJson('report-approvals.json', list.slice(0, 200));
  return record;
}

export function listAudit(limit = 100) {
  return readJson<AuditEntry>('report-audit.json').sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function addAudit(entry: Omit<AuditEntry, 'id'>) {
  const item: AuditEntry = { ...entry, id: `AUD-${Date.now().toString(36)}` };
  const list = readJson<AuditEntry>('report-audit.json');
  list.unshift(item);
  writeJson('report-audit.json', list.slice(0, 500));
  return item;
}

export function createShareLink(input: Omit<ShareLink, 'id' | 'token' | 'createdAt' | 'accessCount'>) {
  const item: ShareLink = {
    ...input,
    id: `SHR-${Date.now().toString(36)}`,
    token: randomBytes(16).toString('hex'),
    createdAt: new Date().toISOString(),
    accessCount: 0,
  };
  const list = readJson<ShareLink>('report-shares.json');
  list.unshift(item);
  writeJson('report-shares.json', list.slice(0, 100));
  return item;
}

export function getShareByToken(token: string) {
  return readJson<ShareLink>('report-shares.json').find((s) => s.token === token);
}

export function bumpShareAccess(token: string) {
  const list = readJson<ShareLink>('report-shares.json');
  const idx = list.findIndex((s) => s.token === token);
  if (idx >= 0) {
    list[idx].accessCount++;
    writeJson('report-shares.json', list);
    return list[idx];
  }
  return null;
}

export function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export function queueEmail(item: Omit<EmailQueueItem, 'id' | 'status' | 'createdAt'>) {
  const email: EmailQueueItem = {
    ...item,
    id: `EML-${Date.now().toString(36)}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  const list = readJson<EmailQueueItem>('report-email-queue.json');
  list.unshift(email);
  writeJson('report-email-queue.json', list.slice(0, 200));
  return email;
}

export function listEmailQueue() {
  return readJson<EmailQueueItem>('report-email-queue.json').slice(0, 50);
}

export function calcNextRun(frequency: ReportSchedule['frequency']) {
  const d = new Date();
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (frequency === 'semester') d.setMonth(d.getMonth() + 6);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

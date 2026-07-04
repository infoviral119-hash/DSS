import * as fs from 'fs';
import * as path from 'path';

export interface ReportHistoryEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  category: string;
  format: string;
  period: string;
  sizeKb: number;
  version: string;
  status: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'report-history.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');
}

export function listReportHistory(limit = 50): ReportHistoryEntry[] {
  ensureFile();
  const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')) as ReportHistoryEntry[];
  return raw.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function addReportHistory(entry: ReportHistoryEntry) {
  ensureFile();
  const list = listReportHistory(500);
  list.unshift(entry);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(list.slice(0, 200), null, 2), 'utf-8');
  return entry;
}

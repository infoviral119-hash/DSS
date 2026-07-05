import * as fs from 'fs';
import * as path from 'path';

function readFileSafe(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function extractJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function extractTokens(content: string): string[] {
  return content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
}

function extractUrl(content: string): string {
  const match = content.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
  return match?.[0] ?? '';
}

function jwtRef(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

type CredentialSet = {
  ref: string;
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  databaseUrl: string;
  sourceFile: string;
  priority: number;
};

function parseFileCredentials(file: string, content: string): CredentialSet | null {
  const url = extractUrl(content).replace(/\/rest\/v1\/?$/, '');
  let anonKey = '';
  let serviceRoleKey = '';
  let databaseUrl = '';

  const serviceMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
  const serviceVal = serviceMatch?.[1]?.trim();
  if (serviceVal?.startsWith('eyJ')) serviceRoleKey = serviceVal;

  const dbMatch = content.match(/DATABASE_URL=([^\r\n]+)/);
  const dbVal = dbMatch?.[1]?.trim();
  if (dbVal) databaseUrl = dbVal;

  for (const token of extractTokens(content)) {
    const role = extractJwtRole(token);
    if (role === 'service_role') serviceRoleKey = token;
    if (role === 'anon') anonKey = token;
  }

  const ref = jwtRef(anonKey) ?? jwtRef(serviceRoleKey) ?? (url ? url.split('.')[0].replace('https://', '') : null);
  if (!ref || !url) return null;

  const urlRef = url.replace('https://', '').replace('.supabase.co', '');
  if (urlRef !== ref && anonKey && jwtRef(anonKey) !== urlRef) return null;

  const priority =
    /dss_project_new|project_new|new\.env/i.test(file) ? 100 : file.toLowerCase() === 'api url.env' ? 50 : 10;

  return {
    ref: urlRef,
    url: `https://${urlRef}.supabase.co`,
    anonKey: jwtRef(anonKey) === urlRef ? anonKey : '',
    serviceRoleKey: jwtRef(serviceRoleKey) === urlRef ? serviceRoleKey : '',
    databaseUrl,
    sourceFile: file,
    priority,
  };
}

function pickBestCredentials(sets: CredentialSet[]): CredentialSet | null {
  const byRef = new Map<string, CredentialSet>();
  for (const set of sets) {
    const existing = byRef.get(set.ref);
    if (!existing || set.priority > existing.priority) {
      byRef.set(set.ref, set);
    } else if (set.priority === existing.priority) {
      byRef.set(set.ref, {
        ...existing,
        anonKey: set.anonKey || existing.anonKey,
        serviceRoleKey: set.serviceRoleKey || existing.serviceRoleKey,
        databaseUrl: set.databaseUrl || existing.databaseUrl,
      });
    }
  }

  const merged = [...byRef.values()].map((set) => {
    for (const other of sets) {
      if (other.ref !== set.ref) continue;
      if (!set.anonKey && other.anonKey && jwtRef(other.anonKey) === set.ref) set.anonKey = other.anonKey;
      if (!set.serviceRoleKey && other.serviceRoleKey && jwtRef(other.serviceRoleKey) === set.ref) {
        set.serviceRoleKey = other.serviceRoleKey;
      }
      if (!set.databaseUrl && other.databaseUrl) set.databaseUrl = other.databaseUrl;
    }
    return set;
  });

  merged.sort((a, b) => {
    const score = (s: CredentialSet) =>
      s.priority + (s.serviceRoleKey ? 20 : 0) + (s.anonKey ? 10 : 0) + (s.databaseUrl ? 5 : 0);
    return score(b) - score(a);
  });

  return merged[0] ?? null;
}

export function loadEnvFromFolder(rootDir?: string): Record<string, string> {
  const root = rootDir ?? path.resolve(process.cwd(), '..');
  const files = fs.readdirSync(root).filter((f) => f.toLowerCase().includes('env') && !f.startsWith('.'));

  const sets: CredentialSet[] = [];
  for (const file of files) {
    const content = readFileSafe(path.join(root, file));
    if (!content) continue;
    const parsed = parseFileCredentials(file, content);
    if (parsed) sets.push(parsed);
  }

  const best = pickBestCredentials(sets);
  const result: Record<string, string> = {};

  if (best) {
    result.SUPABASE_URL = best.url;
    result.VITE_SUPABASE_URL = best.url;
    if (best.anonKey) {
      result.SUPABASE_ANON_KEY = best.anonKey;
      result.VITE_SUPABASE_ANON_KEY = best.anonKey;
    }
    if (best.serviceRoleKey) result.SUPABASE_SERVICE_ROLE_KEY = best.serviceRoleKey;
    if (best.databaseUrl) result.DATABASE_URL = best.databaseUrl;
    result.SUPABASE_PROJECT_REF = best.ref;
    console.log(`Env loaded from folder: ${best.ref} (${best.sourceFile})`);
  }

  for (const file of files) {
    const content = readFileSafe(path.join(root, file));
    for (const line of content.split('\n')) {
      const m = line.match(/^(POWER_BI_[A-Z_]+|POWERBI_EMBED_URL|METABASE_[A-Z_]+|DATABASE_URL)=(.*)$/);
      if (m) result[m[1]] = m[2].trim();
    }
    if (/passupabase/i.test(file) && content.trim() && !content.includes('=')) {
      result.DATABASE_PASSWORD = content.trim();
      result.DATABASE_URL = `postgresql://postgres:${content.trim()}@db.vnfndvbxhvpikjxvnkmc.supabase.co:5432/postgres`;
    }
  }

  for (const [key, value] of Object.entries(result)) {
    process.env[key] = value;
  }

  return result;
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!content.trim()) return result;

  const normalized = content.includes('\n')
    ? content
    : content.replace(
        /(SUPABASE_|VITE_|POWER_BI_|POWERBI_|DATABASE_|PORT|JWT_|CORS_)/g,
        '\n$1',
      );

  for (const line of normalized.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

function writeEnvFile(filePath: string, keys: string[], loaded: Record<string, string>) {
  const existing = parseEnvFile(readFileSafe(filePath));
  const merged = { ...existing, ...loaded };
  const lines = keys.filter((k) => merged[k] !== undefined).map((k) => `${k}=${merged[k]}`);
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

export function syncEnvFromFolder(rootDir?: string): Record<string, string> {
  const loaded = loadEnvFromFolder(rootDir);
  const root = rootDir ?? path.resolve(process.cwd(), '..');

  const backendKeys = [
    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL',
    'POWER_BI_CLIENT_ID', 'POWER_BI_CLIENT_SECRET', 'POWER_BI_TENANT_ID',
    'POWER_BI_WORKSPACE_ID', 'POWER_BI_REPORT_ID', 'POWERBI_EMBED_URL',
    'METABASE_DASHBOARD_URL', 'METABASE_PUBLIC_URL',
    'PORT', 'JWT_SECRET', 'CORS_ORIGIN',
  ];
  const frontendKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_URL'];
  const rootKeys = [...new Set([...backendKeys, ...frontendKeys])];

  writeEnvFile(path.join(root, '.env'), rootKeys, loaded);
  writeEnvFile(path.join(root, 'backend', '.env'), backendKeys, loaded);
  writeEnvFile(path.join(root, 'frontend', '.env'), frontendKeys, { ...loaded, VITE_API_URL: loaded.VITE_API_URL ?? '' });

  return loaded;
}

export function getSupabaseProjectRef(): string {
  const url = process.env.SUPABASE_URL ?? '';
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return match?.[1] ?? process.env.SUPABASE_PROJECT_REF ?? '';
}

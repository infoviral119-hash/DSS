export const BACKUP_TARGETS = [
  { id: 'entire_database', label: 'Entire Database', tables: ['cases', 'profiles', 'case_attachments', 'import_batches', 'import_batch_cases', 'audit_logs', 'ai_insights', 'forecasts'] },
  { id: 'master_data', label: 'Master Data', tables: ['organizations', 'departments', 'user_groups', 'user_group_members', 'system_config', 'data_retention'] },
  { id: 'users', label: 'Users', tables: ['profiles'] },
  { id: 'roles', label: 'Roles', tables: ['security_roles', 'permissions', 'role_permissions'] },
  { id: 'audit_logs', label: 'Audit Logs', tables: ['audit_logs', 'login_history', 'security_events'] },
  { id: 'configurations', label: 'Configurations', tables: ['system_config', 'password_policies'] },
  { id: 'attachments', label: 'Attachments', tables: ['case_attachments'] },
  { id: 'ai_insight', label: 'AI Insight Cache', tables: ['ai_insights'] },
  { id: 'forecast_models', label: 'Forecast Models', tables: ['forecasts'] },
] as const;

export const BACKUP_TYPES = ['full', 'incremental', 'differential', 'snapshot', 'archive'] as const;

export const REPO_TYPES = [
  'local_disk', 'supabase_storage', 'nas', 'ftp', 'sftp',
  'aws_s3', 'azure_blob', 'gcs', 'minio', 'external_drive',
] as const;

export const APP_VERSION = '1.0.0';

export function resolveTables(targets: string[]): string[] {
  const set = new Set<string>();
  for (const t of targets) {
    const found = BACKUP_TARGETS.find((x) => x.id === t);
    if (found) found.tables.forEach((tbl) => set.add(tbl));
    else if (t.match(/^[a-z_]+$/)) set.add(t);
  }
  return [...set];
}

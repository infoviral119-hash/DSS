-- e-Insight BDRC Tahap 1: Backup & Disaster Recovery Center

INSERT INTO permissions (code, module, action, description) VALUES
  ('Backup.View', 'Backup', 'View', 'View backup dashboard'),
  ('Backup.Run', 'Backup', 'Run', 'Run manual backup'),
  ('Backup.Restore', 'Backup', 'Restore', 'Restore from recovery point'),
  ('Backup.Manage', 'Backup', 'Manage', 'Manage repositories and jobs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM security_roles r JOIN permissions p ON p.code IN ('Backup.View', 'Backup.Run', 'Backup.Restore', 'Backup.Manage')
WHERE r.slug IN ('super_admin', 'system_admin', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM security_roles r JOIN permissions p ON p.code IN ('Backup.View', 'Backup.Run')
WHERE r.slug = 'supervisor'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM security_roles r JOIN permissions p ON p.code = 'Backup.View'
WHERE r.slug IN ('operator', 'auditor')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup_repository (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  repo_type TEXT NOT NULL DEFAULT 'local_disk',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  capacity_gb NUMERIC(12,2) DEFAULT 100,
  used_bytes BIGINT DEFAULT 0,
  encryption_enabled BOOLEAN NOT NULL DEFAULT true,
  compression_level TEXT NOT NULL DEFAULT 'balanced',
  status TEXT NOT NULL DEFAULT 'online',
  latency_ms INT DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'full',
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  repository_id UUID REFERENCES backup_repository(id),
  compression TEXT NOT NULL DEFAULT 'balanced',
  encryption_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily',
  cron_expression TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  retry_count INT NOT NULL DEFAULT 3,
  timeout_minutes INT NOT NULL DEFAULT 120,
  auto_verify BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_retention (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Default',
  daily_days INT NOT NULL DEFAULT 30,
  weekly_weeks INT NOT NULL DEFAULT 12,
  monthly_months INT NOT NULL DEFAULT 24,
  archive_years INT NOT NULL DEFAULT 7,
  auto_delete BOOLEAN NOT NULL DEFAULT true,
  auto_archive BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recovery_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  repository_id UUID REFERENCES backup_repository(id),
  backup_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  encryption TEXT NOT NULL DEFAULT 'AES-256',
  compression TEXT NOT NULL DEFAULT 'gzip',
  backup_size_bytes BIGINT NOT NULL DEFAULT 0,
  db_version TEXT,
  app_version TEXT DEFAULT '1.0.0',
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'available',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  recovery_point_id UUID REFERENCES recovery_points(id) ON DELETE SET NULL,
  repository_id UUID REFERENCES backup_repository(id),
  backup_type TEXT NOT NULL,
  duration_ms INT DEFAULT 0,
  backup_size_bytes BIGINT DEFAULT 0,
  compression_ratio NUMERIC(6,2) DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS restore_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recovery_point_id UUID REFERENCES recovery_points(id),
  restore_type TEXT NOT NULL DEFAULT 'full',
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT,
  duration_ms INT DEFAULT 0,
  affected_records INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  recovery_point_id UUID REFERENCES recovery_points(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'info',
  stage TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  health_score INT NOT NULL DEFAULT 100,
  health_label TEXT NOT NULL DEFAULT 'Excellent',
  last_backup_at TIMESTAMPTZ,
  next_backup_at TIMESTAMPTZ,
  recovery_point_count INT DEFAULT 0,
  failed_jobs_24h INT DEFAULT 0,
  running_jobs INT DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_capacity_bytes BIGINT DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recovery_point_id UUID REFERENCES recovery_points(id) ON DELETE CASCADE,
  checksum_ok BOOLEAN,
  file_ok BOOLEAN,
  restore_test_ok BOOLEAN,
  integrity_ok BOOLEAN,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disaster_recovery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_db TEXT NOT NULL DEFAULT 'Supabase PostgreSQL',
  secondary_db TEXT,
  standby_server TEXT,
  replication_status TEXT NOT NULL DEFAULT 'not_configured',
  recovery_readiness TEXT NOT NULL DEFAULT 'partial',
  last_failover_test TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_policy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backup_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  channels JSONB NOT NULL DEFAULT '["email"]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(last_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recovery_points_created ON recovery_points(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restore_history_created ON restore_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_job ON backup_logs(job_id, created_at DESC);

INSERT INTO backup_repository (name, repo_type, capacity_gb, is_default, status, config)
SELECT 'Local Disk Primary', 'local_disk', 100, true, 'online', '{"path":"storage/backups"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM backup_repository WHERE is_default = true AND deleted_at IS NULL);

INSERT INTO backup_retention (name, daily_days, weekly_weeks, monthly_months, archive_years)
SELECT 'Default Retention', 30, 12, 24, 7
WHERE NOT EXISTS (SELECT 1 FROM backup_retention WHERE is_active = true AND deleted_at IS NULL);

INSERT INTO backup_configuration (key, value) VALUES
  ('encryption', '{"algorithm":"AES-256","enabled":true}'::jsonb),
  ('compression', '{"default":"balanced"}'::jsonb),
  ('app_version', '"1.0.0"'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO disaster_recovery (primary_db, replication_status, recovery_readiness)
SELECT 'Supabase PostgreSQL', 'not_configured', 'partial'
WHERE NOT EXISTS (SELECT 1 FROM disaster_recovery LIMIT 1);

INSERT INTO backup_health (health_score, health_label, storage_capacity_bytes)
SELECT 100, 'Excellent', 107374182400
WHERE NOT EXISTS (SELECT 1 FROM backup_health LIMIT 1);

ALTER TABLE backup_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bdrc_admin_all" ON backup_repository;
CREATE POLICY "bdrc_admin_all" ON backup_repository FOR ALL
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor','auditor'))
  WITH CHECK (public.current_profile_role() IN ('admin','super_admin','system_admin'));

DROP POLICY IF EXISTS "bdrc_jobs_admin" ON backup_jobs;
CREATE POLICY "bdrc_jobs_admin" ON backup_jobs FOR ALL
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor','auditor'))
  WITH CHECK (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor'));

DROP POLICY IF EXISTS "bdrc_rp_select" ON recovery_points;
CREATE POLICY "bdrc_rp_select" ON recovery_points FOR SELECT
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor','auditor','operator'));

DROP POLICY IF EXISTS "bdrc_rp_write" ON recovery_points;
CREATE POLICY "bdrc_rp_write" ON recovery_points FOR ALL
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor'))
  WITH CHECK (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor'));

DROP POLICY IF EXISTS "bdrc_history_select" ON backup_history;
CREATE POLICY "bdrc_history_select" ON backup_history FOR SELECT
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor','auditor','operator'));

DROP POLICY IF EXISTS "bdrc_restore_select" ON restore_history;
CREATE POLICY "bdrc_restore_select" ON restore_history FOR SELECT
  USING (public.current_profile_role() IN ('admin','super_admin','system_admin','supervisor','auditor'));

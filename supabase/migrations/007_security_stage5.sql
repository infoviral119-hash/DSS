-- e-Insight Security Tahap 5: Scheduler, Notifications

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  interval_minutes INT NOT NULL DEFAULT 60,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'information',
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, created_at DESC);

INSERT INTO scheduled_jobs (name, job_type, interval_minutes, enabled) VALUES
  ('Session Cleanup', 'session_cleanup', 30, true),
  ('Retention Cleanup', 'retention_cleanup', 1440, true),
  ('Security Digest', 'security_digest', 720, true),
  ('Backup Check', 'backup_check', 360, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO system_config (key, value) VALUES
  ('email', '{"smtpHost":"","smtpPort":587,"fromName":"e-Insight DSS"}'),
  ('notifications', '{"loginAlert":true,"failedLoginAlert":true,"newDeviceAlert":true,"backupFailedAlert":true}')
ON CONFLICT (key) DO NOTHING;

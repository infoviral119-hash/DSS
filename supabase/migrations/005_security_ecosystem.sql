-- e-Insight Enterprise Security Ecosystem

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS location TEXT;

CREATE TABLE IF NOT EXISTS security_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES security_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  parent_id UUID REFERENCES organizations(id),
  level TEXT DEFAULT 'organization',
  logo_url TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  brand_color TEXT DEFAULT '#1e40af',
  language TEXT DEFAULT 'id',
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_group_members (
  group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  email TEXT,
  event_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address INET,
  browser TEXT,
  device TEXT,
  os TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  location TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT,
  fingerprint TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  severity TEXT NOT NULL DEFAULT 'information',
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_length INT NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_number BOOLEAN NOT NULL DEFAULT true,
  require_symbol BOOLEAN NOT NULL DEFAULT false,
  expiration_days INT NOT NULL DEFAULT 90,
  history_count INT NOT NULL DEFAULT 5,
  lockout_attempts INT NOT NULL DEFAULT 5,
  session_timeout_minutes INT NOT NULL DEFAULT 480,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  rate_limit INT DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_retention (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource TEXT NOT NULL UNIQUE,
  retention_days INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  size_kb INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

INSERT INTO security_roles (slug, name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full system access', true),
  ('system_admin', 'System Admin', 'System configuration', true),
  ('organization_admin', 'Organization Admin', 'Organization scope', true),
  ('supervisor', 'Supervisor', 'Supervisory access', true),
  ('operator', 'Operator', 'Operational access', true),
  ('analyst', 'Analyst', 'Analytics access', true),
  ('auditor', 'Auditor', 'Read-only audit', true),
  ('executive', 'Executive', 'Executive dashboard', true),
  ('guest', 'Guest', 'Limited guest access', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO permissions (code, module, action, description) VALUES
  ('Dashboard.View', 'Dashboard', 'View', 'View dashboard'),
  ('Dashboard.Export', 'Dashboard', 'Export', 'Export dashboard'),
  ('Analytics.View', 'Analytics', 'View', 'View analytics'),
  ('Analytics.Export', 'Analytics', 'Export', 'Export analytics'),
  ('Forecast.Run', 'Forecast', 'Run', 'Run forecast'),
  ('Forecast.Export', 'Forecast', 'Export', 'Export forecast'),
  ('GIS.View', 'GIS', 'View', 'View GIS'),
  ('GIS.Export', 'GIS', 'Export', 'Export GIS'),
  ('Report.Publish', 'Report', 'Publish', 'Publish report'),
  ('Report.Export', 'Report', 'Export', 'Export report'),
  ('User.Create', 'User', 'Create', 'Create users'),
  ('User.Delete', 'User', 'Delete', 'Delete users'),
  ('Role.Edit', 'Role', 'Edit', 'Edit roles'),
  ('Security.View', 'Security', 'View', 'View security'),
  ('Audit.Export', 'Audit', 'Export', 'Export audit')
ON CONFLICT (code) DO NOTHING;

INSERT INTO password_policies (min_length) SELECT 8 WHERE NOT EXISTS (SELECT 1 FROM password_policies LIMIT 1);

INSERT INTO data_retention (resource, retention_days) VALUES
  ('audit_log', 730),
  ('login_history', 365),
  ('deleted_data', 90)
ON CONFLICT (resource) DO NOTHING;

INSERT INTO organizations (name, code, level) VALUES
  ('e-Insight Pusat', 'EINSIGHT', 'organization')
ON CONFLICT DO NOTHING;

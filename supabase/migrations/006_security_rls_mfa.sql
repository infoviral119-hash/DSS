-- e-Insight Security Tahap 2-4: RLS, MFA, Data Scope, Column Security

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_scope TEXT NOT NULL DEFAULT 'national';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scope_region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_reveal_pii BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS mfa_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  totp_secret TEXT,
  email_otp_enabled BOOLEAN NOT NULL DEFAULT false,
  authenticator_enabled BOOLEAN NOT NULL DEFAULT false,
  recovery_codes JSONB DEFAULT '[]'::jsonb,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  pending_email_otp TEXT,
  email_otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS column_security_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_slug TEXT NOT NULL,
  field_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_reveal BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(role_slug, field_name)
);

INSERT INTO column_security_rules (role_slug, field_name, can_view, can_reveal) VALUES
  ('operator', 'nama_korban', true, false),
  ('operator', 'alamat', false, false),
  ('operator', 'catatan', false, false),
  ('supervisor', 'nama_korban', true, true),
  ('supervisor', 'alamat', true, false),
  ('supervisor', 'catatan', true, false),
  ('admin', 'nama_korban', true, true),
  ('admin', 'alamat', true, true),
  ('admin', 'catatan', true, true),
  ('auditor', 'nama_korban', true, true),
  ('auditor', 'alamat', true, true),
  ('auditor', 'catatan', true, true)
ON CONFLICT (role_slug, field_name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM security_roles r CROSS JOIN permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM security_roles r JOIN permissions p ON p.code LIKE '%.View' OR p.code LIKE 'Audit.%'
WHERE r.slug = 'auditor'
ON CONFLICT DO NOTHING;

INSERT INTO departments (organization_id, name, code)
SELECT o.id, d.name, d.code FROM organizations o
CROSS JOIN (VALUES ('Sekretariat','SEK'),('Pendampingan','PEND'),('Psikologi','PSI'),('Hukum','HUK'),('IT','IT'),('Administrator','ADM')) AS d(name,code)
WHERE o.code = 'EINSIGHT'
  AND NOT EXISTS (SELECT 1 FROM departments dep WHERE dep.code = d.code);

INSERT INTO user_groups (name, slug) VALUES
  ('P2TP2A','p2tp2a'),('Psikolog','psikolog'),('Advokat','advokat'),
  ('Operator','operator'),('Supervisor','supervisor'),('Executive','executive')
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_data_scope()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(data_scope, 'national') FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_scope_region()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT scope_region FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.can_access_case(c_provinsi TEXT, c_kabupaten TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  scope TEXT;
  region TEXT;
  role_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN true; END IF;
  SELECT data_scope, scope_region, role::text INTO scope, region, role_name FROM profiles WHERE id = auth.uid();
  IF role_name IN ('admin','auditor','direktur','ketua_yayasan') THEN RETURN true; END IF;
  IF scope = 'national' OR scope IS NULL THEN RETURN true; END IF;
  IF scope = 'province' AND region IS NOT NULL THEN
    RETURN c_provinsi ILIKE region OR c_provinsi ILIKE '%' || region || '%';
  END IF;
  IF scope = 'city' AND region IS NOT NULL THEN
    RETURN c_kabupaten ILIKE region OR c_kabupaten ILIKE '%' || region || '%';
  END IF;
  RETURN true;
END;
$$;

ALTER TABLE security_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_admin_all" ON security_roles;
CREATE POLICY "security_admin_all" ON security_roles FOR ALL
  USING (public.current_profile_role() IN ('admin','auditor'))
  WITH CHECK (public.current_profile_role() = 'admin');

DROP POLICY IF EXISTS "permissions_read" ON permissions;
CREATE POLICY "permissions_read" ON permissions FOR SELECT
  USING (public.current_profile_role() IN ('admin','auditor','supervisor'));

DROP POLICY IF EXISTS "login_history_own_or_admin" ON login_history;
CREATE POLICY "login_history_own_or_admin" ON login_history FOR SELECT
  USING (user_id = auth.uid() OR public.current_profile_role() IN ('admin','auditor'));

DROP POLICY IF EXISTS "sessions_own_or_admin" ON active_sessions;
CREATE POLICY "sessions_own_or_admin" ON active_sessions FOR SELECT
  USING (user_id = auth.uid() OR public.current_profile_role() IN ('admin','auditor'));

DROP POLICY IF EXISTS "mfa_own_or_admin" ON mfa_settings;
CREATE POLICY "mfa_own_or_admin" ON mfa_settings FOR ALL
  USING (user_id = auth.uid() OR public.current_profile_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.current_profile_role() = 'admin');

DROP POLICY IF EXISTS "cases_row_scope" ON cases;
CREATE POLICY "cases_row_scope" ON cases FOR SELECT
  USING (public.can_access_case(provinsi, kabupaten));

DROP POLICY IF EXISTS "cases_insert_scope" ON cases;
CREATE POLICY "cases_insert_scope" ON cases FOR INSERT
  WITH CHECK (public.can_access_case(provinsi, kabupaten));

DROP POLICY IF EXISTS "cases_update_scope" ON cases;
CREATE POLICY "cases_update_scope" ON cases FOR UPDATE
  USING (public.can_access_case(provinsi, kabupaten));

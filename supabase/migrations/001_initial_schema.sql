-- e-Insight DSS — Supabase Schema v1
-- Run via Supabase SQL Editor or supabase db push

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE user_role AS ENUM (
  'admin', 'operator', 'psikolog', 'supervisor',
  'direktur', 'ketua_yayasan', 'auditor'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_register TEXT NOT NULL,
  tanggal DATE NOT NULL,
  nama_korban TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  usia INTEGER,
  pendidikan TEXT,
  pekerjaan TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  jenis_kekerasan TEXT NOT NULL,
  kategori TEXT,
  pelaku TEXT,
  hubungan_pelaku TEXT,
  psikolog_id UUID REFERENCES profiles(id),
  psikolog_nama TEXT,
  status_pendampingan TEXT DEFAULT 'Berjalan',
  tanggal_selesai DATE,
  lama_pendampingan INTEGER,
  alamat TEXT,
  rt TEXT,
  rw TEXT,
  kelurahan TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  provinsi TEXT DEFAULT 'Nusa Tenggara Barat',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  catatan TEXT,
  tahun INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM tanggal)::INTEGER) STORED,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(nomor_register, tanggal)
);

CREATE TABLE case_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  tahun INTEGER,
  total_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_report JSONB,
  column_mapping JSONB,
  imported_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

CREATE TABLE import_batch_cases (
  batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, case_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  filters JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric TEXT NOT NULL,
  horizon_months INTEGER NOT NULL,
  predictions JSONB NOT NULL,
  filters JSONB,
  model TEXT DEFAULT 'prophet',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cases_tanggal ON cases(tanggal);
CREATE INDEX idx_cases_tahun ON cases(tahun);
CREATE INDEX idx_cases_kabupaten ON cases(kabupaten);
CREATE INDEX idx_cases_kecamatan ON cases(kecamatan);
CREATE INDEX idx_cases_jenis_kekerasan ON cases(jenis_kekerasan);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_location ON cases USING GIST(location);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_location_from_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_location
  BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_location_from_coords();

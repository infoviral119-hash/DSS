-- e-Insight Case Management Tahap 1

CREATE TABLE IF NOT EXISTS case_saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  visible_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_tag (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, tag)
);

CREATE TABLE IF NOT EXISTS case_export_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  row_count INT DEFAULT 0,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_saved_filters_user ON case_saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_case ON case_timeline(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_tag_case ON case_tag(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_created ON case_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_search ON cases USING gin(
  to_tsvector('simple',
    coalesce(nomor_register,'') || ' ' ||
    coalesce(nama_korban,'') || ' ' ||
    coalesce(alamat,'') || ' ' ||
    coalesce(psikolog_nama,'') || ' ' ||
    coalesce(kabupaten,'') || ' ' ||
    coalesce(kecamatan,'') || ' ' ||
    coalesce(catatan,'')
  )
);

ALTER TABLE case_saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_filters_own" ON case_saved_filters;
CREATE POLICY "case_filters_own" ON case_saved_filters FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "case_prefs_own" ON case_user_preferences;
CREATE POLICY "case_prefs_own" ON case_user_preferences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

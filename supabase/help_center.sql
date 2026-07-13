-- e-Insight Help Center (cloud CMS)
-- Run in Supabase SQL Editor (project vnfndvbxhvpikjxvnkmc)

-- Storage bucket (create via Dashboard if SQL fails)
-- insert into storage.buckets (id, name, public) values ('help-center', 'help-center', true);

create table if not exists help_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text default 'book',
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists help_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references help_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  content text,
  thumbnail text,
  video_url text,
  attachment text,
  tags text[] default '{}',
  author text,
  version text,
  sort_order int default 0,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_tour (
  id uuid primary key default gen_random_uuid(),
  step int not null,
  target_selector text not null,
  title text not null,
  description text,
  placement text default 'bottom',
  page text default '*',
  icon text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text default 'umum',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists video_tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  thumbnail text,
  duration text,
  category text default 'umum',
  published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists release_notes (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  release_date date default current_date,
  title text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists about_application (
  id uuid primary key default gen_random_uuid(),
  application_name text default 'e-Insight',
  version text default '1.0',
  developer text,
  website text,
  email text,
  description text,
  updated_at timestamptz default now()
);

create index if not exists idx_help_articles_category on help_articles(category_id);
create index if not exists idx_help_articles_published on help_articles(published);
create index if not exists idx_product_tour_step on product_tour(step);
create index if not exists idx_faq_published on faq(published);

alter table help_categories enable row level security;
alter table help_articles enable row level security;
alter table product_tour enable row level security;
alter table faq enable row level security;
alter table video_tutorials enable row level security;
alter table release_notes enable row level security;
alter table about_application enable row level security;

drop policy if exists help_categories_read on help_categories;
create policy help_categories_read on help_categories for select to authenticated using (is_active = true);

drop policy if exists help_articles_read on help_articles;
create policy help_articles_read on help_articles for select to authenticated using (published = true);

drop policy if exists product_tour_read on product_tour;
create policy product_tour_read on product_tour for select to authenticated using (is_active = true);

drop policy if exists faq_read on faq;
create policy faq_read on faq for select to authenticated using (published = true);

drop policy if exists video_tutorials_read on video_tutorials;
create policy video_tutorials_read on video_tutorials for select to authenticated using (published = true);

drop policy if exists release_notes_read on release_notes;
create policy release_notes_read on release_notes for select to authenticated using (true);

drop policy if exists about_application_read on about_application;
create policy about_application_read on about_application for select to authenticated using (true);

-- Seed categories
insert into help_categories (name, slug, icon, sort_order) values
  ('Panduan Menu', 'panduan-menu', 'book-open', 1),
  ('FAQ', 'faq', 'help-circle', 2),
  ('Video Tutorial', 'video-tutorial', 'video', 3),
  ('Tentang', 'tentang', 'info', 4),
  ('Release Notes', 'release-notes', 'git-branch', 5)
on conflict (slug) do nothing;

-- Seed about
insert into about_application (application_name, version, developer, website, email, description)
select 'e-Insight',
  '1.0',
  '@budi, @Henokhvita',
  'https://e-insight.pages.dev',
  'infoviral119@gmail.com',
  'Integrated Violence Case Management & Decision Support System untuk SIMPATI.KK.'
where not exists (select 1 from about_application limit 1);

-- Seed product tour (skip if already seeded)
insert into product_tour (step, target_selector, title, description, placement, page)
select v.step, v.target_selector, v.title, v.description, v.placement, v.page
from (values
  (1, '[data-tour="sidebar"]', 'Navigasi Utama', 'Menu utama untuk mengakses seluruh modul e-Insight.', 'right', '*'),
  (2, '[data-tour="dashboard-kpi"]', 'Dashboard', 'Ringkasan statistik dan indikator utama kasus.', 'bottom', '/'),
  (3, '[data-tour="global-filter"]', 'Filter Global', 'Saring data berdasarkan tahun, wilayah, dan kriteria lain.', 'bottom', '*'),
  (4, '[data-tour="nav-analitik"]', 'Analitik', 'Visualisasi chart interaktif dari data Supabase.', 'right', '*'),
  (5, '[data-tour="nav-gis"]', 'GIS Intelligence', 'Visualisasi spasial menggunakan peta interaktif.', 'right', '*'),
  (6, '[data-tour="nav-ai"]', 'AI Insight', 'Narasi dan rekomendasi dari LLM Groq.', 'right', '*'),
  (7, '[data-tour="nav-bantuan"]', 'Pusat Bantuan', 'Dokumentasi, FAQ, video, dan tur aplikasi — semua dari cloud.', 'right', '*')
) as v(step, target_selector, title, description, placement, page)
where not exists (select 1 from product_tour limit 1);

-- Seed sample FAQ
insert into faq (question, answer, category, sort_order)
select v.question, v.answer, v.category, v.sort_order
from (values
  ('Bagaimana cara login?', 'Gunakan email dan password yang didaftarkan admin. Hubungi administrator jika belum punya akun.', 'umum', 1),
  ('Dari mana data kasus berasal?', 'Data diimpor dari logbook SIMPATI.KK ke database Supabase melalui menu Import Data.', 'data', 2),
  ('Apakah aplikasi berjalan 24/7?', 'Ya. Frontend di Cloudflare Pages, database di Supabase, dan layanan ML di Hugging Face.', 'umum', 3)
) as v(question, answer, category, sort_order)
where not exists (select 1 from faq limit 1);

-- Seed sample guide (requires category id)
insert into help_articles (category_id, title, slug, summary, content, author, published, sort_order)
select c.id,
  'Memulai dengan Dashboard',
  'memulai-dashboard',
  'Panduan singkat membaca KPI dan tren di halaman utama.',
  E'## Dashboard\n\nHalaman **Dashboard** menampilkan:\n\n- Total kasus\n- Kasus aktif & selesai\n- Completion rate\n- Grafik tren tahunan\n\nGunakan **filter global** di atas untuk menyaring data.',
  '@budi',
  true,
  1
from help_categories c where c.slug = 'panduan-menu'
on conflict (slug) do nothing;

insert into release_notes (version, release_date, title, description)
select '1.0', '2026-07-01'::date, 'Rilis awal e-Insight', 'Dashboard, Analitik, GIS, AI Insight, Forecasting, Laporan, Admin & Security.'
where not exists (select 1 from release_notes where version = '1.0');

-- ============================================================
-- RankJK Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- EXAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  conducting_body TEXT NOT NULL DEFAULT 'OTHER',
  exam_date DATE,
  result_expected_date DATE,
  total_vacancies INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- POSTS (each exam has multiple posts)
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  vacancies INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBMISSIONS (one per user per post)
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('General','OBC','SC','ST','EWS','PWD','RBA','ALC')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: users can read their own profile, admins can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Exams: public read, admin write
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exams"
  ON exams FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage exams"
  ON exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Posts: public read, admin write
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active posts"
  ON posts FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage posts"
  ON posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Submissions: public aggregate read, authenticated write
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions (for analytics)"
  ON submissions FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can submit their own marks"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submission"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete submissions"
  ON submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================================
-- SEED DATA - Pre-loaded Exams
-- ============================================================

-- JKSSB Finance Department
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'JKSSB Finance Department Exam 2024',
  'JKSSB Finance',
  'JKSSB recruitment for Finance Department posts including Accounts Assistant and Junior Accountant',
  'JKSSB',
  500
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Accounts Assistant', 100, 300),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Junior Accountant', 100, 200)
ON CONFLICT DO NOTHING;

-- JKSSB Police
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0002-0002-0002-000000000002',
  'JKSSB Police Recruitment 2024',
  'JKSSB Police',
  'JKSSB recruitment for J&K Police department — Sub Inspector and Constable posts',
  'JKSSB',
  1200
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Sub Inspector (SI)', 100, 400),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Constable (GD)', 100, 800)
ON CONFLICT DO NOTHING;

-- JKPSC KAS
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0003-0003-0003-000000000003',
  'JKPSC KAS Exam 2024',
  'JKPSC KAS',
  'Jammu & Kashmir Public Service Commission — Kashmir Administrative Service Preliminary Examination',
  'JKPSC',
  150
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0003-0003-0003-000000000003', 'KAS (Prelims)', 200, 150)
ON CONFLICT DO NOTHING;

-- SSC CGL
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0004-0004-0004-000000000004',
  'SSC CGL 2024',
  'SSC CGL',
  'Staff Selection Commission — Combined Graduate Level examination for Group B and C posts',
  'SSC',
  17727
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Tier-I (CBT)', 200, 17727),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Tier-II (CBT)', 300, 17727)
ON CONFLICT DO NOTHING;

-- SSC CHSL
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0005-0005-0005-000000000005',
  'SSC CHSL 2024',
  'SSC CHSL',
  'Staff Selection Commission — Combined Higher Secondary Level for LDC, JSA, DEO posts',
  'SSC',
  3712
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Tier-I (CBT)', 200, 3712)
ON CONFLICT DO NOTHING;

-- SSC MTS
INSERT INTO exams (id, name, short_name, description, conducting_body, total_vacancies)
VALUES (
  'a1b2c3d4-0006-0006-0006-000000000006',
  'SSC MTS 2024',
  'SSC MTS',
  'Staff Selection Commission — Multi Tasking Staff (Non-Technical) for Group C posts',
  'SSC',
  9583
) ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (exam_id, name, total_marks, vacancies)
VALUES
  ('a1b2c3d4-0006-0006-0006-000000000006', 'MTS (Paper-I)', 150, 9583)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIEWS for analytics
-- ============================================================

-- Cutoff statistics view per post and category
CREATE OR REPLACE VIEW cutoff_stats AS
SELECT
  s.post_id,
  p.name AS post_name,
  p.total_marks,
  p.vacancies,
  e.id AS exam_id,
  e.name AS exam_name,
  e.short_name AS exam_short_name,
  e.conducting_body,
  s.category,
  COUNT(*) AS submission_count,
  MIN(s.score) AS min_score,
  MAX(s.score) AS max_score,
  AVG(s.score) AS avg_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.score) AS median_score,
  PERCENTILE_CONT(0.15) WITHIN GROUP (ORDER BY s.score DESC) AS cutoff_optimistic,
  PERCENTILE_CONT(0.20) WITHIN GROUP (ORDER BY s.score DESC) AS cutoff_likely,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY s.score DESC) AS cutoff_conservative
FROM submissions s
JOIN posts p ON s.post_id = p.id
JOIN exams e ON p.exam_id = e.id
GROUP BY s.post_id, p.name, p.total_marks, p.vacancies, e.id, e.name, e.short_name, e.conducting_body, s.category;

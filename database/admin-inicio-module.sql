-- ============================================================
-- Admin Inicio Module — Migration
-- Tables: home_banners, content_deletion_history
-- ============================================================

-- 1. Home Banners (events slider on Inicio / HomeTab)
-- ============================================================
CREATE TABLE IF NOT EXISTS home_banners (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title_es      TEXT        NOT NULL,
  title_ko      TEXT,
  description_es TEXT,
  description_ko TEXT,
  image_url      TEXT        NOT NULL,
  link_url       TEXT,
  display_order  INT         NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordered fetching
CREATE INDEX IF NOT EXISTS idx_home_banners_order ON home_banners (display_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_home_banners_active ON home_banners (is_active);

-- RLS
ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners
DROP POLICY IF EXISTS "home_banners_select_public" ON home_banners;
CREATE POLICY "home_banners_select_public"
  ON home_banners FOR SELECT
  USING (true);

-- Only service role / admin can insert/update/delete (handled at API layer)
DROP POLICY IF EXISTS "home_banners_all_service" ON home_banners;
CREATE POLICY "home_banners_all_service"
  ON home_banners FOR ALL
  TO service_role
  USING (true);

-- 2. Content Deletion History (posts and news deleted by admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_deletion_history (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type        TEXT        NOT NULL CHECK (content_type IN ('post', 'news')),
  content_id          TEXT        NOT NULL,
  content_title       TEXT,
  content_author      TEXT,
  deleted_by_user_id  UUID,
  deleted_by_email    TEXT,
  reason              TEXT,
  original_data       JSONB,
  deleted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_history_type ON content_deletion_history (content_type);
CREATE INDEX IF NOT EXISTS idx_deletion_history_date ON content_deletion_history (deleted_at DESC);

-- RLS
ALTER TABLE content_deletion_history ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (admin API uses service role key)
DROP POLICY IF EXISTS "deletion_history_service" ON content_deletion_history;
CREATE POLICY "deletion_history_service"
  ON content_deletion_history FOR ALL
  TO service_role
  USING (true);

-- 3. Ensure korean_news has published + is_pinned columns
-- ============================================================
ALTER TABLE korean_news
  ADD COLUMN IF NOT EXISTS published  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_pinned  BOOLEAN NOT NULL DEFAULT false;

-- 4. Storage bucket for home banners (run manually if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('home-banners', 'home-banners', true)
-- ON CONFLICT DO NOTHING;

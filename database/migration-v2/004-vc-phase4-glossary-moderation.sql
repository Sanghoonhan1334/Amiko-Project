-- ============================================================
-- Migration 004: Phase 4 — Glossary integration + Moderation
-- For: Amiko Mentor Videocall (vc_sessions)
-- Depends on: 003-vc-phase3-translations.sql
-- ============================================================

-- ┌─────────────────────────────────────────────────┐
-- │  vc_moderation_reports                          │
-- │  User-submitted reports during mentor sessions  │
-- └─────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.vc_moderation_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL,
  reporter_user_id UUID NOT NULL,
  reported_user_id UUID,
  reason          TEXT NOT NULL CHECK (reason IN (
    'harassment', 'insults', 'spam', 'offensive_content', 'inappropriate_behavior', 'other'
  )),
  severity        TEXT NOT NULL DEFAULT 'informative' CHECK (severity IN (
    'informative', 'warning', 'high_risk'
  )),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'resolved', 'dismissed'
  )),
  action_taken    TEXT DEFAULT 'none' CHECK (action_taken IN (
    'none', 'warning_sent', 'user_muted', 'user_banned', 'session_ended'
  )),
  description     TEXT,
  evidence_caption_ids UUID[],
  screenshot_url  TEXT,
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_session
  ON public.vc_moderation_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_status
  ON public.vc_moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_reporter
  ON public.vc_moderation_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_reported
  ON public.vc_moderation_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_severity
  ON public.vc_moderation_reports(severity);
CREATE INDEX IF NOT EXISTS idx_vc_mod_reports_created
  ON public.vc_moderation_reports(created_at DESC);

-- ┌─────────────────────────────────────────────────┐
-- │  vc_moderation_flags                            │
-- │  Auto-detected content flags in mentor sessions │
-- └─────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS public.vc_moderation_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL,
  flagged_user_id UUID,
  flagged_content TEXT NOT NULL,
  caption_event_id UUID,
  detection_rule  TEXT NOT NULL,
  detection_type  TEXT NOT NULL DEFAULT 'keyword' CHECK (detection_type IN (
    'keyword', 'pattern', 'ml_score', 'manual'
  )),
  severity        TEXT NOT NULL DEFAULT 'informative' CHECK (severity IN (
    'informative', 'warning', 'high_risk'
  )),
  confidence      NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  source_language TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'reviewed', 'false_positive', 'confirmed'
  )),
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_session
  ON public.vc_moderation_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_status
  ON public.vc_moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_severity
  ON public.vc_moderation_flags(severity);
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_user
  ON public.vc_moderation_flags(flagged_user_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_caption
  ON public.vc_moderation_flags(caption_event_id);
CREATE INDEX IF NOT EXISTS idx_vc_mod_flags_created
  ON public.vc_moderation_flags(created_at DESC);

-- ┌─────────────────────────────────────────────────┐
-- │  updated_at triggers                            │
-- └─────────────────────────────────────────────────┘
-- Reuse the trigger function from Phase 2 if available, else create
CREATE OR REPLACE FUNCTION public.vc_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vc_mod_reports_updated'
  ) THEN
    CREATE TRIGGER trg_vc_mod_reports_updated
      BEFORE UPDATE ON public.vc_moderation_reports
      FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vc_mod_flags_updated'
  ) THEN
    CREATE TRIGGER trg_vc_mod_flags_updated
      BEFORE UPDATE ON public.vc_moderation_flags
      FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();
  END IF;
END $$;

-- ┌─────────────────────────────────────────────────┐
-- │  RLS Policies                                   │
-- └─────────────────────────────────────────────────┘
ALTER TABLE public.vc_moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_moderation_flags ENABLE ROW LEVEL SECURITY;

-- Reports: users can INSERT their own reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vc_moderation_reports' AND policyname = 'vc_mod_reports_user_insert'
  ) THEN
    CREATE POLICY vc_mod_reports_user_insert ON public.vc_moderation_reports
      FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);
  END IF;
END $$;

-- Reports: users can SELECT their own reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vc_moderation_reports' AND policyname = 'vc_mod_reports_user_select'
  ) THEN
    CREATE POLICY vc_mod_reports_user_select ON public.vc_moderation_reports
      FOR SELECT USING (auth.uid() = reporter_user_id);
  END IF;
END $$;

-- Flags: SELECT only (admin reads via service role, users see nothing directly)
-- No user-facing RLS for flags — admin uses service role to bypass RLS

-- ┌─────────────────────────────────────────────────┐
-- │  Seed: Default cultural glossary entries        │
-- │  (into existing amiko_meet_cultural_glossaries) │
-- └─────────────────────────────────────────────────┘
-- Only insert if the table exists and entries don't already exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'amiko_meet_cultural_glossaries'
  ) THEN
    -- Korean cultural terms (preserve in Spanish translation)
    INSERT INTO public.amiko_meet_cultural_glossaries
      (source_term, source_language, rule, target_value, target_language, category, context_hint, priority, is_active)
    VALUES
      ('김치', 'ko', 'no_translate', 'kimchi', 'es', 'food', 'Korean fermented vegetable dish', 10, true),
      ('떡볶이', 'ko', 'transliterate', 'tteokbokki', 'es', 'food', 'Spicy rice cakes', 10, true),
      ('비빔밥', 'ko', 'transliterate', 'bibimbap', 'es', 'food', 'Mixed rice bowl', 10, true),
      ('불고기', 'ko', 'transliterate', 'bulgogi', 'es', 'food', 'Korean BBQ beef', 10, true),
      ('삼겹살', 'ko', 'transliterate', 'samgyeopsal', 'es', 'food', 'Pork belly', 10, true),
      ('소주', 'ko', 'transliterate', 'soju', 'es', 'food', 'Korean distilled spirit', 10, true),
      ('오빠', 'ko', 'annotate', 'oppa (hermano mayor / forma cariñosa)', 'es', 'honorific', 'Term used by females for older males', 10, true),
      ('언니', 'ko', 'annotate', 'unnie (hermana mayor)', 'es', 'honorific', 'Term used by females for older females', 10, true),
      ('누나', 'ko', 'annotate', 'noona (hermana mayor)', 'es', 'honorific', 'Term used by males for older females', 10, true),
      ('형', 'ko', 'annotate', 'hyung (hermano mayor)', 'es', 'honorific', 'Term used by males for older males', 10, true),
      ('선배', 'ko', 'annotate', 'sunbae (senior)', 'es', 'honorific', 'Senior in school/work hierarchy', 9, true),
      ('후배', 'ko', 'annotate', 'hubae (junior)', 'es', 'honorific', 'Junior in school/work hierarchy', 9, true),
      ('한복', 'ko', 'preserve', 'hanbok', 'es', 'cultural', 'Traditional Korean clothing', 9, true),
      ('K-pop', 'ko', 'no_translate', 'K-pop', 'es', 'cultural', 'Korean pop music genre', 10, true),
      ('PC방', 'ko', 'annotate', 'PC bang (cibercafé coreano)', 'es', 'cultural', 'Internet/gaming cafe', 8, true),
      ('찜질방', 'ko', 'annotate', 'jjimjilbang (spa/sauna coreano)', 'es', 'cultural', 'Korean bathhouse/spa', 8, true)
    ON CONFLICT DO NOTHING;

    -- Latin American cultural terms (preserve in Korean translation)
    INSERT INTO public.amiko_meet_cultural_glossaries
      (source_term, source_language, rule, target_value, target_language, category, context_hint, priority, is_active)
    VALUES
      ('arepa', 'es', 'no_translate', '아레파', 'ko', 'food', 'Cornmeal flatbread from Venezuela/Colombia', 10, true),
      ('hallaca', 'es', 'transliterate', '아야카', 'ko', 'food', 'Venezuelan tamale-like dish', 10, true),
      ('empanada', 'es', 'no_translate', '엠파나다', 'ko', 'food', 'Stuffed pastry', 10, true),
      ('taco', 'es', 'no_translate', '타코', 'ko', 'food', 'Mexican tortilla dish', 10, true),
      ('pupusa', 'es', 'transliterate', '푸푸사', 'ko', 'food', 'Salvadoran stuffed tortilla', 10, true),
      ('cumbia', 'es', 'no_translate', '쿰비아', 'ko', 'cultural', 'Latin American music/dance genre', 9, true),
      ('reggaetón', 'es', 'no_translate', '레게톤', 'ko', 'cultural', 'Latin urban music genre', 9, true),
      ('telenovela', 'es', 'annotate', '텔레노벨라 (라틴 드라마)', 'ko', 'cultural', 'Latin American soap opera', 8, true),
      ('quinceañera', 'es', 'annotate', '킨세아녜라 (15세 생일 파티)', 'ko', 'cultural', '15th birthday celebration', 9, true),
      ('Día de los Muertos', 'es', 'annotate', '죽은 자의 날 (멕시코 전통 명절)', 'ko', 'cultural', 'Mexican Day of the Dead', 9, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ┌─────────────────────────────────────────────────┐
-- │  Realtime publication                           │
-- └─────────────────────────────────────────────────┘
-- Reports and flags should be visible in admin real-time
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_moderation_reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_moderation_flags;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Done. Next: Run this migration on Supabase.
-- ============================================================

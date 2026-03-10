-- ============================================================
-- Education Phase 3 — Real-time Translation with DeepSeek
-- Tables: education_translation_events, education_translation_preferences
-- ============================================================

-- 1. Translation Events — one per final caption event (one translation per caption)
CREATE TABLE IF NOT EXISTS education_translation_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  caption_event_id UUID NOT NULL REFERENCES education_caption_events(id)
    ON DELETE CASCADE,
  session_id       UUID NOT NULL REFERENCES education_sessions(id)
    ON DELETE CASCADE,
  course_id        UUID NOT NULL REFERENCES education_courses(id)
    ON DELETE CASCADE,

  -- Translation content
  source_language  TEXT NOT NULL,           -- ISO 639-1: 'ko', 'es', 'en'
  target_language  TEXT NOT NULL,           -- ISO 639-1: 'ko', 'es', 'en'
  original_text    TEXT NOT NULL,
  translated_text  TEXT NOT NULL,
  is_partial       BOOLEAN NOT NULL DEFAULT false,  -- always false in phase 3

  -- Provider metadata
  provider         TEXT NOT NULL DEFAULT 'deepseek',
  translation_ms   INTEGER,                -- latency in ms
  error_message    TEXT,                   -- null = success; set = fallback to original

  -- Ordering (mirrors caption sequence for alignment)
  sequence_number  BIGINT NOT NULL DEFAULT nextval('education_caption_seq'),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Idempotent: only one translation per caption event
  UNIQUE(caption_event_id)
);

CREATE INDEX IF NOT EXISTS idx_edu_translations_session
  ON education_translation_events (session_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_edu_translations_caption
  ON education_translation_events (caption_event_id);

-- 2. User Translation Preferences (education-scoped)
CREATE TABLE IF NOT EXISTS education_translation_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id)
    ON DELETE CASCADE,

  display_mode     TEXT NOT NULL DEFAULT 'original_and_translated'
    CHECK (display_mode IN ('none', 'translated_only', 'original_and_translated')),

  target_language  TEXT NOT NULL DEFAULT 'es'
    CHECK (target_language IN ('ko', 'es', 'en')),

  auto_translate   BOOLEAN NOT NULL DEFAULT true,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

-- Auto-update timestamps
DROP TRIGGER IF EXISTS trg_edu_trans_prefs_updated_at
  ON education_translation_preferences;

CREATE TRIGGER trg_edu_trans_prefs_updated_at
  BEFORE UPDATE ON education_translation_preferences
  FOR EACH ROW EXECUTE FUNCTION update_education_stt_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE education_translation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_translation_preferences ENABLE ROW LEVEL SECURITY;

-- Translation events: readable by enrolled students + instructor; written by service role
CREATE POLICY edu_trans_events_select ON education_translation_events
  FOR SELECT
  USING (true);   -- fine-grained check is in the SSE route; table is read-only for users

CREATE POLICY edu_trans_events_insert ON education_translation_events
  FOR INSERT
  WITH CHECK (true);    -- only server-side code inserts (service role)

-- Translation preferences: users manage their own
CREATE POLICY edu_trans_prefs_own ON education_translation_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

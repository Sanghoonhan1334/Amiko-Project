-- ============================================================
-- Education Phase 2 — Real-time STT Captions
-- Tables: stt_tasks, caption_events, user_caption_preferences
-- ============================================================

-- 1. STT Tasks — one per live session, tracks Agora STT lifecycle
CREATE TABLE IF NOT EXISTS education_stt_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,

  -- Agora STT task metadata
  task_id       TEXT,                          -- Agora taskId returned by start
  builder_token TEXT,                          -- Agora builderToken for stop/query

  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'starting', 'active', 'stopping', 'stopped', 'failed')),

  -- Config used when starting
  source_languages TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'ko', 'es'}
  agora_channel   TEXT NOT NULL,
  agora_uid       INTEGER,                     -- UID the STT bot joins with

  -- Lifecycle timestamps
  started_at    TIMESTAMPTZ,
  stopped_at    TIMESTAMPTZ,
  error_message TEXT,

  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(session_id, status) -- prevent multiple active tasks per session
);

CREATE INDEX IF NOT EXISTS idx_stt_tasks_session ON education_stt_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_stt_tasks_status  ON education_stt_tasks(status);

-- 2. Caption Events — every partial/final transcript fragment
CREATE TABLE IF NOT EXISTS education_caption_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,

  speaker_uid     INTEGER NOT NULL,             -- Agora numeric UID
  speaker_user_id UUID,                         -- mapped app user ID (nullable if unknown)

  source_language TEXT NOT NULL,                 -- ISO 639-1: 'ko', 'es', 'en', etc.
  text            TEXT NOT NULL,
  is_partial      BOOLEAN NOT NULL DEFAULT true, -- true = interim, false = final

  -- Ordering / dedup
  sequence_number BIGINT NOT NULL DEFAULT 0,
  timestamp_ms    BIGINT NOT NULL DEFAULT 0,     -- Agora media timestamp

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caption_events_session   ON education_caption_events(session_id);
CREATE INDEX IF NOT EXISTS idx_caption_events_seq       ON education_caption_events(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_caption_events_final     ON education_caption_events(session_id, is_partial)
  WHERE is_partial = false;

-- 3. User Caption Preferences
CREATE TABLE IF NOT EXISTS user_caption_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  captions_enabled   BOOLEAN NOT NULL DEFAULT true,
  font_size          TEXT NOT NULL DEFAULT 'medium'
    CHECK (font_size IN ('small', 'medium', 'large')),
  position           TEXT NOT NULL DEFAULT 'bottom'
    CHECK (position IN ('top', 'bottom')),
  background_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.7
    CHECK (background_opacity BETWEEN 0 AND 1),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_education_stt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stt_tasks_updated_at ON education_stt_tasks;
CREATE TRIGGER trg_stt_tasks_updated_at
  BEFORE UPDATE ON education_stt_tasks
  FOR EACH ROW EXECUTE FUNCTION update_education_stt_updated_at();

DROP TRIGGER IF EXISTS trg_caption_prefs_updated_at ON user_caption_preferences;
CREATE TRIGGER trg_caption_prefs_updated_at
  BEFORE UPDATE ON user_caption_preferences
  FOR EACH ROW EXECUTE FUNCTION update_education_stt_updated_at();

-- Sequence generator for caption_events
CREATE SEQUENCE IF NOT EXISTS education_caption_seq START 1;

-- ── RLS ──────────────────────────────────────────────

ALTER TABLE education_stt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_caption_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_caption_preferences ENABLE ROW LEVEL SECURITY;

-- stt_tasks: service role only (backend manages lifecycle)
CREATE POLICY stt_tasks_service ON education_stt_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- caption_events: read by enrolled students + instructor; write by service role
CREATE POLICY caption_events_read ON education_caption_events
  FOR SELECT USING (true);

CREATE POLICY caption_events_insert ON education_caption_events
  FOR INSERT WITH CHECK (true);

-- user_caption_preferences: users manage their own
CREATE POLICY caption_prefs_own ON user_caption_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Education Module — Recording, Summary & Notes (Phase 6)
-- ============================================================
-- Tables: session_consents, session_recordings, 
--         session_summaries, educational_notes
-- Run AFTER: supabase-init.sql, add-education-module-v2.sql
-- ============================================================

-- 1. Participant consent for recording / transcript / translation storage
CREATE TABLE IF NOT EXISTS session_consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type  TEXT NOT NULL
                  CHECK (consent_type IN ('recording','transcript','translation')),
  granted       BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at    TIMESTAMPTZ,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id, consent_type)
);

-- 2. Agora Cloud Recording lifecycle per session
CREATE TABLE IF NOT EXISTS session_recordings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  agora_resource_id  TEXT,
  agora_sid          TEXT,
  agora_uid          TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','recording','stopped','processing','ready','failed')),
  -- JSONB array of { fileName, fileType } from Agora fileList
  file_urls          JSONB,
  duration_seconds   INTEGER,
  started_at         TIMESTAMPTZ,
  stopped_at         TIMESTAMPTZ,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AI-generated session summary (DeepSeek)
CREATE TABLE IF NOT EXISTS session_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL UNIQUE REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id             UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  summary_text          TEXT NOT NULL,
  key_topics            JSONB,   -- string[]
  duration_minutes      INTEGER,
  source_caption_count  INTEGER,
  provider              TEXT NOT NULL DEFAULT 'deepseek',
  model                 TEXT,
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Per-user educational notes generated from session transcript
CREATE TABLE IF NOT EXISTS educational_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- vocabulary: [{term, translation, example}]
  vocabulary  JSONB,
  -- phrases: [{original, translation, context}]
  phrases     JSONB,
  -- concepts: [{title, explanation}]
  concepts    JSONB,
  provider    TEXT NOT NULL DEFAULT 'deepseek',
  model       TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_consents_session ON session_consents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_consents_user    ON session_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_sess  ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_sess   ON session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_educational_notes_sess   ON educational_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_educational_notes_user   ON educational_notes(user_id);

-- RLS
ALTER TABLE session_consents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_notes   ENABLE ROW LEVEL SECURITY;

-- Users manage their own consents
CREATE POLICY "users_own_consents" ON session_consents
  FOR ALL USING (user_id = auth.uid());

-- Users read their own notes
CREATE POLICY "users_own_notes" ON educational_notes
  FOR SELECT USING (user_id = auth.uid());

-- Anyone in a session can read its summary/recordings (enforce at app level)
CREATE POLICY "service_role_bypass_consents" ON session_consents
  USING (auth.role() = 'service_role');
CREATE POLICY "service_role_bypass_recordings" ON session_recordings
  USING (auth.role() = 'service_role');
CREATE POLICY "service_role_bypass_summaries" ON session_summaries
  USING (auth.role() = 'service_role');
CREATE POLICY "service_role_bypass_notes" ON educational_notes
  USING (auth.role() = 'service_role');

-- Auto-update updated_at for recordings
CREATE OR REPLACE FUNCTION update_session_recordings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_session_recordings_updated_at
  BEFORE UPDATE ON session_recordings
  FOR EACH ROW EXECUTE FUNCTION update_session_recordings_updated_at();

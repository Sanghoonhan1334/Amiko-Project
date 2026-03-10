-- ============================================================
-- AMIKO Meet Phase 5: Optional Recording + Auto-Summary
--                      + Session Notes + Reputation
-- Run this migration AFTER amiko-meet-phase4-glossary-moderation.sql
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. SESSION RECORDINGS (optional, consent-based)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,

  -- Who started the recording
  initiated_by UUID NOT NULL REFERENCES auth.users(id),

  -- Consent tracking: all participants must consent
  consent_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (consent_status IN ('pending', 'all_consented', 'declined', 'partial')),

  -- Recording state
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'recording', 'processing', 'completed', 'failed', 'deleted')),

  -- Storage
  storage_provider TEXT DEFAULT 'supabase'
    CHECK (storage_provider IN ('supabase', 's3', 'local')),
  storage_path TEXT,          -- bucket/path
  storage_url TEXT,           -- signed URL (temporary)
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  mime_type TEXT DEFAULT 'video/webm',

  -- Retention
  expires_at TIMESTAMPTZ,     -- auto-delete after this date
  is_deleted BOOLEAN DEFAULT false,

  -- Metadata
  recording_started_at TIMESTAMPTZ,
  recording_ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual consent per participant
CREATE TABLE IF NOT EXISTS amiko_meet_recording_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES amiko_meet_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  consented BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_recording_consent UNIQUE (recording_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recordings_session
  ON amiko_meet_recordings(session_id);

CREATE INDEX IF NOT EXISTS idx_recordings_status
  ON amiko_meet_recordings(status)
  WHERE status != 'deleted';


-- ══════════════════════════════════════════════════════════════
-- 2. SESSION SUMMARIES (auto-generated from captions/translations)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_session_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,

  -- Summary in both languages
  summary_ko TEXT,
  summary_es TEXT,

  -- Key topics discussed
  topics JSONB DEFAULT '[]',
  -- e.g. [{"topic": "Korean food", "topic_ko": "한국 음식", "topic_es": "Comida coreana", "mentions": 5}]

  -- Vocabulary learned
  vocabulary JSONB DEFAULT '[]',
  -- e.g. [{"term": "김치", "translation": "kimchi", "context": "We talked about making kimchi"}]

  -- Cultural notes
  cultural_notes JSONB DEFAULT '[]',
  -- e.g. [{"note_ko": "...", "note_es": "...", "category": "food"}]

  -- Stats
  total_caption_events INTEGER DEFAULT 0,
  total_translations INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  words_spoken_ko INTEGER DEFAULT 0,
  words_spoken_es INTEGER DEFAULT 0,

  -- Generation info
  generated_by TEXT DEFAULT 'system'
    CHECK (generated_by IN ('system', 'ai', 'manual')),
  ai_model TEXT,              -- e.g. 'deepseek-chat'
  generation_status TEXT DEFAULT 'pending'
    CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_session_summary UNIQUE (session_id)
);


-- ══════════════════════════════════════════════════════════════
-- 3. SESSION NOTES (user-created, educational)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Note content (bilingual)
  title TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('ko', 'es')),

  -- Note type
  note_type TEXT NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('general', 'vocabulary', 'grammar', 'cultural', 'pronunciation')),

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Timestamps from the session (for linking to recording)
  session_timestamp_start INTEGER,  -- seconds from session start
  session_timestamp_end INTEGER,

  -- Sharing
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_notes_user
  ON amiko_meet_session_notes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_notes_session
  ON amiko_meet_session_notes(session_id);


-- ══════════════════════════════════════════════════════════════
-- 4. SESSION REPUTATION (per-session user ratings)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_session_reputation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,

  -- Who is rating
  rater_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Who is being rated
  rated_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Scores (1-5)
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),

  -- Breakdown (optional, 1-5)
  communication_rating SMALLINT CHECK (communication_rating IS NULL OR communication_rating BETWEEN 1 AND 5),
  respect_rating SMALLINT CHECK (respect_rating IS NULL OR respect_rating BETWEEN 1 AND 5),
  helpfulness_rating SMALLINT CHECK (helpfulness_rating IS NULL OR helpfulness_rating BETWEEN 1 AND 5),
  language_skill_rating SMALLINT CHECK (language_skill_rating IS NULL OR language_skill_rating BETWEEN 1 AND 5),

  -- Comment
  comment TEXT,

  -- Badges awarded (optional)
  badges TEXT[] DEFAULT '{}',
  -- e.g. ['great_teacher', 'patient', 'fun_conversation', 'cultural_expert']

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_session_rating UNIQUE (session_id, rater_user_id, rated_user_id),
  CONSTRAINT no_self_rating CHECK (rater_user_id != rated_user_id)
);

-- Aggregated reputation per user (materialized for performance)
CREATE TABLE IF NOT EXISTS amiko_meet_user_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  total_sessions INTEGER DEFAULT 0,
  total_ratings_received INTEGER DEFAULT 0,

  avg_overall NUMERIC(3,2) DEFAULT 0,
  avg_communication NUMERIC(3,2) DEFAULT 0,
  avg_respect NUMERIC(3,2) DEFAULT 0,
  avg_helpfulness NUMERIC(3,2) DEFAULT 0,
  avg_language_skill NUMERIC(3,2) DEFAULT 0,

  -- Badges count
  badges_earned JSONB DEFAULT '{}',
  -- e.g. {"great_teacher": 3, "patient": 5}

  -- Reputation tier
  reputation_tier TEXT DEFAULT 'newcomer'
    CHECK (reputation_tier IN ('newcomer', 'active', 'trusted', 'expert', 'ambassador')),

  -- Flags (from moderation)
  total_reports_received INTEGER DEFAULT 0,
  total_flags_received INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_session
  ON amiko_meet_session_reputation(session_id);

CREATE INDEX IF NOT EXISTS idx_reputation_rated_user
  ON amiko_meet_session_reputation(rated_user_id);

CREATE INDEX IF NOT EXISTS idx_user_reputation_tier
  ON amiko_meet_user_reputation(reputation_tier);


-- ══════════════════════════════════════════════════════════════
-- 5. Function: Update aggregated reputation
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_total_sessions INTEGER;
  v_total_ratings INTEGER;
  v_avg_overall NUMERIC(3,2);
  v_avg_comm NUMERIC(3,2);
  v_avg_resp NUMERIC(3,2);
  v_avg_help NUMERIC(3,2);
  v_avg_lang NUMERIC(3,2);
  v_tier TEXT;
BEGIN
  -- Calculate aggregates
  SELECT
    COUNT(DISTINCT session_id),
    COUNT(*),
    COALESCE(AVG(overall_rating), 0),
    COALESCE(AVG(communication_rating), 0),
    COALESCE(AVG(respect_rating), 0),
    COALESCE(AVG(helpfulness_rating), 0),
    COALESCE(AVG(language_skill_rating), 0)
  INTO v_total_sessions, v_total_ratings, v_avg_overall, v_avg_comm, v_avg_resp, v_avg_help, v_avg_lang
  FROM amiko_meet_session_reputation
  WHERE rated_user_id = NEW.rated_user_id;

  -- Determine tier
  v_tier := CASE
    WHEN v_total_sessions >= 50 AND v_avg_overall >= 4.5 THEN 'ambassador'
    WHEN v_total_sessions >= 25 AND v_avg_overall >= 4.0 THEN 'expert'
    WHEN v_total_sessions >= 10 AND v_avg_overall >= 3.5 THEN 'trusted'
    WHEN v_total_sessions >= 3 THEN 'active'
    ELSE 'newcomer'
  END;

  -- Upsert
  INSERT INTO amiko_meet_user_reputation (
    user_id, total_sessions, total_ratings_received,
    avg_overall, avg_communication, avg_respect, avg_helpfulness, avg_language_skill,
    reputation_tier, updated_at
  ) VALUES (
    NEW.rated_user_id, v_total_sessions, v_total_ratings,
    v_avg_overall, v_avg_comm, v_avg_resp, v_avg_help, v_avg_lang,
    v_tier, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_ratings_received = EXCLUDED.total_ratings_received,
    avg_overall = EXCLUDED.avg_overall,
    avg_communication = EXCLUDED.avg_communication,
    avg_respect = EXCLUDED.avg_respect,
    avg_helpfulness = EXCLUDED.avg_helpfulness,
    avg_language_skill = EXCLUDED.avg_language_skill,
    reputation_tier = EXCLUDED.reputation_tier,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reputation ON amiko_meet_session_reputation;
CREATE TRIGGER trg_update_reputation
  AFTER INSERT ON amiko_meet_session_reputation
  FOR EACH ROW EXECUTE FUNCTION update_user_reputation();


-- ══════════════════════════════════════════════════════════════
-- 6. Auto-update timestamps
-- ══════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_recordings_updated_at ON amiko_meet_recordings;
CREATE TRIGGER trg_recordings_updated_at
  BEFORE UPDATE ON amiko_meet_recordings
  FOR EACH ROW EXECUTE FUNCTION update_meet_updated_at();

DROP TRIGGER IF EXISTS trg_summaries_updated_at ON amiko_meet_session_summaries;
CREATE TRIGGER trg_summaries_updated_at
  BEFORE UPDATE ON amiko_meet_session_summaries
  FOR EACH ROW EXECUTE FUNCTION update_meet_updated_at();

DROP TRIGGER IF EXISTS trg_session_notes_updated_at ON amiko_meet_session_notes;
CREATE TRIGGER trg_session_notes_updated_at
  BEFORE UPDATE ON amiko_meet_session_notes
  FOR EACH ROW EXECUTE FUNCTION update_meet_updated_at();


-- ══════════════════════════════════════════════════════════════
-- 7. RLS Policies
-- ══════════════════════════════════════════════════════════════

-- ── Recordings ──
ALTER TABLE amiko_meet_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_read_participants" ON amiko_meet_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM amiko_meet_participants p
      WHERE p.session_id = amiko_meet_recordings.session_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "recordings_insert" ON amiko_meet_recordings
  FOR INSERT WITH CHECK (true);  -- service role

ALTER TABLE amiko_meet_recording_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_own" ON amiko_meet_recording_consents
  FOR ALL USING (user_id = auth.uid());

-- ── Summaries ──
ALTER TABLE amiko_meet_session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_read_participants" ON amiko_meet_session_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM amiko_meet_participants p
      WHERE p.session_id = amiko_meet_session_summaries.session_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "summaries_insert" ON amiko_meet_session_summaries
  FOR INSERT WITH CHECK (true);  -- service role

CREATE POLICY "summaries_update" ON amiko_meet_session_summaries
  FOR UPDATE USING (true);  -- service role updates generation status

-- ── Notes ──
ALTER TABLE amiko_meet_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_own" ON amiko_meet_session_notes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "notes_read_public" ON amiko_meet_session_notes
  FOR SELECT USING (is_public = true);

-- ── Session Reputation ──
ALTER TABLE amiko_meet_session_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reputation_create" ON amiko_meet_session_reputation
  FOR INSERT WITH CHECK (rater_user_id = auth.uid());

CREATE POLICY "reputation_read" ON amiko_meet_session_reputation
  FOR SELECT USING (
    rater_user_id = auth.uid()
    OR rated_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── User Reputation (public read) ──
ALTER TABLE amiko_meet_user_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reputation_read" ON amiko_meet_user_reputation
  FOR SELECT USING (true);


-- ══════════════════════════════════════════════════════════════
-- Done — Phase 5 tables ready
-- ══════════════════════════════════════════════════════════════

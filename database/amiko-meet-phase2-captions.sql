-- ============================================================
-- AMIKO Meet Phase 2: Real-Time Captions / STT
-- Run this migration AFTER amiko-meet-phase1.sql
-- ============================================================

-- ── STT Task Tracking ─────────────────────────────────
-- One task per session, tracks whether captioning is active
CREATE TABLE IF NOT EXISTS amiko_meet_stt_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'active', 'stopped', 'error')),
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  started_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one task per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_stt_tasks_session
  ON amiko_meet_stt_tasks(session_id);

-- ── Caption Events ────────────────────────────────────
-- Every speech fragment (partial or final) is stored here
CREATE TABLE IF NOT EXISTS amiko_meet_caption_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  speaker_uid INTEGER,
  speaker_user_id UUID REFERENCES auth.users(id),
  speaker_name TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('ko', 'es', 'mixed', 'unknown')),
  is_final BOOLEAN DEFAULT false,
  sequence_number SERIAL,
  timestamp_ms BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups for streaming and history
CREATE INDEX IF NOT EXISTS idx_caption_events_session_seq
  ON amiko_meet_caption_events(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_caption_events_session_ts
  ON amiko_meet_caption_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_caption_events_session_final
  ON amiko_meet_caption_events(session_id, is_final)
  WHERE is_final = true;

-- ── User Caption Preferences ──────────────────────────
-- Per-user settings for subtitle display
CREATE TABLE IF NOT EXISTS amiko_meet_caption_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captions_enabled BOOLEAN DEFAULT true,
  font_size TEXT DEFAULT 'medium'
    CHECK (font_size IN ('small', 'medium', 'large')),
  position TEXT DEFAULT 'bottom'
    CHECK (position IN ('top', 'bottom')),
  speaking_language TEXT DEFAULT 'es'
    CHECK (speaking_language IN ('ko', 'es')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_caption_prefs UNIQUE (user_id)
);

-- ── Auto-update timestamps ────────────────────────────
CREATE OR REPLACE FUNCTION update_caption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stt_tasks_updated_at ON amiko_meet_stt_tasks;
CREATE TRIGGER trg_stt_tasks_updated_at
  BEFORE UPDATE ON amiko_meet_stt_tasks
  FOR EACH ROW EXECUTE FUNCTION update_caption_updated_at();

DROP TRIGGER IF EXISTS trg_caption_prefs_updated_at ON amiko_meet_caption_preferences;
CREATE TRIGGER trg_caption_prefs_updated_at
  BEFORE UPDATE ON amiko_meet_caption_preferences
  FOR EACH ROW EXECUTE FUNCTION update_caption_updated_at();

-- ── RLS Policies ──────────────────────────────────────
ALTER TABLE amiko_meet_stt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_caption_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_caption_preferences ENABLE ROW LEVEL SECURITY;

-- STT tasks: participants can read, host/admin can write
CREATE POLICY "stt_tasks_read" ON amiko_meet_stt_tasks
  FOR SELECT USING (true);
CREATE POLICY "stt_tasks_insert" ON amiko_meet_stt_tasks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "stt_tasks_update" ON amiko_meet_stt_tasks
  FOR UPDATE USING (true);

-- Caption events: anyone can read, authenticated can insert
CREATE POLICY "caption_events_read" ON amiko_meet_caption_events
  FOR SELECT USING (true);
CREATE POLICY "caption_events_insert" ON amiko_meet_caption_events
  FOR INSERT WITH CHECK (true);

-- Caption preferences: users manage their own
CREATE POLICY "caption_prefs_all" ON amiko_meet_caption_preferences
  FOR ALL USING (true);

-- ============================================================
-- End of Phase 2 migration
-- ============================================================

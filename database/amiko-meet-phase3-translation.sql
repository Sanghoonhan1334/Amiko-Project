-- ============================================================
-- AMIKO Meet Phase 3: Real-Time Translation (es ↔ ko)
-- Run this migration AFTER amiko-meet-phase2-captions.sql
-- ============================================================

-- ── Translation Events ────────────────────────────────
-- Each caption event that gets translated produces one row here.
-- Links 1:1 to amiko_meet_caption_events via caption_event_id.
CREATE TABLE IF NOT EXISTS amiko_meet_translation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  caption_event_id UUID NOT NULL REFERENCES amiko_meet_caption_events(id) ON DELETE CASCADE,

  -- Original text (copied from caption event for self-contained queries)
  original_content TEXT NOT NULL,
  original_language TEXT NOT NULL
    CHECK (original_language IN ('ko', 'es', 'mixed', 'unknown')),

  -- Translated text
  translated_content TEXT NOT NULL,
  translated_language TEXT NOT NULL
    CHECK (translated_language IN ('ko', 'es')),

  -- Speaker info (copied for convenience)
  speaker_user_id UUID REFERENCES auth.users(id),
  speaker_name TEXT,

  -- Metadata
  provider TEXT NOT NULL DEFAULT 'mock'
    CHECK (provider IN ('deepseek', 'google', 'libretranslate', 'mock')),
  translation_ms INTEGER, -- how long the translation took in ms
  is_final BOOLEAN DEFAULT false,
  sequence_number SERIAL,
  error_message TEXT, -- null = success, else failure reason

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One translation per caption event (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_events_caption
  ON amiko_meet_translation_events(caption_event_id);

-- Fast streaming: session + sequence
CREATE INDEX IF NOT EXISTS idx_translation_events_session_seq
  ON amiko_meet_translation_events(session_id, sequence_number);

-- Fast lookup by session + final
CREATE INDEX IF NOT EXISTS idx_translation_events_session_final
  ON amiko_meet_translation_events(session_id, is_final)
  WHERE is_final = true;

-- ── User Translation Preferences ──────────────────────
-- Controls what each user sees during a call
CREATE TABLE IF NOT EXISTS amiko_meet_translation_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display mode controls what the user sees
  --  'none'                   = only original captions (no translation)
  --  'translated_only'        = only the translated text
  --  'original_and_translated' = both original + translated (dual line)
  display_mode TEXT NOT NULL DEFAULT 'original_and_translated'
    CHECK (display_mode IN ('none', 'translated_only', 'original_and_translated')),

  -- target_language: the language the user wants to READ
  -- e.g. a Spanish speaker sets target_language='es' to receive ko→es translations
  target_language TEXT NOT NULL DEFAULT 'es'
    CHECK (target_language IN ('ko', 'es')),

  -- auto_translate: whether translations happen automatically or must be triggered
  auto_translate BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_translation_prefs UNIQUE (user_id)
);

-- ── Auto-update timestamps ────────────────────────────
DROP TRIGGER IF EXISTS trg_translation_prefs_updated_at ON amiko_meet_translation_preferences;
CREATE TRIGGER trg_translation_prefs_updated_at
  BEFORE UPDATE ON amiko_meet_translation_preferences
  FOR EACH ROW EXECUTE FUNCTION update_caption_updated_at();

-- ── RLS Policies ──────────────────────────────────────
ALTER TABLE amiko_meet_translation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_translation_preferences ENABLE ROW LEVEL SECURITY;

-- Translation events: session participants can read, server can write
CREATE POLICY "translation_events_read" ON amiko_meet_translation_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM amiko_meet_participants p
      WHERE p.session_id = amiko_meet_translation_events.session_id
        AND p.user_id = auth.uid()
        AND p.status IN ('enrolled', 'joined')
    )
  );

CREATE POLICY "translation_events_insert" ON amiko_meet_translation_events
  FOR INSERT WITH CHECK (true); -- Server inserts via service role

-- Translation preferences: users manage only their own
CREATE POLICY "translation_prefs_select" ON amiko_meet_translation_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "translation_prefs_insert" ON amiko_meet_translation_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "translation_prefs_update" ON amiko_meet_translation_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "translation_prefs_delete" ON amiko_meet_translation_preferences
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- End of Phase 3 migration
-- ============================================================

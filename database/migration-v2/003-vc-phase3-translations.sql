-- ============================================================
-- VC Marketplace Phase 3: Real-Time Translation (es↔ko)
-- Run AFTER 002-vc-phase2-captions.sql
-- ============================================================

-- ── 1. Translation Events ─────────────────────────────
-- Stores the translated version of each final caption event.
-- Links back to the original vc_caption_events row.
CREATE TABLE IF NOT EXISTS public.vc_translation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caption_event_id UUID REFERENCES public.vc_caption_events(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  source_language TEXT NOT NULL
    CHECK (source_language IN ('ko', 'es', 'en', 'mixed', 'unknown')),
  target_language TEXT NOT NULL
    CHECK (target_language IN ('ko', 'es', 'en')),
  original_content TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  translation_engine TEXT DEFAULT 'google'
    CHECK (translation_engine IN ('google', 'deepseek', 'openai', 'mock', 'fallback')),
  is_final BOOLEAN DEFAULT false,
  speaker_uid INTEGER,
  speaker_name TEXT,
  sequence_number SERIAL,
  timestamp_ms BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_vc_translation_events_session_seq
  ON public.vc_translation_events(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_vc_translation_events_session_ts
  ON public.vc_translation_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vc_translation_events_caption
  ON public.vc_translation_events(caption_event_id);
CREATE INDEX IF NOT EXISTS idx_vc_translation_events_target
  ON public.vc_translation_events(session_id, target_language);

-- ── 2. User Translation Preferences ──────────────────
-- Per-user settings for how they want to see translations
CREATE TABLE IF NOT EXISTS public.vc_translation_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_mode TEXT DEFAULT 'original_and_translated'
    CHECK (display_mode IN ('original_only', 'translated_only', 'original_and_translated')),
  target_language TEXT DEFAULT 'ko'
    CHECK (target_language IN ('ko', 'es', 'en')),
  auto_detect_source BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vc_unique_user_translation_prefs UNIQUE (user_id)
);

-- ── 3. Auto-update timestamp ──────────────────────────
DROP TRIGGER IF EXISTS trg_vc_translation_prefs_updated_at ON public.vc_translation_preferences;
CREATE TRIGGER trg_vc_translation_prefs_updated_at
  BEFORE UPDATE ON public.vc_translation_preferences
  FOR EACH ROW EXECUTE FUNCTION public.vc_caption_updated_at();

-- ── 4. RLS Policies ───────────────────────────────────
ALTER TABLE public.vc_translation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_translation_preferences ENABLE ROW LEVEL SECURITY;

-- Translation events: participants can read, service role inserts
DROP POLICY IF EXISTS "vc_translation_events_select" ON public.vc_translation_events;
CREATE POLICY "vc_translation_events_select" ON public.vc_translation_events
  FOR SELECT USING (true);

-- Translation preferences: users manage their own
DROP POLICY IF EXISTS "vc_translation_prefs_select" ON public.vc_translation_preferences;
CREATE POLICY "vc_translation_prefs_select" ON public.vc_translation_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vc_translation_prefs_insert" ON public.vc_translation_preferences;
CREATE POLICY "vc_translation_prefs_insert" ON public.vc_translation_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vc_translation_prefs_update" ON public.vc_translation_preferences;
CREATE POLICY "vc_translation_prefs_update" ON public.vc_translation_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ── 5. Enable Supabase Realtime for translation events ──
-- (Needed for SSE stream to get INSERT notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_translation_events;

-- ============================================================
-- End of Phase 3 migration
-- ============================================================

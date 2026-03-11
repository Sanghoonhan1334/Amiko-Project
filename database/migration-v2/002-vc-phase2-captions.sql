-- ============================================================
-- VC Marketplace Phase 2: Real-Time Captions / STT
-- Run AFTER add-videocall-marketplace.sql + add-videocall-phase1.sql
-- ============================================================

-- ── 1. STT Task Tracking ──────────────────────────────
-- One task per session: tracks whether captioning is active
CREATE TABLE IF NOT EXISTS public.vc_stt_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'starting', 'active', 'stopping', 'stopped', 'error')),
  builder_token TEXT,                -- Agora STT builder token (server only)
  task_id TEXT,                      -- Agora STT task ID returned by provider
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  started_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one task per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_vc_stt_tasks_session
  ON public.vc_stt_tasks(session_id);

-- ── 2. Caption Events ─────────────────────────────────
-- Every speech fragment (partial or final) is stored here
CREATE TABLE IF NOT EXISTS public.vc_caption_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  speaker_uid INTEGER,               -- Agora numeric UID
  speaker_user_id UUID REFERENCES auth.users(id),
  speaker_name TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('ko', 'es', 'en', 'ja', 'zh', 'mixed', 'unknown')),
  is_final BOOLEAN DEFAULT false,
  confidence NUMERIC(4,3),           -- 0.000 to 1.000
  sequence_number SERIAL,
  timestamp_ms BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups for streaming and history
CREATE INDEX IF NOT EXISTS idx_vc_caption_events_session_seq
  ON public.vc_caption_events(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_vc_caption_events_session_ts
  ON public.vc_caption_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vc_caption_events_session_final
  ON public.vc_caption_events(session_id, is_final)
  WHERE is_final = true;

-- ── 3. User Caption Preferences ───────────────────────
-- Per-user settings for subtitle display (shared across all vc sessions)
CREATE TABLE IF NOT EXISTS public.vc_caption_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captions_enabled BOOLEAN DEFAULT true,
  font_size TEXT DEFAULT 'medium'
    CHECK (font_size IN ('small', 'medium', 'large')),
  position TEXT DEFAULT 'bottom'
    CHECK (position IN ('top', 'bottom')),
  speaking_language TEXT DEFAULT 'es'
    CHECK (speaking_language IN ('ko', 'es', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vc_unique_user_caption_prefs UNIQUE (user_id)
);

-- ── 4. Auto-update timestamps ─────────────────────────
CREATE OR REPLACE FUNCTION public.vc_caption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vc_stt_tasks_updated_at ON public.vc_stt_tasks;
CREATE TRIGGER trg_vc_stt_tasks_updated_at
  BEFORE UPDATE ON public.vc_stt_tasks
  FOR EACH ROW EXECUTE FUNCTION public.vc_caption_updated_at();

DROP TRIGGER IF EXISTS trg_vc_caption_prefs_updated_at ON public.vc_caption_preferences;
CREATE TRIGGER trg_vc_caption_prefs_updated_at
  BEFORE UPDATE ON public.vc_caption_preferences
  FOR EACH ROW EXECUTE FUNCTION public.vc_caption_updated_at();

-- ── 5. RLS Policies ───────────────────────────────────
ALTER TABLE public.vc_stt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_caption_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_caption_preferences ENABLE ROW LEVEL SECURITY;

-- STT tasks: anyone can read status, only service role should write
DROP POLICY IF EXISTS "vc_stt_tasks_select" ON public.vc_stt_tasks;
CREATE POLICY "vc_stt_tasks_select" ON public.vc_stt_tasks
  FOR SELECT USING (true);

-- Caption events: participants can read, webhook/service role inserts
DROP POLICY IF EXISTS "vc_caption_events_select" ON public.vc_caption_events;
CREATE POLICY "vc_caption_events_select" ON public.vc_caption_events
  FOR SELECT USING (true);

-- Caption preferences: users manage their own
DROP POLICY IF EXISTS "vc_caption_prefs_select" ON public.vc_caption_preferences;
CREATE POLICY "vc_caption_prefs_select" ON public.vc_caption_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vc_caption_prefs_insert" ON public.vc_caption_preferences;
CREATE POLICY "vc_caption_prefs_insert" ON public.vc_caption_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vc_caption_prefs_update" ON public.vc_caption_preferences;
CREATE POLICY "vc_caption_prefs_update" ON public.vc_caption_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- End of Phase 2 migration
-- ============================================================

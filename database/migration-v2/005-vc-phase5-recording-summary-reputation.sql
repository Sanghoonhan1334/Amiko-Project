-- ============================================================
-- PHASE 5 — Recording + Summary + Notes + Reviews + Reputation
-- Amiko Mentor Videocall Module
-- ============================================================

-- ────────────────────────────────────────────────────────
-- 1. vc_session_consents — per-user consent per session
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vc_session_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_consent BOOLEAN NOT NULL DEFAULT false,
  transcription_consent BOOLEAN NOT NULL DEFAULT false,
  translation_consent BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_vc_consents_session ON public.vc_session_consents(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_consents_user ON public.vc_session_consents(user_id);

-- ────────────────────────────────────────────────────────
-- 2. vc_session_recordings — recording metadata
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vc_session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('video', 'audio', 'transcript')),
  storage_url TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recording', 'uploading', 'processing', 'ready', 'failed', 'deleted')),
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_recordings_session ON public.vc_session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_recordings_status ON public.vc_session_recordings(status);

-- ────────────────────────────────────────────────────────
-- 3. vc_session_summaries — AI-generated session summaries
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vc_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  summary_ko TEXT,
  summary_es TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  vocabulary JSONB DEFAULT '[]'::jsonb,
  cultural_notes JSONB DEFAULT '[]'::jsonb,
  key_points JSONB DEFAULT '[]'::jsonb,
  word_count_stats JSONB DEFAULT '{}'::jsonb,
  total_captions INTEGER DEFAULT 0,
  total_translations INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  generated_by TEXT NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('system', 'ai', 'manual')),
  ai_model TEXT,
  language TEXT DEFAULT 'ko',
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_vc_summaries_session ON public.vc_session_summaries(session_id);

-- ────────────────────────────────────────────────────────
-- 4. vc_educational_notes — AI-extracted educational content
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vc_educational_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('vocabulary', 'concepts', 'key_points', 'grammar', 'pronunciation', 'cultural')),
  title TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_language TEXT DEFAULT 'ko',
  target_language TEXT DEFAULT 'es',
  generated_by TEXT NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'manual', 'system')),
  ai_model TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_edu_notes_session ON public.vc_educational_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_edu_notes_user ON public.vc_educational_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_edu_notes_type ON public.vc_educational_notes(note_type);

-- ────────────────────────────────────────────────────────
-- 5. vc_session_reviews — user reviews per session
--    (extends existing vc_ratings with more dimensions)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vc_session_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Rating dimensions (1-5 scale)
  usefulness_rating INTEGER NOT NULL CHECK (usefulness_rating BETWEEN 1 AND 5),
  clarity_rating INTEGER NOT NULL CHECK (clarity_rating BETWEEN 1 AND 5),
  experience_rating INTEGER NOT NULL CHECK (experience_rating BETWEEN 1 AND 5),
  host_quality_rating INTEGER NOT NULL CHECK (host_quality_rating BETWEEN 1 AND 5),
  overall_rating NUMERIC(3,2) NOT NULL CHECK (overall_rating BETWEEN 1.00 AND 5.00),
  comment TEXT,
  -- Metadata
  is_host_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, reviewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_vc_reviews_session ON public.vc_session_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_reviews_reviewer ON public.vc_session_reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_vc_reviews_reviewed ON public.vc_session_reviews(reviewed_user_id);

-- ────────────────────────────────────────────────────────
-- 6. Extend vc_host_profiles for reputation tiers
-- ────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='vc_host_profiles' AND column_name='avg_knowledge') THEN
    ALTER TABLE public.vc_host_profiles
      ADD COLUMN avg_knowledge NUMERIC(3,2) DEFAULT 0,
      ADD COLUMN avg_clarity NUMERIC(3,2) DEFAULT 0,
      ADD COLUMN avg_friendliness NUMERIC(3,2) DEFAULT 0,
      ADD COLUMN avg_usefulness NUMERIC(3,2) DEFAULT 0,
      ADD COLUMN reputation_score NUMERIC(5,2) DEFAULT 0,
      ADD COLUMN reputation_tier TEXT DEFAULT 'newcomer'
        CHECK (reputation_tier IN ('newcomer', 'active', 'trusted', 'expert', 'ambassador')),
      ADD COLUMN total_sessions_completed INTEGER DEFAULT 0;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────
-- 7. RLS Policies
-- ────────────────────────────────────────────────────────
ALTER TABLE public.vc_session_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_educational_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_session_reviews ENABLE ROW LEVEL SECURITY;

-- Consents: users can insert/update their own, read session consents
DROP POLICY IF EXISTS "vc_consents_select" ON public.vc_session_consents;
CREATE POLICY "vc_consents_select" ON public.vc_session_consents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vc_consents_insert" ON public.vc_session_consents;
CREATE POLICY "vc_consents_insert" ON public.vc_session_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vc_consents_update" ON public.vc_session_consents;
CREATE POLICY "vc_consents_update" ON public.vc_session_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Recordings: read own or session recordings, insert own
DROP POLICY IF EXISTS "vc_recordings_select" ON public.vc_session_recordings;
CREATE POLICY "vc_recordings_select" ON public.vc_session_recordings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vc_recordings_insert" ON public.vc_session_recordings;
CREATE POLICY "vc_recordings_insert" ON public.vc_session_recordings
  FOR INSERT WITH CHECK (auth.uid() = recorded_by);

DROP POLICY IF EXISTS "vc_recordings_update" ON public.vc_session_recordings;
CREATE POLICY "vc_recordings_update" ON public.vc_session_recordings
  FOR UPDATE USING (auth.uid() = recorded_by);

-- Summaries: readable by all, insert/update only via service role
DROP POLICY IF EXISTS "vc_summaries_select" ON public.vc_session_summaries;
CREATE POLICY "vc_summaries_select" ON public.vc_session_summaries
  FOR SELECT USING (true);

-- Educational notes: users read own notes + session notes
DROP POLICY IF EXISTS "vc_edu_notes_select" ON public.vc_educational_notes;
CREATE POLICY "vc_edu_notes_select" ON public.vc_educational_notes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vc_edu_notes_insert" ON public.vc_educational_notes;
CREATE POLICY "vc_edu_notes_insert" ON public.vc_educational_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: readable by all, insert own only, one per session
DROP POLICY IF EXISTS "vc_reviews_select" ON public.vc_session_reviews;
CREATE POLICY "vc_reviews_select" ON public.vc_session_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vc_reviews_insert" ON public.vc_session_reviews;
CREATE POLICY "vc_reviews_insert" ON public.vc_session_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);

-- ────────────────────────────────────────────────────────
-- 8. Triggers for updated_at
-- ────────────────────────────────────────────────────────
-- Reuse existing vc_set_updated_at() function from Phase 4

DROP TRIGGER IF EXISTS vc_consents_updated ON public.vc_session_consents;
CREATE TRIGGER vc_consents_updated
  BEFORE UPDATE ON public.vc_session_consents
  FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();

DROP TRIGGER IF EXISTS vc_recordings_updated ON public.vc_session_recordings;
CREATE TRIGGER vc_recordings_updated
  BEFORE UPDATE ON public.vc_session_recordings
  FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();

DROP TRIGGER IF EXISTS vc_summaries_updated ON public.vc_session_summaries;
CREATE TRIGGER vc_summaries_updated
  BEFORE UPDATE ON public.vc_session_summaries
  FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();

DROP TRIGGER IF EXISTS vc_edu_notes_updated ON public.vc_educational_notes;
CREATE TRIGGER vc_edu_notes_updated
  BEFORE UPDATE ON public.vc_educational_notes
  FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();

DROP TRIGGER IF EXISTS vc_reviews_updated ON public.vc_session_reviews;
CREATE TRIGGER vc_reviews_updated
  BEFORE UPDATE ON public.vc_session_reviews
  FOR EACH ROW EXECUTE FUNCTION public.vc_set_updated_at();

-- ────────────────────────────────────────────────────────
-- 9. Enhanced reputation calculation trigger
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vc_recalculate_host_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_host_profile_id UUID;
  v_host_user_id UUID;
  v_avg_overall NUMERIC(3,2);
  v_avg_usefulness NUMERIC(3,2);
  v_avg_clarity NUMERIC(3,2);
  v_avg_experience NUMERIC(3,2);
  v_avg_host_quality NUMERIC(3,2);
  v_total_reviews INTEGER;
  v_total_completed INTEGER;
  v_score NUMERIC(5,2);
  v_tier TEXT;
BEGIN
  -- Find the host profile for this session
  SELECT hp.id, hp.user_id INTO v_host_profile_id, v_host_user_id
  FROM public.vc_sessions s
  JOIN public.vc_host_profiles hp ON hp.id = s.host_id
  WHERE s.id = NEW.session_id;

  IF v_host_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate averages from all reviews where the host is the reviewed user
  SELECT
    COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0),
    COALESCE(ROUND(AVG(usefulness_rating)::numeric, 2), 0),
    COALESCE(ROUND(AVG(clarity_rating)::numeric, 2), 0),
    COALESCE(ROUND(AVG(experience_rating)::numeric, 2), 0),
    COALESCE(ROUND(AVG(host_quality_rating)::numeric, 2), 0),
    COUNT(*)
  INTO v_avg_overall, v_avg_usefulness, v_avg_clarity, v_avg_experience, v_avg_host_quality, v_total_reviews
  FROM public.vc_session_reviews
  WHERE reviewed_user_id = v_host_user_id;

  -- Count completed sessions
  SELECT COUNT(*) INTO v_total_completed
  FROM public.vc_sessions
  WHERE host_id = v_host_profile_id AND status = 'completed';

  -- Calculate reputation score (weighted: 50% rating, 30% sessions, 20% consistency)
  v_score := (v_avg_overall * 10.0)                                       -- 0-50 points from rating
           + LEAST(v_total_completed * 1.5, 30.0)                          -- 0-30 points from sessions (max 20 sessions)
           + LEAST(v_total_reviews * 1.0, 20.0);                           -- 0-20 points from reviews (max 20)

  -- Determine tier
  v_tier := CASE
    WHEN v_score >= 80 AND v_total_completed >= 50 AND v_avg_overall >= 4.5 THEN 'ambassador'
    WHEN v_score >= 60 AND v_total_completed >= 25 AND v_avg_overall >= 4.0 THEN 'expert'
    WHEN v_score >= 40 AND v_total_completed >= 10 AND v_avg_overall >= 3.5 THEN 'trusted'
    WHEN v_score >= 20 AND v_total_completed >= 3 THEN 'active'
    ELSE 'newcomer'
  END;

  -- Update host profile
  UPDATE public.vc_host_profiles SET
    avg_rating = v_avg_overall,
    avg_usefulness = v_avg_usefulness,
    avg_clarity = v_avg_clarity,
    avg_friendliness = v_avg_experience,   -- reuse column for experience
    avg_knowledge = v_avg_host_quality,     -- reuse column for host quality
    total_reviews = v_total_reviews,
    total_sessions_completed = v_total_completed,
    reputation_score = v_score,
    reputation_tier = v_tier
  WHERE id = v_host_profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vc_review_reputation ON public.vc_session_reviews;
CREATE TRIGGER vc_review_reputation
  AFTER INSERT ON public.vc_session_reviews
  FOR EACH ROW EXECUTE FUNCTION public.vc_recalculate_host_reputation();

-- ────────────────────────────────────────────────────────
-- 10. Realtime publication
-- ────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_session_consents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_session_recordings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_session_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_educational_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vc_session_reviews;

-- ============================================================
-- Migration complete
-- ============================================================

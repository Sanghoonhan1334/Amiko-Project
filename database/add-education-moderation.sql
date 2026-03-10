-- ============================================================
-- Education Module — Moderation (Phase 5)
-- ============================================================
-- Tables: education_moderation_reports, education_moderation_flags
-- Run AFTER: supabase-init.sql, add-education-module-v2.sql
-- ============================================================

-- 1. Reports submitted by users during or after a session
CREATE TABLE IF NOT EXISTS education_moderation_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  reporter_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type     TEXT NOT NULL DEFAULT 'other'
                    CHECK (report_type IN ('user_behavior','message_content','technical','other')),
  severity        TEXT NOT NULL DEFAULT 'low'
                    CHECK (severity IN ('low','medium','high','critical')),
  description     TEXT NOT NULL,
  -- evidence: { caption_event_id?, chat_message_id?, timestamp_ms?, screenshot_url? }
  evidence        JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reviewing','actioned','dismissed')),
  admin_notes     TEXT,
  actioned_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actioned_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Auto-generated flags from transcript/chat analysis
CREATE TABLE IF NOT EXISTS education_moderation_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  source_type     TEXT NOT NULL CHECK (source_type IN ('caption','translation','chat')),
  source_id       UUID,                -- caption_event_id or chat_message_id
  flagged_text    TEXT NOT NULL,
  trigger_pattern TEXT,               -- regex/keyword that triggered this
  severity        TEXT NOT NULL DEFAULT 'low'
                    CHECK (severity IN ('low','medium','high')),
  auto_generated  BOOLEAN NOT NULL DEFAULT TRUE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_educ_mod_reports_session  ON education_moderation_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_educ_mod_reports_status   ON education_moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_educ_mod_reports_reporter ON education_moderation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_educ_mod_flags_session    ON education_moderation_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_educ_mod_flags_status     ON education_moderation_flags(status);

-- RLS
ALTER TABLE education_moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_moderation_flags ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own reports
CREATE POLICY "users_own_reports" ON education_moderation_reports
  FOR ALL USING (reporter_id = auth.uid());

-- Service role bypass (API routes use service role)
CREATE POLICY "service_role_bypass_reports" ON education_moderation_reports
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_flags" ON education_moderation_flags
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_education_moderation_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_educ_mod_reports_updated_at
  BEFORE UPDATE ON education_moderation_reports
  FOR EACH ROW EXECUTE FUNCTION update_education_moderation_reports_updated_at();

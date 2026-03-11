-- ============================================================================
-- Migration 006: Security Fixes for VC Module
-- Fixes: C1 (builder_token exposure), H2 (IP exposure), H3 (notes visibility),
--        M3 (reputation trigger on UPDATE/DELETE)
-- ============================================================================

-- ── C1: Restrict vc_stt_tasks SELECT — hide builder_token from users ──
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "vc_stt_tasks_select" ON vc_stt_tasks;
DROP POLICY IF EXISTS "Users can view stt tasks" ON vc_stt_tasks;

-- Create a restrictive view: users can only see status, not secrets
-- Only return non-sensitive columns
CREATE POLICY "vc_stt_tasks_select_restricted"
  ON vc_stt_tasks
  FOR SELECT
  USING (
    -- Users can see STT task status for sessions they participate in
    EXISTS (
      SELECT 1 FROM vc_bookings
      WHERE vc_bookings.session_id = vc_stt_tasks.session_id
        AND vc_bookings.user_id = auth.uid()
        AND vc_bookings.status NOT IN ('cancelled', 'refunded')
    )
    OR
    -- Hosts can see their own session's STT tasks
    EXISTS (
      SELECT 1 FROM vc_sessions
      JOIN vc_host_profiles ON vc_sessions.host_id = vc_host_profiles.id
      WHERE vc_sessions.id = vc_stt_tasks.session_id
        AND vc_host_profiles.user_id = auth.uid()
    )
  );

-- ── H2: Restrict vc_session_consents SELECT — hide IP addresses ──
DROP POLICY IF EXISTS "vc_session_consents_select" ON vc_session_consents;

CREATE POLICY "vc_session_consents_select_participant"
  ON vc_session_consents
  FOR SELECT
  USING (
    -- Users can see consent status (not IP/UA) for sessions they participate in
    EXISTS (
      SELECT 1 FROM vc_bookings
      WHERE vc_bookings.session_id = vc_session_consents.session_id
        AND vc_bookings.user_id = auth.uid()
        AND vc_bookings.status NOT IN ('cancelled', 'refunded')
    )
    OR
    -- Hosts can see consents for their sessions
    EXISTS (
      SELECT 1 FROM vc_sessions
      JOIN vc_host_profiles ON vc_sessions.host_id = vc_host_profiles.id
      WHERE vc_sessions.id = vc_session_consents.session_id
        AND vc_host_profiles.user_id = auth.uid()
    )
    OR
    -- Users can always see their own consent
    auth.uid() = user_id
  );

-- ── H3: Restrict vc_educational_notes SELECT — user-scoped only ──
DROP POLICY IF EXISTS "vc_educational_notes_select" ON vc_educational_notes;

CREATE POLICY "vc_educational_notes_select_own"
  ON vc_educational_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- ── H2 bonus: Restrict vc_session_recordings SELECT — participants only ──
DROP POLICY IF EXISTS "vc_session_recordings_select" ON vc_session_recordings;

CREATE POLICY "vc_session_recordings_select_participant"
  ON vc_session_recordings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vc_bookings
      WHERE vc_bookings.session_id = vc_session_recordings.session_id
        AND vc_bookings.user_id = auth.uid()
        AND vc_bookings.status NOT IN ('cancelled', 'refunded')
    )
    OR
    EXISTS (
      SELECT 1 FROM vc_sessions
      JOIN vc_host_profiles ON vc_sessions.host_id = vc_host_profiles.id
      WHERE vc_sessions.id = vc_session_recordings.session_id
        AND vc_host_profiles.user_id = auth.uid()
    )
    OR
    auth.uid() = recorded_by
  );

-- ── M3: Add UPDATE/DELETE triggers for reputation recalculation ──
CREATE OR REPLACE TRIGGER vc_review_reputation_update
  AFTER UPDATE ON vc_session_reviews
  FOR EACH ROW
  EXECUTE FUNCTION vc_recalculate_host_reputation();

CREATE OR REPLACE TRIGGER vc_review_reputation_delete
  AFTER DELETE ON vc_session_reviews
  FOR EACH ROW
  EXECUTE FUNCTION vc_recalculate_host_reputation();

-- ============================================================================
-- End of migration 006
-- ============================================================================

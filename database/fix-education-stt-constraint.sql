-- ============================================================
-- Education Phase 2 — STT Captions: Fix constraint + add missing indexes
-- Fixes UNIQUE(session_id, status) that blocks multiple stopped/failed rows.
-- Replaces it with a partial unique index that only enforces one active task.
-- ============================================================

-- 1. Drop the problematic full UNIQUE constraint (if it exists as a table constraint)
ALTER TABLE education_stt_tasks
  DROP CONSTRAINT IF EXISTS education_stt_tasks_session_id_status_key;

-- 2. Add a partial unique index: only one active/starting/pending task per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_stt_tasks_one_active_per_session
  ON education_stt_tasks (session_id)
  WHERE status IN ('pending', 'starting', 'active');

-- 3. Add composite index for efficient SSE polling
CREATE INDEX IF NOT EXISTS idx_caption_events_session_seq
  ON education_caption_events (session_id, sequence_number)
  WHERE is_partial = false;

-- 4. Add index on speaker_uid for fast speaker lookups
CREATE INDEX IF NOT EXISTS idx_caption_events_speaker
  ON education_caption_events (session_id, speaker_uid);

-- 5. Add sequence_number default using the sequence
ALTER TABLE education_caption_events
  ALTER COLUMN sequence_number SET DEFAULT nextval('education_caption_seq');

-- 6. Ensure all RLS policies use service role for stt_tasks management
-- (service role bypasses RLS; make the policy name explicit)
DROP POLICY IF EXISTS stt_tasks_service ON education_stt_tasks;
CREATE POLICY stt_tasks_service_role ON education_stt_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their related STT task status
CREATE POLICY IF NOT EXISTS stt_tasks_read_enrolled ON education_stt_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM education_enrollments e
      WHERE e.course_id = education_stt_tasks.course_id
        AND e.student_id = auth.uid()
        AND e.payment_status = 'completed'
    )
    OR
    EXISTS (
      SELECT 1 FROM instructor_profiles ip
        JOIN education_courses c ON c.id = education_stt_tasks.course_id
      WHERE ip.user_id = auth.uid()
    )
  );

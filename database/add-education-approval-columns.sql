-- ============================================================
-- AMIKO Education — Approval & Publication audit columns
-- Adds approved_at, approved_by, published_at to education_courses.
-- Safe to re-run (uses IF NOT EXISTS / DO $$ guards).
-- ============================================================

-- Add approved_at column (timestamp when an admin approved the course)
ALTER TABLE education_courses
  ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMPTZ;

-- Add approved_by column (admin user_id who approved)
ALTER TABLE education_courses
  ADD COLUMN IF NOT EXISTS approved_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add published_at column (timestamp when the instructor published)
ALTER TABLE education_courses
  ADD COLUMN IF NOT EXISTS published_at   TIMESTAMPTZ;

-- ============================================================
-- Update status constraint to include 'submitted_for_review'
-- and 'changes_requested' if not already present
-- (idempotent via DROP + re-CREATE)
-- ============================================================
ALTER TABLE education_courses
  DROP CONSTRAINT IF EXISTS education_courses_status_check;

ALTER TABLE education_courses
  ADD CONSTRAINT education_courses_status_check
  CHECK (status IN (
    'draft',
    'submitted_for_review',
    'changes_requested',
    'approved',
    'rejected',
    'published',
    'in_progress',
    'completed',
    'cancelled',
    'archived'
  ));

-- ============================================================
-- Backfill: mark already-published courses with published_at
-- (approximate: use updated_at as a proxy since publish date
-- was not previously tracked)
-- ============================================================
UPDATE education_courses
  SET published_at = COALESCE(updated_at, created_at)
  WHERE status IN ('published', 'in_progress', 'completed')
    AND published_at IS NULL;

-- Index for sorting/filtering by approval date
CREATE INDEX IF NOT EXISTS idx_education_courses_approved_at
  ON education_courses(approved_at)
  WHERE approved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_education_courses_published_at
  ON education_courses(published_at)
  WHERE published_at IS NOT NULL;

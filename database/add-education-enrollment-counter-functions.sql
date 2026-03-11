-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Atomic enrolled_count helpers for education_courses
-- Purpose: Eliminates the fetch-then-update race condition when multiple
--          students simultaneously complete payment for the same course.
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Increment enrolled_count (with cap at max_students)
-- Returns TRUE if the increment succeeded, FALSE if the course is full.
CREATE OR REPLACE FUNCTION increment_course_enrolled_count(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE education_courses
  SET enrolled_count = enrolled_count + 1
  WHERE id = p_course_id
    AND enrolled_count < max_students   -- respect capacity limit atomically
  RETURNING 1 INTO v_updated;

  RETURN (v_updated IS NOT NULL);
END;
$$;

-- Decrement enrolled_count (never below 0)
CREATE OR REPLACE FUNCTION decrement_course_enrolled_count(p_course_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE education_courses
  SET enrolled_count = GREATEST(enrolled_count - 1, 0)
  WHERE id = p_course_id;
END;
$$;

-- Grant execute to authenticated + service role
GRANT EXECUTE ON FUNCTION increment_course_enrolled_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_course_enrolled_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_course_enrolled_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_course_enrolled_count(UUID) TO service_role;

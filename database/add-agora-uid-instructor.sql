-- Migration: Add agora_uid_instructor column to education_sessions
-- This column is read/written by the access-token route but was never created
-- in any previous migration.

ALTER TABLE education_sessions
  ADD COLUMN IF NOT EXISTS agora_uid_instructor INTEGER DEFAULT NULL;

COMMENT ON COLUMN education_sessions.agora_uid_instructor
  IS 'Deterministic Agora UID for the instructor, persisted for stable reconnects';

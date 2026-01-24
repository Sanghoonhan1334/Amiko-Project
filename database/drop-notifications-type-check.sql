-- Drop the check constraint that's preventing 'like' type notifications
-- This constraint might have been added manually or through Supabase interface

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Verify the constraint was dropped
SELECT
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass
AND contype = 'c';

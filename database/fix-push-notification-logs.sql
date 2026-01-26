-- Fix push_notification_logs table to include missing columns
-- The send-push API expects these columns but they were missing

ALTER TABLE public.push_notification_logs
ADD COLUMN IF NOT EXISTS title VARCHAR(200),
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Update existing records to have a default status
UPDATE public.push_notification_logs
SET status = 'completed'
WHERE status IS NULL AND success = true;

UPDATE public.push_notification_logs
SET status = 'failed'
WHERE status IS NULL AND success = false;

-- Add check constraint for status
ALTER TABLE public.push_notification_logs
ADD CONSTRAINT IF NOT EXISTS chk_push_logs_status
CHECK (status IN ('pending', 'completed', 'failed'));

-- Verify the table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'push_notification_logs'
AND table_schema = 'public'
ORDER BY ordinal_position;

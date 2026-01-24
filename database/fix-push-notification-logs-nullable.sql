-- Fix push_notification_logs table - make device_token nullable
-- The API creates one log entry per notification, not per device token

ALTER TABLE public.push_notification_logs
ALTER COLUMN device_token DROP NOT NULL;

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

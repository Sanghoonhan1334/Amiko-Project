-- =====================================================
-- Supabase Realtime Broadcast (topic-scoped) for chat + notifications
-- Topics:
--   chat_messages            -> room:<room_id>:messages
--   chat_room_participants   -> room:<room_id>:participants
--   notifications            -> user:<user_id>:notifications
-- =====================================================

BEGIN;

-- 1) Ensure tables are added to publication (optional for broadcast,
--    useful if you also use postgres_changes subscriptions).
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_participants;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 2) Realtime authorization policies (private channels)
--    These policies gate who can subscribe/publish to specific topics.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_select_topic_scoped" ON realtime.messages;
CREATE POLICY "realtime_select_topic_scoped"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 3) = 'notifications'
    AND split_part(realtime.topic(), ':', 2)::uuid = auth.uid()
  )
  OR
  (
    split_part(realtime.topic(), ':', 1) = 'room'
    AND split_part(realtime.topic(), ':', 3) IN ('messages', 'participants')
    AND EXISTS (
      SELECT 1
      FROM public.chat_room_participants crp
      WHERE crp.room_id = split_part(realtime.topic(), ':', 2)::uuid
        AND crp.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "realtime_insert_topic_scoped" ON realtime.messages;
CREATE POLICY "realtime_insert_topic_scoped"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 3) = 'notifications'
    AND split_part(realtime.topic(), ':', 2)::uuid = auth.uid()
  )
  OR
  (
    split_part(realtime.topic(), ':', 1) = 'room'
    AND split_part(realtime.topic(), ':', 3) IN ('messages', 'participants')
    AND EXISTS (
      SELECT 1
      FROM public.chat_room_participants crp
      WHERE crp.room_id = split_part(realtime.topic(), ':', 2)::uuid
        AND crp.user_id = auth.uid()
    )
  )
);

-- 3) Trigger functions that broadcast row changes to topic channels

CREATE OR REPLACE FUNCTION public.broadcast_chat_messages_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic text;
BEGIN
  topic := 'room:' || COALESCE(NEW.room_id, OLD.room_id)::text || ':messages';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_chat_room_participants_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic text;
BEGIN
  topic := 'room:' || COALESCE(NEW.room_id, OLD.room_id)::text || ':participants';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notifications_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic text;
BEGIN
  topic := 'user:' || COALESCE(NEW.user_id, OLD.user_id)::text || ':notifications';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Attach triggers

DROP TRIGGER IF EXISTS tr_broadcast_chat_messages_changes ON public.chat_messages;
CREATE TRIGGER tr_broadcast_chat_messages_changes
AFTER INSERT OR UPDATE OR DELETE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_chat_messages_changes();

DROP TRIGGER IF EXISTS tr_broadcast_chat_room_participants_changes ON public.chat_room_participants;
CREATE TRIGGER tr_broadcast_chat_room_participants_changes
AFTER INSERT OR UPDATE OR DELETE ON public.chat_room_participants
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_chat_room_participants_changes();

DROP TRIGGER IF EXISTS tr_broadcast_notifications_changes ON public.notifications;
CREATE TRIGGER tr_broadcast_notifications_changes
AFTER INSERT OR UPDATE OR DELETE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_notifications_changes();

COMMIT;

-- =====================================================
-- Client subscription topics
--  chat messages:            room:<room_id>:messages
--  participants changes:     room:<room_id>:participants
--  user notifications:       user:<user_id>:notifications
-- =====================================================

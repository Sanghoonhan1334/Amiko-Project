-- Fix missing UPDATE RLS policy for chat_room_participants
-- This allows authenticated users to update only their own participant row (e.g. last_read_at)

ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own participant row" ON public.chat_room_participants;
CREATE POLICY "Users can update own participant row"
  ON public.chat_room_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep insert/delete self-scoped policies in place for consistency across environments
DROP POLICY IF EXISTS "Users can join chat rooms" ON public.chat_room_participants;
CREATE POLICY "Users can join chat rooms"
  ON public.chat_room_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave chat rooms" ON public.chat_room_participants;
CREATE POLICY "Users can leave chat rooms"
  ON public.chat_room_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- K-Chat Zone Database Schema

-- 1. Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('country', 'fanclub')),
  country TEXT, -- For country type
  fanclub_name TEXT, -- For fanclub type
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  participant_count INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Chat Room Participants Table
CREATE TABLE IF NOT EXISTS chat_room_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_country ON chat_rooms(country);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_fanclub ON chat_rooms(fanclub_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_room_id ON chat_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_user_id ON chat_room_participants(user_id);

-- 5. Function to update participant_count
CREATE OR REPLACE FUNCTION update_chat_room_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_rooms
    SET participant_count = participant_count + 1
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_rooms
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger for participant_count
CREATE TRIGGER trigger_update_participant_count
AFTER INSERT OR DELETE ON chat_room_participants
FOR EACH ROW EXECUTE FUNCTION update_chat_room_participant_count();

-- 7. Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger for updated_at
CREATE TRIGGER trigger_update_chat_rooms_updated_at
BEFORE UPDATE ON chat_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS Policies for chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active chat rooms"
  ON chat_rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chat rooms"
  ON chat_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- 10. RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
  );

-- 11. RLS Policies for chat_room_participants
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON chat_room_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join chat rooms"
  ON chat_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant row"
  ON chat_room_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave chat rooms"
  ON chat_room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants;

-- 13. Insert sample data (optional)
-- Uncomment to insert sample rooms
/*
INSERT INTO chat_rooms (name, type, country, description, created_by)
VALUES
  ('🇰🇷 Korea Chat', 'country', 'Korea', 'Chat about Korean culture and K-pop', '00000000-0000-0000-0000-000000000000'),
  ('🇪🇸 Spain Chat', 'country', 'Spain', 'Chat in Spanish about K-pop', '00000000-0000-0000-0000-000000000000'),
  ('🇧🇹 BTS Army', 'fanclub', NULL, 'BTS fan club chat', '00000000-0000-0000-0000-000000000000');
*/

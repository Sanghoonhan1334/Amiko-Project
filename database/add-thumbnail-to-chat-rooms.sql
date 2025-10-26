-- Add thumbnail_url column to chat_rooms table
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment
COMMENT ON COLUMN chat_rooms.thumbnail_url IS 'URL of the room thumbnail image';

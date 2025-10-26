-- Add image_url column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN chat_messages.image_url IS 'URL of the image uploaded in the chat message';

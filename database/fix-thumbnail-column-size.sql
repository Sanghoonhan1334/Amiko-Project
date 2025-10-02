-- Fix thumbnail column size to support Base64 data
-- Change from VARCHAR(500) to TEXT to accommodate large Base64 strings

ALTER TABLE korean_news 
ALTER COLUMN thumbnail TYPE TEXT;

-- Add comment to document the change
COMMENT ON COLUMN korean_news.thumbnail IS 'Base64 encoded image data or URL - changed from VARCHAR(500) to TEXT to support large Base64 strings';

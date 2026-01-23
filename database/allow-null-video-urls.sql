-- video_url과 thumbnail_url을 NULL 허용하도록 수정
-- 목업 데이터를 위해 필요

ALTER TABLE public.dance_videos 
  ALTER COLUMN video_url DROP NOT NULL,
  ALTER COLUMN thumbnail_url DROP NOT NULL;

-- 확인
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'dance_videos'
  AND column_name IN ('video_url', 'thumbnail_url');


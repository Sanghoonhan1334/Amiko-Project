-- 댄스 비디오 썸네일을 실제 댄스 이미지로 업데이트
-- 기존 데이터를 업데이트하는 스크립트

-- 가이드 영상 썸네일 업데이트 (제목으로 식별)
UPDATE public.dance_videos
SET thumbnail_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop'
WHERE (title ILIKE '%guía%' OR title ILIKE '%guide%' OR title ILIKE '%Video guía%')
  AND status = 'approved';

-- 일반 영상들의 썸네일을 다양한 댄스 이미지로 업데이트
UPDATE public.dance_videos
SET thumbnail_url = CASE 
  WHEN title LIKE '%Dance Cover%' OR title LIKE '%K-POP Dance Cover%' THEN 
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop'
  WHEN title LIKE '%Random Play Dance%' OR title LIKE '%Challenge%' THEN 
    'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=600&fit=crop'
  WHEN title LIKE '%Practice%' THEN 
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop'
  WHEN title LIKE '%Cover Video%' THEN 
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop'
  WHEN title LIKE '%Performance%' THEN 
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=600&fit=crop'
  WHEN title LIKE '%Random Dance%' THEN 
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop'
  ELSE 
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop'
END
WHERE status = 'approved' 
  AND (thumbnail_url IS NULL OR thumbnail_url LIKE '%placeholder%' OR thumbnail_url LIKE '%example.com%')
  AND (title NOT ILIKE '%guía%' AND title NOT ILIKE '%guide%' AND title NOT ILIKE '%Video guía%');

-- 업데이트 결과 확인
SELECT 
  id,
  title,
  thumbnail_url,
  status
FROM public.dance_videos
WHERE status = 'approved'
ORDER BY created_at DESC;


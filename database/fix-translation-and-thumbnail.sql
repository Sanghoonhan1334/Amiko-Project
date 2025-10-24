-- ============================================
-- 번역키 문제 해결 및 썸네일 이미지 설정
-- Fix Translation Keys and Set Thumbnail Images
-- ============================================

-- 1. K-POP 스타 MBTI 테스트에 썸네일 이미지 설정
UPDATE public.quizzes 
SET thumbnail_url = '/celebs/bts.webp'
WHERE title ILIKE '%K-POP 스타 MBTI%';

-- 2. 기존 K-POP 스타 테스트에도 썸네일 설정
UPDATE public.quizzes 
SET thumbnail_url = '/celebs/bts.jpg'
WHERE title ILIKE '%당신과 닮은 K-POP 스타%';

-- 3. 확인
SELECT 
  id,
  title,
  thumbnail_url,
  total_questions,
  category
FROM public.quizzes
ORDER BY created_at DESC;

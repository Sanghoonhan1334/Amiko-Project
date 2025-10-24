-- ============================================
-- 퀴즈 썸네일 이미지 수정
-- Fix Quiz Thumbnail Images
-- ============================================

-- K-POP 스타 MBTI 매칭 테스트에 썸네일 이미지 설정
UPDATE public.quizzes 
SET thumbnail_url = '/celebs/bts.webp'
WHERE id = '268caf0b-0031-4e58-9245-606e3421f1fd'
   OR title ILIKE '%K-POP 스타 MBTI%';

-- 기존 K-POP 스타 테스트에도 썸네일 설정
UPDATE public.quizzes 
SET thumbnail_url = '/celebs/bts.jpg'
WHERE id = 'a0000000-0000-0000-0000-000000000001'
   OR title ILIKE '%당신과 닮은 K-POP 스타%';

-- 확인
SELECT 
  id,
  title,
  thumbnail_url,
  total_questions,
  category
FROM public.quizzes
ORDER BY created_at DESC;

-- posts 테이블에 tags 컬럼 추가
-- Add tags column to posts table

-- tags 컬럼 추가 (TEXT 배열 타입)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 기존 데이터의 tags를 빈 배열로 초기화
UPDATE public.posts 
SET tags = '{}' 
WHERE tags IS NULL;

-- tags 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE public.posts 
ALTER COLUMN tags SET NOT NULL;

-- tags 컬럼에 대한 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- 완료 메시지
SELECT 'tags 컬럼이 성공적으로 추가되었습니다.' as status;

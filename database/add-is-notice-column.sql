-- posts 테이블에 is_notice 컬럼 추가
-- 이미 존재하는 경우 무시

-- 1. is_notice 컬럼 추가 (기본값 false)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_notice BOOLEAN DEFAULT FALSE;

-- 2. is_pinned 컬럼도 확인하고 추가 (혹시 없다면)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_is_notice ON public.posts(is_notice) WHERE is_notice = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned) WHERE is_pinned = true;

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN public.posts.is_notice IS '공지사항 여부';
COMMENT ON COLUMN public.posts.is_pinned IS '상단 고정 여부';

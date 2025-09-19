-- 갤러리 게시물에 인기글 컬럼 추가
ALTER TABLE public.gallery_posts 
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- 인기글 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN public.gallery_posts.is_popular IS '인기글 여부 (24시간 내 높은 인기도)';

-- 인기글 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_popular 
ON public.gallery_posts(is_popular) 
WHERE is_popular = true;

-- 핫글 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_hot 
ON public.gallery_posts(is_hot) 
WHERE is_hot = true;

-- 고정글 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_pinned 
ON public.gallery_posts(is_pinned) 
WHERE is_pinned = true;

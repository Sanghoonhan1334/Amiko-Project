-- 기존 테이블이 있으면 삭제 (주의: 데이터가 모두 삭제됩니다)
DROP TABLE IF EXISTS public.post_comments CASCADE;

-- post_comments 테이블 생성
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid,
  content text NOT NULL,
  like_count integer DEFAULT 0,
  dislike_count integer DEFAULT 0,
  is_deleted boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.gallery_posts(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- parent_comment_id 컬럼 추가 (자기 참조이므로 테이블 생성 후 추가)
ALTER TABLE public.post_comments 
ADD COLUMN parent_comment_id uuid,
ADD CONSTRAINT post_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments (created_at DESC);

-- RLS 활성화
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "Public comments are viewable by everyone." ON public.post_comments;
CREATE POLICY "Public comments are viewable by everyone." ON public.post_comments
  FOR SELECT USING (is_deleted = FALSE);

DROP POLICY IF EXISTS "Users can create comments." ON public.post_comments;
CREATE POLICY "Users can create comments." ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments." ON public.post_comments;
CREATE POLICY "Users can update their own comments." ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments." ON public.post_comments;
CREATE POLICY "Users can delete their own comments." ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 수 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_comment_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.gallery_posts
  SET comment_count = comment_count + 1,
      updated_at = now()
  WHERE id = post_id;
END;
$$;

-- 댓글 수 감소 함수 생성
CREATE OR REPLACE FUNCTION decrement_comment_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.gallery_posts
  SET comment_count = GREATEST(0, comment_count - 1),
      updated_at = now()
  WHERE id = post_id;
END;
$$;


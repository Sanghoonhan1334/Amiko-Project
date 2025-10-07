-- =====================================================
-- 스토리 관련 테이블 생성
-- Description: 스토리, 좋아요, 댓글 테이블 생성
-- Date: 2025-10-07
-- =====================================================

-- 1. stories 테이블 생성
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  text_content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_expired BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. story_likes 테이블 생성 (좋아요)
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- 3. story_comments 테이블 생성 (댓글)
CREATE TABLE IF NOT EXISTS public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON public.story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON public.story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON public.story_comments(user_id);

-- 5. RLS 활성화
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- 6. stories RLS 정책
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.stories;
CREATE POLICY "Public stories are viewable by everyone" ON public.stories
  FOR SELECT USING (is_public = TRUE AND is_expired = FALSE);

DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
CREATE POLICY "Users can view their own stories" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create stories" ON public.stories;
CREATE POLICY "Users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. story_likes RLS 정책
DROP POLICY IF EXISTS "Everyone can view likes" ON public.story_likes;
CREATE POLICY "Everyone can view likes" ON public.story_likes
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can like stories" ON public.story_likes;
CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike stories" ON public.story_likes;
CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. story_comments RLS 정책
DROP POLICY IF EXISTS "Everyone can view comments" ON public.story_comments;
CREATE POLICY "Everyone can view comments" ON public.story_comments
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create comments" ON public.story_comments;
CREATE POLICY "Users can create comments" ON public.story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.story_comments;
CREATE POLICY "Users can delete their own comments" ON public.story_comments
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.story_comments;
CREATE POLICY "Users can update their own comments" ON public.story_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. 좋아요/댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION increment_story_like_count(story_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.stories
  SET like_count = like_count + 1
  WHERE id = story_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_story_like_count(story_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.stories
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = story_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION increment_story_comment_count(story_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.stories
  SET comment_count = comment_count + 1
  WHERE id = story_id_param;
END;
$$;


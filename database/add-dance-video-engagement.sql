-- 댄스 비디오 참여도 기능 추가 (하트, 댓글, 조회수)

-- 1. dance_videos 테이블에 카운터 컬럼 추가
ALTER TABLE public.dance_videos
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. 댄스 비디오 좋아요 테이블
CREATE TABLE IF NOT EXISTS public.dance_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.dance_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- 3. 댄스 비디오 댓글 테이블
CREATE TABLE IF NOT EXISTS public.dance_video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.dance_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 댄스 비디오 조회 기록 테이블 (중복 조회 방지)
CREATE TABLE IF NOT EXISTS public.dance_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.dance_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id, ip_address)
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dance_video_likes_video ON public.dance_video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_dance_video_likes_user ON public.dance_video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_dance_video_comments_video ON public.dance_video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_dance_video_comments_user ON public.dance_video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_dance_video_views_video ON public.dance_video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_dance_videos_like_count ON public.dance_videos(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_dance_videos_view_count ON public.dance_videos(view_count DESC);

-- 6. RLS 정책 활성화
ALTER TABLE public.dance_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_video_views ENABLE ROW LEVEL SECURITY;

-- 좋아요: 모든 사용자 읽기 가능, 본인만 추가/삭제
DROP POLICY IF EXISTS "Anyone can view video likes" ON public.dance_video_likes;
CREATE POLICY "Anyone can view video likes"
  ON public.dance_video_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like videos" ON public.dance_video_likes;
CREATE POLICY "Users can like videos"
  ON public.dance_video_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike videos" ON public.dance_video_likes;
CREATE POLICY "Users can unlike videos"
  ON public.dance_video_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 댓글: 모든 사용자 읽기 가능, 본인만 추가/수정/삭제
DROP POLICY IF EXISTS "Anyone can view video comments" ON public.dance_video_comments;
CREATE POLICY "Anyone can view video comments"
  ON public.dance_video_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add comments" ON public.dance_video_comments;
CREATE POLICY "Users can add comments"
  ON public.dance_video_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.dance_video_comments;
CREATE POLICY "Users can update own comments"
  ON public.dance_video_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.dance_video_comments;
CREATE POLICY "Users can delete own comments"
  ON public.dance_video_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 조회 기록: 모든 사용자 추가 가능, 관리자만 조회 가능
DROP POLICY IF EXISTS "Anyone can add view records" ON public.dance_video_views;
CREATE POLICY "Anyone can add view records"
  ON public.dance_video_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view view records" ON public.dance_video_views;
CREATE POLICY "Only admins can view view records"
  ON public.dance_video_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 7. 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_dance_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dance_videos
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dance_videos
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_dance_video_like_count ON public.dance_video_likes;
CREATE TRIGGER trigger_update_dance_video_like_count
  AFTER INSERT OR DELETE ON public.dance_video_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_dance_video_like_count();

-- 8. 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_dance_video_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dance_videos
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dance_videos
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_dance_video_comment_count ON public.dance_video_comments;
CREATE TRIGGER trigger_update_dance_video_comment_count
  AFTER INSERT OR DELETE ON public.dance_video_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_dance_video_comment_count();

-- 9. 조회수 업데이트 함수
CREATE OR REPLACE FUNCTION increment_dance_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dance_videos
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = NEW.video_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 조회수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_increment_dance_video_view_count ON public.dance_video_views;
CREATE TRIGGER trigger_increment_dance_video_view_count
  AFTER INSERT ON public.dance_video_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_dance_video_view_count();


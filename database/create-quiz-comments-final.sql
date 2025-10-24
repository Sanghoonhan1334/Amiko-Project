-- 퀴즈 댓글 시스템 테이블 생성
-- Quiz Comments System Tables

-- 1. 퀴즈 댓글 테이블
CREATE TABLE IF NOT EXISTS public.quiz_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.quiz_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 퀴즈 댓글 반응 테이블 (좋아요/싫어요)
CREATE TABLE IF NOT EXISTS public.quiz_comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.quiz_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- RLS 활성화
ALTER TABLE public.quiz_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "quiz_comments_select_policy" ON public.quiz_comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "quiz_comments_insert_policy" ON public.quiz_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comments_update_policy" ON public.quiz_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quiz_comments_delete_policy" ON public.quiz_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "quiz_comment_reactions_select_policy" ON public.quiz_comment_reactions FOR SELECT USING (true);
CREATE POLICY "quiz_comment_reactions_insert_policy" ON public.quiz_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comment_reactions_delete_policy" ON public.quiz_comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_quiz_comment_reaction_counts(comment_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.quiz_comments 
  SET 
    like_count = (
      SELECT COUNT(*) 
      FROM public.quiz_comment_reactions 
      WHERE comment_id = comment_uuid AND reaction_type = 'like'
    ),
    dislike_count = (
      SELECT COUNT(*) 
      FROM public.quiz_comment_reactions 
      WHERE comment_id = comment_uuid AND reaction_type = 'dislike'
    ),
    updated_at = NOW()
  WHERE id = comment_uuid;
END;
$$ LANGUAGE plpgsql;

-- 트리거 함수
CREATE OR REPLACE FUNCTION trigger_update_quiz_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_quiz_comment_reaction_counts(NEW.comment_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_quiz_comment_reaction_counts(OLD.comment_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_quiz_comment_reactions_counts ON public.quiz_comment_reactions;
CREATE TRIGGER trigger_quiz_comment_reactions_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_comment_counts();

SELECT 'Quiz comments tables created successfully!' as status;
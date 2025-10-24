-- ============================================
-- 퀴즈 상호작용 및 댓글 테이블 생성
-- Quiz Interaction and Comments Tables
-- ============================================

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

-- 2. 퀴즈 저장 테이블
CREATE TABLE IF NOT EXISTS public.quiz_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- 3. 퀴즈 재밌어요 테이블
CREATE TABLE IF NOT EXISTS public.quiz_fun (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- 4. 퀴즈 정확해요 테이블
CREATE TABLE IF NOT EXISTS public.quiz_accurate (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- 5. 퀴즈 상호작용 통계 테이블
CREATE TABLE IF NOT EXISTS public.quiz_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  fun_count INTEGER DEFAULT 0,
  accurate_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id)
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quiz_comments_quiz_id ON public.quiz_comments(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_comments_user_id ON public.quiz_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_comments_parent_id ON public.quiz_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_quiz_comments_created_at ON public.quiz_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_quiz_saves_quiz_id ON public.quiz_saves(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_saves_user_id ON public.quiz_saves(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_fun_quiz_id ON public.quiz_fun(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_fun_user_id ON public.quiz_fun(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_accurate_quiz_id ON public.quiz_accurate(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_accurate_user_id ON public.quiz_accurate(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_interactions_quiz_id ON public.quiz_interactions(quiz_id);

-- ============================================
-- RLS 정책 설정
-- ============================================

-- 퀴즈 댓글 테이블
ALTER TABLE public.quiz_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 댓글은 모두가 볼 수 있습니다"
  ON public.quiz_comments FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "인증된 사용자는 댓글을 작성할 수 있습니다"
  ON public.quiz_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 댓글을 수정할 수 있습니다"
  ON public.quiz_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 댓글을 삭제할 수 있습니다"
  ON public.quiz_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 퀴즈 저장 테이블
ALTER TABLE public.quiz_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 저장 목록을 볼 수 있습니다"
  ON public.quiz_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "인증된 사용자는 퀴즈를 저장할 수 있습니다"
  ON public.quiz_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 저장을 삭제할 수 있습니다"
  ON public.quiz_saves FOR DELETE
  USING (auth.uid() = user_id);

-- 퀴즈 재밌어요 테이블
ALTER TABLE public.quiz_fun ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 재밌어요 목록을 볼 수 있습니다"
  ON public.quiz_fun FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "인증된 사용자는 재밌어요를 누를 수 있습니다"
  ON public.quiz_fun FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 재밌어요를 취소할 수 있습니다"
  ON public.quiz_fun FOR DELETE
  USING (auth.uid() = user_id);

-- 퀴즈 정확해요 테이블
ALTER TABLE public.quiz_accurate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 정확해요 목록을 볼 수 있습니다"
  ON public.quiz_accurate FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "인증된 사용자는 정확해요를 누를 수 있습니다"
  ON public.quiz_accurate FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 정확해요를 취소할 수 있습니다"
  ON public.quiz_accurate FOR DELETE
  USING (auth.uid() = user_id);

-- 퀴즈 상호작용 통계 테이블
ALTER TABLE public.quiz_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 상호작용 통계는 모두가 볼 수 있습니다"
  ON public.quiz_interactions FOR SELECT
  USING (true);

-- ============================================
-- 함수 생성
-- ============================================

-- 퀴즈 상호작용 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_quiz_interaction_stats(quiz_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.quiz_interactions (quiz_id, fun_count, accurate_count, save_count, comment_count)
  VALUES (
    quiz_uuid,
    (SELECT COUNT(*) FROM public.quiz_fun WHERE quiz_id = quiz_uuid),
    (SELECT COUNT(*) FROM public.quiz_accurate WHERE quiz_id = quiz_uuid),
    (SELECT COUNT(*) FROM public.quiz_saves WHERE quiz_id = quiz_uuid),
    (SELECT COUNT(*) FROM public.quiz_comments WHERE quiz_id = quiz_uuid AND is_deleted = FALSE)
  )
  ON CONFLICT (quiz_id) DO UPDATE SET
    fun_count = EXCLUDED.fun_count,
    accurate_count = EXCLUDED.accurate_count,
    save_count = EXCLUDED.save_count,
    comment_count = EXCLUDED.comment_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 퀴즈 상호작용 통계 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION trigger_update_quiz_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_quiz_interaction_stats(NEW.quiz_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_quiz_interaction_stats(OLD.quiz_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_quiz_fun_stats ON public.quiz_fun;
CREATE TRIGGER trigger_quiz_fun_stats
  AFTER INSERT OR DELETE ON public.quiz_fun
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_interaction_stats();

DROP TRIGGER IF EXISTS trigger_quiz_accurate_stats ON public.quiz_accurate;
CREATE TRIGGER trigger_quiz_accurate_stats
  AFTER INSERT OR DELETE ON public.quiz_accurate
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_interaction_stats();

DROP TRIGGER IF EXISTS trigger_quiz_saves_stats ON public.quiz_saves;
CREATE TRIGGER trigger_quiz_saves_stats
  AFTER INSERT OR DELETE ON public.quiz_saves
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_interaction_stats();

DROP TRIGGER IF EXISTS trigger_quiz_comments_stats ON public.quiz_comments;
CREATE TRIGGER trigger_quiz_comments_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_comments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_interaction_stats();

-- 기존 퀴즈들의 상호작용 통계 초기화
INSERT INTO public.quiz_interactions (quiz_id, fun_count, accurate_count, save_count, comment_count)
SELECT 
  id,
  0,
  0,
  0,
  0
FROM public.quizzes
WHERE id NOT IN (SELECT quiz_id FROM public.quiz_interactions)
ON CONFLICT (quiz_id) DO NOTHING;

SELECT 'Quiz interaction tables created successfully!' as status;

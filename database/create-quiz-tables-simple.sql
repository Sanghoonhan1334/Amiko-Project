-- 퀴즈 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS public.quiz_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 퀴즈 반응 테이블 생성
CREATE TABLE IF NOT EXISTS public.quiz_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'fun', 'accurate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, user_id, reaction_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quiz_comments_quiz_id ON public.quiz_comments(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_comments_user_id ON public.quiz_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_reactions_quiz_id ON public.quiz_reactions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_reactions_user_id ON public.quiz_reactions(user_id);

-- RLS 정책 설정
ALTER TABLE public.quiz_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_reactions ENABLE ROW LEVEL SECURITY;

-- 댓글 정책
CREATE POLICY "quiz_comments_select_policy" ON public.quiz_comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "quiz_comments_insert_policy" ON public.quiz_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comments_update_policy" ON public.quiz_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quiz_comments_delete_policy" ON public.quiz_comments FOR DELETE USING (auth.uid() = user_id);

-- 반응 정책
CREATE POLICY "quiz_reactions_select_policy" ON public.quiz_reactions FOR SELECT USING (true);
CREATE POLICY "quiz_reactions_insert_policy" ON public.quiz_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_reactions_delete_policy" ON public.quiz_reactions FOR DELETE USING (auth.uid() = user_id);

SELECT 'Quiz tables created successfully!' as status;

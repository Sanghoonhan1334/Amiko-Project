-- 퀴즈 댓글 테이블 생성
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

-- 퀴즈 댓글 반응 테이블
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

-- RLS 정책
CREATE POLICY "quiz_comments_select_policy" ON public.quiz_comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "quiz_comments_insert_policy" ON public.quiz_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comments_update_policy" ON public.quiz_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quiz_comments_delete_policy" ON public.quiz_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "quiz_comment_reactions_select_policy" ON public.quiz_comment_reactions FOR SELECT USING (true);
CREATE POLICY "quiz_comment_reactions_insert_policy" ON public.quiz_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comment_reactions_delete_policy" ON public.quiz_comment_reactions FOR DELETE USING (auth.uid() = user_id);

SELECT 'Tables created successfully!' as status;

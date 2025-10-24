-- 테이블 존재 여부 확인 및 필요한 부분만 추가
-- Check if tables exist and add only missing parts

-- 테이블이 이미 존재하는지 확인하고, 필요한 경우에만 생성
DO $$
BEGIN
    -- quiz_comments 테이블이 없으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_comments') THEN
        CREATE TABLE public.quiz_comments (
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
        
        ALTER TABLE public.quiz_comments ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'quiz_comments table created';
    ELSE
        RAISE NOTICE 'quiz_comments table already exists';
    END IF;

    -- quiz_comment_reactions 테이블이 없으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_comment_reactions') THEN
        CREATE TABLE public.quiz_comment_reactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            comment_id UUID NOT NULL REFERENCES public.quiz_comments(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(comment_id, user_id, reaction_type)
        );
        
        ALTER TABLE public.quiz_comment_reactions ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'quiz_comment_reactions table created';
    ELSE
        RAISE NOTICE 'quiz_comment_reactions table already exists';
    END IF;
END $$;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "quiz_comments_select_policy" ON public.quiz_comments;
DROP POLICY IF EXISTS "quiz_comments_insert_policy" ON public.quiz_comments;
DROP POLICY IF EXISTS "quiz_comments_update_policy" ON public.quiz_comments;
DROP POLICY IF EXISTS "quiz_comments_delete_policy" ON public.quiz_comments;

DROP POLICY IF EXISTS "quiz_comment_reactions_select_policy" ON public.quiz_comment_reactions;
DROP POLICY IF EXISTS "quiz_comment_reactions_insert_policy" ON public.quiz_comment_reactions;
DROP POLICY IF EXISTS "quiz_comment_reactions_delete_policy" ON public.quiz_comment_reactions;

-- RLS 정책 재생성
CREATE POLICY "quiz_comments_select_policy" ON public.quiz_comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "quiz_comments_insert_policy" ON public.quiz_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comments_update_policy" ON public.quiz_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quiz_comments_delete_policy" ON public.quiz_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "quiz_comment_reactions_select_policy" ON public.quiz_comment_reactions FOR SELECT USING (true);
CREATE POLICY "quiz_comment_reactions_insert_policy" ON public.quiz_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_comment_reactions_delete_policy" ON public.quiz_comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- 카운트 업데이트 함수 (기존 함수가 있으면 교체)
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

-- 트리거 함수 (기존 함수가 있으면 교체)
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

-- 트리거 생성 (기존 트리거가 있으면 교체)
DROP TRIGGER IF EXISTS trigger_quiz_comment_reactions_counts ON public.quiz_comment_reactions;
CREATE TRIGGER trigger_quiz_comment_reactions_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_comment_counts();

SELECT 'Quiz comments system setup completed successfully!' as status;

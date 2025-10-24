-- 기존 정책 삭제 후 재생성
-- Drop existing policies and recreate them

-- 기존 정책 삭제
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

SELECT 'Policies recreated successfully!' as status;
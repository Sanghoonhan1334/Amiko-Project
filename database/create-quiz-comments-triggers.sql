-- 카운트 업데이트 함수 생성
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

-- 트리거 함수 생성
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

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_quiz_comment_reactions_counts ON public.quiz_comment_reactions;
CREATE TRIGGER trigger_quiz_comment_reactions_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_quiz_comment_counts();

SELECT 'Trigger functions created successfully!' as status;

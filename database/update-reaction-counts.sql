-- 게시글 반응 수 자동 업데이트를 위한 트리거
-- Auto-update post reaction counts trigger

-- 반응 수 업데이트 함수
-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_post_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 새로운 반응 추가
        -- Add new reaction
        IF NEW.reaction_type = 'like' THEN
            UPDATE public.posts 
            SET like_count = like_count + 1 
            WHERE id = NEW.post_id;
        ELSIF NEW.reaction_type = 'dislike' THEN
            UPDATE public.posts 
            SET dislike_count = dislike_count + 1 
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- 반응 변경
        -- Change reaction
        IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
            -- 좋아요 -> 싫어요
            -- Like -> Dislike
            UPDATE public.posts 
            SET like_count = like_count - 1, dislike_count = dislike_count + 1 
            WHERE id = NEW.post_id;
        ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
            -- 싫어요 -> 좋아요
            -- Dislike -> Like
            UPDATE public.posts 
            SET dislike_count = dislike_count - 1, like_count = like_count + 1 
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- 반응 삭제
        -- Remove reaction
        IF OLD.reaction_type = 'like' THEN
            UPDATE public.posts 
            SET like_count = like_count - 1 
            WHERE id = OLD.post_id;
        ELSIF OLD.reaction_type = 'dislike' THEN
            UPDATE public.posts 
            SET dislike_count = dislike_count - 1 
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_post_reaction_counts ON public.post_reactions;
CREATE TRIGGER trigger_update_post_reaction_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_post_reaction_counts();

-- 기존 게시글의 반응 수 초기화
-- Initialize reaction counts for existing posts
UPDATE public.posts 
SET 
    like_count = (
        SELECT COUNT(*) 
        FROM public.post_reactions 
        WHERE post_id = posts.id AND reaction_type = 'like'
    ),
    dislike_count = (
        SELECT COUNT(*) 
        FROM public.post_reactions 
        WHERE post_id = posts.id AND reaction_type = 'dislike'
    );

-- 완료 메시지
-- Completion message
SELECT 'Post reaction counts trigger created and existing data updated successfully' as status,
       (SELECT COUNT(*) FROM public.posts) as total_posts,
       (SELECT COUNT(*) FROM public.post_reactions) as total_reactions;

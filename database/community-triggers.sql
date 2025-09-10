-- 커뮤니티 테이블 트리거 설정

-- 1. posts 테이블 업데이트 시간 자동 갱신
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON public.posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 2. comments 테이블 업데이트 시간 자동 갱신
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. user_profiles 테이블 업데이트 시간 자동 갱신
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 댓글 추가 시 게시물 댓글 수 자동 업데이트
CREATE OR REPLACE FUNCTION trigger_update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_post_comment_count(NEW.post_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_post_comment_count(OLD.post_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.post_id != OLD.post_id THEN
            PERFORM update_post_comment_count(OLD.post_id);
            PERFORM update_post_comment_count(NEW.post_id);
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_comment_count();

-- 5. 반응 추가/삭제 시 게시물/댓글 좋아요 수 자동 업데이트
CREATE OR REPLACE FUNCTION trigger_update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            PERFORM update_post_like_count(NEW.post_id);
        ELSIF NEW.comment_id IS NOT NULL THEN
            PERFORM update_comment_like_count(NEW.comment_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            PERFORM update_post_like_count(OLD.post_id);
        ELSIF OLD.comment_id IS NOT NULL THEN
            PERFORM update_comment_like_count(OLD.comment_id);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- post_id 변경 시
        IF NEW.post_id != OLD.post_id THEN
            IF OLD.post_id IS NOT NULL THEN
                PERFORM update_post_like_count(OLD.post_id);
            END IF;
            IF NEW.post_id IS NOT NULL THEN
                PERFORM update_post_like_count(NEW.post_id);
            END IF;
        END IF;
        -- comment_id 변경 시
        IF NEW.comment_id != OLD.comment_id THEN
            IF OLD.comment_id IS NOT NULL THEN
                PERFORM update_comment_like_count(OLD.comment_id);
            END IF;
            IF NEW.comment_id IS NOT NULL THEN
                PERFORM update_comment_like_count(NEW.comment_id);
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_like_count();

-- 6. 사용자 생성 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION trigger_create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- user_profiles 테이블에 기본 프로필 생성
    INSERT INTO public.user_profiles (
        user_id, 
        display_name, 
        is_korean,
        country
    ) VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
        COALESCE((NEW.raw_user_meta_data->>'is_korean')::BOOLEAN, FALSE),
        COALESCE(NEW.raw_user_meta_data->>'country', 'US')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auth.users 테이블에 트리거 추가 (Supabase에서 자동으로 처리되지만 명시적으로 추가)
-- 주의: 이 트리거는 Supabase Auth와 충돌할 수 있으므로 주의해서 사용

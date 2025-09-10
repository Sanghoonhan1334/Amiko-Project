-- 커뮤니티 반응(좋아요/싫어요) 테이블
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 하나의 사용자는 하나의 게시물/댓글에 하나의 반응만 가능
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id),
    -- post_id 또는 comment_id 중 하나만 있어야 함
    CONSTRAINT check_post_or_comment CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- 반응 추가/수정 함수
CREATE OR REPLACE FUNCTION add_or_update_reaction(
    p_user_id UUID,
    p_post_id UUID DEFAULT NULL,
    p_comment_id UUID DEFAULT NULL,
    p_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 기존 반응이 있으면 업데이트, 없으면 삽입
    INSERT INTO public.reactions (user_id, post_id, comment_id, type)
    VALUES (p_user_id, p_post_id, p_comment_id, p_type)
    ON CONFLICT (user_id, COALESCE(p_post_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(p_comment_id, '00000000-0000-0000-0000-000000000000'::UUID))
    DO UPDATE SET type = p_type, created_at = NOW();
    
    -- 게시물 또는 댓글의 좋아요 수 업데이트
    IF p_post_id IS NOT NULL THEN
        PERFORM update_post_like_count(p_post_id);
    ELSIF p_comment_id IS NOT NULL THEN
        PERFORM update_comment_like_count(p_comment_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 반응 삭제 함수
CREATE OR REPLACE FUNCTION remove_reaction(
    p_user_id UUID,
    p_post_id UUID DEFAULT NULL,
    p_comment_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.reactions 
    WHERE user_id = p_user_id 
    AND (p_post_id IS NULL OR post_id = p_post_id)
    AND (p_comment_id IS NULL OR comment_id = p_comment_id);
    
    -- 게시물 또는 댓글의 좋아요 수 업데이트
    IF p_post_id IS NOT NULL THEN
        PERFORM update_post_like_count(p_post_id);
    ELSIF p_comment_id IS NOT NULL THEN
        PERFORM update_comment_like_count(p_comment_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

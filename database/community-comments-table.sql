-- 커뮤니티 댓글 테이블
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- 대댓글용
    content TEXT NOT NULL,
    language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'es', 'en')),
    is_accepted BOOLEAN DEFAULT FALSE, -- 답변 채택 여부 (질문 게시물의 답변만)
    is_deleted BOOLEAN DEFAULT FALSE, -- 삭제된 댓글 여부
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_like_count(comment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.comments 
    SET like_count = (
        SELECT COUNT(*) 
        FROM public.reactions 
        WHERE comment_id = comment_id AND type = 'like'
    )
    WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- 댓글 삭제 시 대댓글도 함께 삭제하는 함수
CREATE OR REPLACE FUNCTION delete_comment_with_replies(comment_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 대댓글들을 먼저 삭제
    UPDATE public.comments 
    SET is_deleted = TRUE 
    WHERE parent_id = comment_id;
    
    -- 원본 댓글 삭제
    UPDATE public.comments 
    SET is_deleted = TRUE 
    WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- 커뮤니티 게시물 테이블
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('question', 'story', 'freeboard', 'news')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('beauty', 'travel', 'culture', 'fashion', 'food', 'daily', 'free', 'notice')),
    tags TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'es', 'en')),
    is_solved BOOLEAN DEFAULT FALSE, -- 질문 해결 여부 (question 타입만)
    is_best BOOLEAN DEFAULT FALSE, -- 베스트 게시물 여부
    is_notice BOOLEAN DEFAULT FALSE, -- 공지사항 여부
    is_pinned BOOLEAN DEFAULT FALSE, -- 상단 고정 여부
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시물 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts 
    SET view_count = view_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 게시물 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts 
    SET comment_count = (
        SELECT COUNT(*) 
        FROM public.comments 
        WHERE post_id = post_id AND parent_id IS NULL
    )
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 게시물 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_like_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts 
    SET like_count = (
        SELECT COUNT(*) 
        FROM public.reactions 
        WHERE post_id = post_id AND type = 'like'
    )
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

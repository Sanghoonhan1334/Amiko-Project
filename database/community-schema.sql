-- 커뮤니티 게시판을 위한 데이터베이스 스키마

-- 1. 게시판 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.board_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 게시글 테이블
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.board_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_notice BOOLEAN DEFAULT FALSE,
    is_survey BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 댓글 테이블
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 게시글 좋아요/싫어요 테이블
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. 댓글 좋아요/싫어요 테이블
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 6. 게시글 조회 기록 테이블 (중복 조회 방지용)
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, ip_address)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON public.posts(like_count DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON public.comment_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);

-- RLS 정책 설정
ALTER TABLE public.board_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DO $$ 
BEGIN
    -- board_categories 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_categories' AND policyname = 'Anyone can view active categories') THEN
        CREATE POLICY "Anyone can view active categories" ON public.board_categories
            FOR SELECT USING (is_active = true);
    END IF;
    
    -- posts 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can view published posts') THEN
        CREATE POLICY "Anyone can view published posts" ON public.posts
            FOR SELECT USING (status = 'published');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can insert own posts') THEN
        CREATE POLICY "Users can insert own posts" ON public.posts
            FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can update own posts') THEN
        CREATE POLICY "Users can update own posts" ON public.posts
            FOR UPDATE USING (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can delete own posts') THEN
        CREATE POLICY "Users can delete own posts" ON public.posts
            FOR DELETE USING (auth.uid() = author_id);
    END IF;
    
    -- comments 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Anyone can view published comments') THEN
        CREATE POLICY "Anyone can view published comments" ON public.comments
            FOR SELECT USING (status = 'published');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can insert own comments') THEN
        CREATE POLICY "Users can insert own comments" ON public.comments
            FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update own comments') THEN
        CREATE POLICY "Users can update own comments" ON public.comments
            FOR UPDATE USING (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete own comments') THEN
        CREATE POLICY "Users can delete own comments" ON public.comments
            FOR DELETE USING (auth.uid() = author_id);
    END IF;
    
    -- post_reactions 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'Anyone can view post reactions') THEN
        CREATE POLICY "Anyone can view post reactions" ON public.post_reactions
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'Users can manage own post reactions') THEN
        CREATE POLICY "Users can manage own post reactions" ON public.post_reactions
            FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- comment_reactions 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Anyone can view comment reactions') THEN
        CREATE POLICY "Anyone can view comment reactions" ON public.comment_reactions
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Users can manage own comment reactions') THEN
        CREATE POLICY "Users can manage own comment reactions" ON public.comment_reactions
            FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- post_views 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_views' AND policyname = 'Anyone can insert post views') THEN
        CREATE POLICY "Anyone can insert post views" ON public.post_views
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 샘플 데이터 삽입
INSERT INTO public.board_categories (name, description, sort_order) VALUES
('자유게시판', '자유롭게 소통할 수 있는 게시판입니다', 1),
('P&R', '질문과 답변 게시판입니다', 2),
('Historia', '한국 역사와 문화에 대한 이야기', 3),
('한국뉴스', '한국의 최신 뉴스를 공유하는 게시판', 4)
ON CONFLICT (name) DO NOTHING;

-- 트리거 함수 생성 (댓글 수 자동 업데이트)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON public.comments;
CREATE TRIGGER trigger_update_post_comment_count
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- 조회수 업데이트 함수
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid UUID, user_uuid UUID DEFAULT NULL, user_ip INET DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- 중복 조회 방지를 위한 체크
    IF NOT EXISTS (
        SELECT 1 FROM public.post_views 
        WHERE post_id = post_uuid 
        AND (user_id = user_uuid OR (user_id IS NULL AND ip_address = user_ip))
    ) THEN
        -- 조회 기록 추가
        INSERT INTO public.post_views (post_id, user_id, ip_address)
        VALUES (post_uuid, user_uuid, user_ip);
        
        -- 조회수 증가
        UPDATE public.posts 
        SET view_count = view_count + 1 
        WHERE id = post_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

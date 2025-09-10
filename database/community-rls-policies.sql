-- 커뮤니티 테이블 RLS 정책 설정

-- 1. posts 테이블 RLS 활성화
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- posts 테이블 정책들
-- 모든 사용자가 게시물 조회 가능
CREATE POLICY "posts_select_policy" ON public.posts
    FOR SELECT USING (true);

-- 인증된 사용자만 게시물 생성 가능
CREATE POLICY "posts_insert_policy" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 작성자만 자신의 게시물 수정 가능
CREATE POLICY "posts_update_policy" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

-- 작성자만 자신의 게시물 삭제 가능
CREATE POLICY "posts_delete_policy" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- 2. comments 테이블 RLS 활성화
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- comments 테이블 정책들
-- 모든 사용자가 댓글 조회 가능
CREATE POLICY "comments_select_policy" ON public.comments
    FOR SELECT USING (true);

-- 인증된 사용자만 댓글 생성 가능
CREATE POLICY "comments_insert_policy" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 작성자만 자신의 댓글 수정 가능
CREATE POLICY "comments_update_policy" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

-- 작성자만 자신의 댓글 삭제 가능
CREATE POLICY "comments_delete_policy" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 3. reactions 테이블 RLS 활성화
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- reactions 테이블 정책들
-- 모든 사용자가 반응 조회 가능
CREATE POLICY "reactions_select_policy" ON public.reactions
    FOR SELECT USING (true);

-- 인증된 사용자만 반응 생성 가능
CREATE POLICY "reactions_insert_policy" ON public.reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 작성자만 자신의 반응 수정 가능
CREATE POLICY "reactions_update_policy" ON public.reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- 작성자만 자신의 반응 삭제 가능
CREATE POLICY "reactions_delete_policy" ON public.reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 4. user_profiles 테이블 RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- user_profiles 테이블 정책들
-- 모든 사용자가 프로필 조회 가능
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (true);

-- 인증된 사용자만 프로필 생성 가능
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 자신의 프로필 수정 가능
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 자신의 프로필 삭제 가능
CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 5. points 테이블 RLS 활성화
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;

-- points 테이블 정책들
-- 본인만 자신의 포인트 기록 조회 가능
CREATE POLICY "points_select_policy" ON public.points
    FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자만 포인트 기록 생성 가능 (시스템에서 자동 생성)
CREATE POLICY "points_insert_policy" ON public.points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 포인트 기록은 수정/삭제 불가 (감사 로그)
CREATE POLICY "points_update_policy" ON public.points
    FOR UPDATE USING (false);

CREATE POLICY "points_delete_policy" ON public.points
    FOR DELETE USING (false);

-- 6. 관리자 정책 (선택사항)
-- 관리자는 모든 데이터에 접근 가능
CREATE POLICY "admin_all_access_posts" ON public.posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "admin_all_access_comments" ON public.comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "admin_all_access_reactions" ON public.reactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "admin_all_access_user_profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "admin_all_access_points" ON public.points
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

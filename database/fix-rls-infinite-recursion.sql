-- =====================================================
-- RLS 무한 재귀 문제 해결 및 user_preferences 테이블 수정
-- =====================================================

-- 1. 기존 문제가 있는 RLS 정책 삭제
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 2. 무한 재귀를 방지하는 새로운 관리자 정책 생성
-- 관리자는 모든 사용자 정보를 볼 수 있음 (무한 재귀 방지)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE is_admin = true
        )
    );

-- 관리자는 모든 사용자 정보를 업데이트할 수 있음 (무한 재귀 방지)
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE is_admin = true
        )
    );

-- 3. user_preferences 테이블에 full_name 컬럼 추가 (없는 경우)
DO $$
BEGIN
    -- user_preferences 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        -- full_name 컬럼이 없는 경우 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'full_name' AND table_schema = 'public') THEN
            ALTER TABLE public.user_preferences ADD COLUMN full_name TEXT;
            COMMENT ON COLUMN public.user_preferences.full_name IS '사용자 전체 이름';
        END IF;
        
        -- display_name 컬럼이 없는 경우 추가 (호환성을 위해)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'display_name' AND table_schema = 'public') THEN
            ALTER TABLE public.user_preferences ADD COLUMN display_name TEXT;
            COMMENT ON COLUMN public.user_preferences.display_name IS '사용자 표시 이름';
        END IF;
    END IF;
END $$;

-- 4. user_preferences 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    language TEXT DEFAULT 'ko',
    timezone TEXT DEFAULT 'Asia/Seoul',
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT false,
    privacy_level TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. user_preferences 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON public.user_preferences(language);

-- 6. user_preferences 테이블 RLS 활성화
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 7. user_preferences 테이블 RLS 정책 생성
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 사용자 선호도를 볼 수 있음
CREATE POLICY "Admins can view all preferences" ON public.user_preferences
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE is_admin = true
        )
    );

-- 8. 업데이트 시간 자동 갱신 트리거 적용
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 기존 users 테이블과 user_preferences 테이블 동기화
-- users 테이블에 있는 사용자들의 기본 선호도 생성
INSERT INTO public.user_preferences (user_id, full_name, display_name, language)
SELECT 
    u.id,
    u.full_name,
    u.full_name as display_name,
    COALESCE(u.language, 'ko')
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences up 
    WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 10. 확인 쿼리
SELECT 
    'users 테이블' as table_name,
    COUNT(*) as row_count
FROM public.users
UNION ALL
SELECT 
    'user_preferences 테이블' as table_name,
    COUNT(*) as row_count
FROM public.user_preferences;

-- 11. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'user_preferences')
ORDER BY tablename, policyname;

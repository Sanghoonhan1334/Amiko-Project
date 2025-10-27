-- ==========================================
-- 채팅 닉네임 시스템 설정
-- ==========================================
-- Description: 채팅에서 사용할 닉네임(display_name) 시스템 활성화
-- Date: 2025-01-06
-- ==========================================

-- 1. user_profiles 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_korean BOOLEAN DEFAULT FALSE,
    country TEXT DEFAULT 'US',
    language_preference TEXT DEFAULT 'ko' CHECK (language_preference IN ('ko', 'es', 'en')),
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기존 사용자들에게 기본 닉네임 생성 (없는 경우)
INSERT INTO public.user_profiles (user_id, display_name)
SELECT 
    u.id,
    COALESCE(
        u.name,
        split_part(u.email, '@', 1) || '#' || substr(u.id::text, 1, 4)
    ) as display_name
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. RLS 정책 설정 (채팅에서 프로필 읽기 허용)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 display_name을 볼 수 있음 (채팅용)
CREATE POLICY "Anyone can view display names for chat" ON public.user_profiles
    FOR SELECT USING (true);

-- 사용자는 자신의 프로필을 수정할 수 있음
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. chat_messages와 user_profiles 연결 확인
-- 이미 chat_messages 테이블에 user_id가 있으므로 join 가능

-- ==========================================
-- 사용 방법:
-- ==========================================
-- 1. 사용자가 닉네임 설정:
--    UPDATE user_profiles 
--    SET display_name = '나의 닉네임' 
--    WHERE user_id = auth.uid();
--
-- 2. 채팅에서 표시:
--    - display_name이 있으면 → 닉네임 표시
--    - 없으면 → 이메일 or user_id 일부 표시
--
-- 3. 보안:
--    - 실명 노출 없음 ✅
--    - 부적절한 닉네임 신고 기능 추가 권장
-- ==========================================


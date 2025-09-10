-- 사용자 프로필 확장 테이블 (커뮤니티용)
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

-- 사용자 프로필 생성 함수 (회원가입 시 자동 생성)
CREATE OR REPLACE FUNCTION create_user_profile(
    p_user_id UUID,
    p_display_name TEXT,
    p_is_korean BOOLEAN DEFAULT FALSE,
    p_country TEXT DEFAULT 'US'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        display_name, 
        is_korean, 
        country,
        language_preference
    ) VALUES (
        p_user_id, 
        p_display_name, 
        p_is_korean, 
        p_country,
        CASE WHEN p_is_korean THEN 'ko' ELSE 'es' END
    );
END;
$$ LANGUAGE plpgsql;

-- 사용자 포인트 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_points(
    p_user_id UUID,
    p_points_change INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles 
    SET 
        total_points = total_points + p_points_change,
        experience_points = experience_points + ABS(p_points_change),
        level = CASE 
            WHEN experience_points + ABS(p_points_change) >= 1000 THEN 5
            WHEN experience_points + ABS(p_points_change) >= 500 THEN 4
            WHEN experience_points + ABS(p_points_change) >= 200 THEN 3
            WHEN experience_points + ABS(p_points_change) >= 50 THEN 2
            ELSE 1
        END
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 사용자 레벨 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_level(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles 
    SET level = CASE 
        WHEN experience_points >= 1000 THEN 5
        WHEN experience_points >= 500 THEN 4
        WHEN experience_points >= 200 THEN 3
        WHEN experience_points >= 50 THEN 2
        ELSE 1
    END
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 인증 폼 작동을 위한 필수 테이블 생성/업데이트

-- 1. users 테이블에 필요한 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_korean BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_images TEXT[];

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS main_profile_image TEXT;

COMMENT ON COLUMN public.users.is_korean IS '사용자 국적 (한국인: true, 비한국인: false)';
COMMENT ON COLUMN public.users.profile_image IS '프로필 사진 (Base64 인코딩된 이미지 데이터) - 기존 호환성';
COMMENT ON COLUMN public.users.profile_images IS '프로필 사진들 (Base64 인코딩된 이미지 데이터 배열)';
COMMENT ON COLUMN public.users.main_profile_image IS '대표 프로필 사진 (Base64 인코딩된 이미지 데이터)';

CREATE INDEX IF NOT EXISTS idx_users_is_korean ON public.users(is_korean);

-- 2. user_preferences 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    matching_preferences TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'instant', 'selective'
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_interests TEXT,
    korean_level TEXT,
    english_level TEXT,
    spanish_level TEXT,
    is_korean BOOLEAN DEFAULT TRUE,
    user_type TEXT DEFAULT 'student', -- 'student', 'professional'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_is_korean ON public.user_preferences(is_korean);
CREATE INDEX IF NOT EXISTS idx_user_preferences_korean_level ON public.user_preferences(korean_level);
CREATE INDEX IF NOT EXISTS idx_user_preferences_english_level ON public.user_preferences(english_level);
CREATE INDEX IF NOT EXISTS idx_user_preferences_spanish_level ON public.user_preferences(spanish_level);
CREATE INDEX IF NOT EXISTS idx_user_preferences_interests ON public.user_preferences USING GIN (interests);
-- 기존 테이블에 user_type 컬럼 추가 (이미 있는 경우 무시)
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student';

-- user_type 컬럼이 추가된 후 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type ON public.user_preferences(user_type);

-- 3. user_student_info 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_student_info (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    university TEXT,
    major TEXT,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_student_info ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_student_info_user_id ON public.user_student_info(user_id);

-- 4. user_general_info 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_general_info (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    occupation TEXT,
    company TEXT,
    work_experience TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_general_info ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_general_info_user_id ON public.user_general_info(user_id);

-- 5. RLS 정책 추가 (기본적인 정책) - 이미 존재하는 경우 무시
DO $$ 
BEGIN
    -- user_preferences 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences') THEN
        CREATE POLICY "Users can view own preferences" ON public.user_preferences
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert own preferences') THEN
        CREATE POLICY "Users can insert own preferences" ON public.user_preferences
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences') THEN
        CREATE POLICY "Users can update own preferences" ON public.user_preferences
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- user_student_info 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_student_info' AND policyname = 'Users can view own student info') THEN
        CREATE POLICY "Users can view own student info" ON public.user_student_info
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_student_info' AND policyname = 'Users can insert own student info') THEN
        CREATE POLICY "Users can insert own student info" ON public.user_student_info
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_student_info' AND policyname = 'Users can update own student info') THEN
        CREATE POLICY "Users can update own student info" ON public.user_student_info
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- user_general_info 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_general_info' AND policyname = 'Users can view own general info') THEN
        CREATE POLICY "Users can view own general info" ON public.user_general_info
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_general_info' AND policyname = 'Users can insert own general info') THEN
        CREATE POLICY "Users can insert own general info" ON public.user_general_info
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_general_info' AND policyname = 'Users can update own general info') THEN
        CREATE POLICY "Users can update own general info" ON public.user_general_info
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

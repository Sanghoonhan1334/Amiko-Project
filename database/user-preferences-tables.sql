-- 사용자 선호도 및 상세 정보 테이블들

-- 1. 사용자 선호도 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    matching_preferences TEXT[] DEFAULT '{}', -- ['instant', 'selective']
    interests TEXT[] DEFAULT '{}',
    custom_interests TEXT DEFAULT '',
    korean_level TEXT CHECK (korean_level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    english_level TEXT CHECK (english_level IN ('none', 'beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    spanish_level TEXT CHECK (spanish_level IN ('none', 'beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    is_korean BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 대학생 정보 테이블
CREATE TABLE IF NOT EXISTS user_student_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    university TEXT,
    major TEXT,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 일반인 정보 테이블
CREATE TABLE IF NOT EXISTS user_general_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    occupation TEXT,
    company TEXT,
    work_experience TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_korean ON user_preferences(is_korean);
CREATE INDEX IF NOT EXISTS idx_user_preferences_interests ON user_preferences USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_user_preferences_matching ON user_preferences USING GIN(matching_preferences);

CREATE INDEX IF NOT EXISTS idx_user_student_info_user ON user_student_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_general_info_user ON user_general_info(user_id);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_student_info_updated_at 
    BEFORE UPDATE ON user_student_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_general_info_updated_at 
    BEFORE UPDATE ON user_general_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_student_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_general_info ENABLE ROW LEVEL SECURITY;

-- 사용자 선호도 정책
CREATE POLICY "Users can view all preferences" ON user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- 대학생 정보 정책
CREATE POLICY "Users can view all student info" ON user_student_info
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own student info" ON user_student_info
    FOR ALL USING (user_id = auth.uid());

-- 일반인 정보 정책
CREATE POLICY "Users can view all general info" ON user_general_info
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own general info" ON user_general_info
    FOR ALL USING (user_id = auth.uid());

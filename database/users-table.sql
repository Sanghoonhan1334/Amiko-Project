-- =====================================================
-- 사용자 테이블 (Users Table) - Supabase Auth와 연동
-- Description: Supabase Auth와 연동된 사용자 테이블 생성
-- Date: 2024-12-19
-- =====================================================

-- 1. 사용자 테이블 (Users Table) - Supabase Auth와 연동
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    one_line_intro TEXT, -- 한줄소개
    language TEXT DEFAULT 'ko', -- 선호 언어
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트할 수 있음
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 삽입할 수 있음
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자는 모든 사용자 정보를 볼 수 있음
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 관리자는 모든 사용자 정보를 업데이트할 수 있음
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 기존 테이블과의 호환성을 위한 뷰 생성 (필요시)
-- 기존 코드에서 profiles 테이블을 참조하는 경우를 대비
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    email,
    full_name as display_name,
    avatar_url,
    one_line_intro as bio,
    language as native_language,
    CASE 
        WHEN language = 'ko' THEN true 
        ELSE false 
    END as is_korean,
    created_at,
    updated_at
FROM public.users;

-- 7. 샘플 데이터 (테스트용)
-- INSERT INTO public.users (id, email, full_name, language, is_admin) VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'admin@amiko.com', '관리자', 'ko', true),
--   ('00000000-0000-0000-0000-000000000002', 'user@amiko.com', '일반사용자', 'ko', false);

-- =====================================================
-- 추가 설명
-- =====================================================

/*
사용자 테이블 필드 설명:

1. id: Supabase Auth의 사용자 ID와 연동 (UUID)
2. email: 사용자 이메일 (고유값)
3. full_name: 사용자 전체 이름
4. avatar_url: 프로필 이미지 URL
5. phone: 전화번호
6. one_line_intro: 한줄 소개
7. language: 선호 언어 (기본값: 'ko')
8. is_admin: 관리자 여부 (기본값: false)
9. created_at: 생성 시간
10. updated_at: 수정 시간

RLS 정책:
- 사용자는 자신의 프로필만 조회/수정 가능
- 관리자는 모든 사용자 정보 조회/수정 가능
- Supabase Auth와 완전 연동

호환성:
- 기존 profiles 뷰를 통해 하위 호환성 유지
- 기존 코드 수정 없이 사용 가능
*/

-- =====================================================
-- 프로필 필드 추가 (MyTab용)
-- Description: MyTab에서 사용하는 새로운 프로필 필드들 추가
-- Date: 2025-01-06
-- =====================================================

-- 1. 기본 프로필 필드들 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS korean_name TEXT,
ADD COLUMN IF NOT EXISTS spanish_name TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'general')),
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS career TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS introduction TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN public.users.korean_name IS '한국이름 (선택사항)';
COMMENT ON COLUMN public.users.spanish_name IS '스페인어 이름 (외국인 사용자용)';
COMMENT ON COLUMN public.users.user_type IS '사용자 타입 (student: 학생, general: 일반인)';
COMMENT ON COLUMN public.users.occupation IS '직업 (직장인용)';
COMMENT ON COLUMN public.users.company IS '회사명 (직장인용)';
COMMENT ON COLUMN public.users.career IS '경력 정보 (직장인용)';
COMMENT ON COLUMN public.users.university IS '대학교명 (학생용)';
COMMENT ON COLUMN public.users.major IS '전공 (학생용)';
COMMENT ON COLUMN public.users.grade IS '학년 (학생용)';
COMMENT ON COLUMN public.users.introduction IS '자기소개';
COMMENT ON COLUMN public.users.interests IS '관심사 배열';
COMMENT ON COLUMN public.users.join_date IS '가입일';

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university) WHERE university IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_interests ON public.users USING GIN(interests) WHERE interests IS NOT NULL;

-- 4. 기존 데이터 업데이트 (필요시)
-- 기존 사용자들의 기본값 설정
UPDATE public.users 
SET 
    user_type = CASE 
        WHEN email LIKE '%@student.%' OR email LIKE '%@univ.%' THEN 'student'
        ELSE 'general'
    END,
    join_date = created_at::date
WHERE user_type IS NULL OR join_date IS NULL;

-- 5. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '프로필 필드들이 성공적으로 추가되었습니다.';
    RAISE NOTICE '추가된 필드: korean_name, spanish_name, user_type, occupation, company, career, university, major, grade, introduction, interests, join_date';
    RAISE NOTICE '기존 사용자들에게는 기본값이 설정되었습니다.';
END $$;

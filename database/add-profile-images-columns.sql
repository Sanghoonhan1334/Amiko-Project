-- =====================================================
-- 프로필 이미지 컬럼 추가
-- Description: users 테이블에 프로필 이미지 관련 컬럼 추가
-- Date: 2024-12-19
-- =====================================================

-- 1. 프로필 이미지 관련 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS profile_images TEXT[],
ADD COLUMN IF NOT EXISTS main_profile_image TEXT;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN public.users.profile_image IS '단일 프로필 이미지 URL (Base64 또는 URL)';
COMMENT ON COLUMN public.users.profile_images IS '여러 프로필 이미지 배열 (Base64 또는 URL)';
COMMENT ON COLUMN public.users.main_profile_image IS '대표 프로필 이미지 URL (Base64 또는 URL)';

-- 3. 인덱스 생성 (필요시)
-- CREATE INDEX IF NOT EXISTS idx_users_profile_image ON public.users(profile_image) WHERE profile_image IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_users_main_profile_image ON public.users(main_profile_image) WHERE main_profile_image IS NOT NULL;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
프로필 이미지 컬럼 설명:

1. profile_image: 단일 프로필 이미지 URL
   - 기존 avatar_url과 유사하지만 더 구체적인 용도
   - Base64 인코딩된 이미지 데이터 또는 외부 URL

2. profile_images: 여러 프로필 이미지 배열
   - 사용자가 업로드한 모든 프로필 이미지들
   - TEXT[] 타입으로 배열 형태로 저장
   - Base64 인코딩된 이미지 데이터 또는 외부 URL

3. main_profile_image: 대표 프로필 이미지
   - profile_images 중에서 사용자가 선택한 대표 이미지
   - 프로필 페이지에서 메인으로 표시될 이미지
   - Base64 인코딩된 이미지 데이터 또는 외부 URL

사용 예시:
- profile_images: ['data:image/jpeg;base64,/9j/4AAQ...', 'data:image/png;base64,iVBORw0KGgo...']
- main_profile_image: 'data:image/jpeg;base64,/9j/4AAQ...'
- profile_image: 'data:image/jpeg;base64,/9j/4AAQ...' (단일 이미지 사용 시)
*/

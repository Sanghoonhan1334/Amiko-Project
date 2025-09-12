-- users 테이블에 필요한 컬럼 추가

-- is_korean 컬럼 추가 (국적 구분용)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_korean BOOLEAN DEFAULT FALSE;

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN public.users.is_korean IS '사용자 국적 (한국인: true, 비한국인: false)';

-- 인덱스 추가 (국적별 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_is_korean ON public.users(is_korean);

-- 기존 사용자들의 is_korean 값을 기본값으로 설정 (필요시)
-- UPDATE public.users SET is_korean = FALSE WHERE is_korean IS NULL;

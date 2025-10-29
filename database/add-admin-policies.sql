-- 관리자 API용 RLS 정책 추가
-- user_points 테이블에 모든 사용자가 조회할 수 있는 정책 추가

-- 1. user_points 정책
DROP POLICY IF EXISTS "Anyone can view points ranking" ON public.user_points;
DROP POLICY IF EXISTS "Public can view points" ON public.user_points;
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;

CREATE POLICY "Anyone can view points ranking" ON public.user_points
    FOR SELECT USING (true);

-- 2. users 테이블의 모든 정책 삭제 (무한 재귀 방지)
-- 먼저 모든 정책 목록 확인 후 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- 3. RLS 비활성화 후 다시 활성화 (모든 정책 초기화)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. 단순한 조회 정책 추가 (무한 재귀 없음)
CREATE POLICY "Allow public read access" ON public.users
    FOR SELECT USING (true);

-- 5. referrals 테이블 RLS 정책 추가
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'referrals') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.referrals', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can view own referral" ON public.referrals
    FOR SELECT USING (true);  -- 모든 사용자가 조회 가능

CREATE POLICY "System can manage all referrals" ON public.referrals
    FOR ALL USING (true);

-- 완료 메시지
SELECT 'RLS 정책 수정 완료' as message;


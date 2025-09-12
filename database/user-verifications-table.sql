-- =====================================================
-- 사용자 인증 테이블 (User Verifications Table)
-- Description: 사용자 인증 정보를 저장하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 사용자 인증 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 기본 정보
    university TEXT NOT NULL,
    major TEXT NOT NULL,
    grade TEXT NOT NULL,
    student_id TEXT NOT NULL,
    
    -- 관심사 및 시간 (쉼표로 구분된 문자열)
    interests TEXT,
    available_time TEXT,
    
    -- 인증 상태
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- 관리자 메모
    admin_notes TEXT,
    
    -- 제출 및 처리 시간
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_submitted_at ON public.user_verifications(submitted_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 인증 정보만 볼 수 있음
CREATE POLICY "Users can view own verification" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 인증 정보만 삽입할 수 있음
CREATE POLICY "Users can insert own verification" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 인증 정보만 업데이트할 수 있음 (상태가 pending일 때만)
CREATE POLICY "Users can update own verification" ON public.user_verifications
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 관리자는 모든 인증 정보를 볼 수 있음
CREATE POLICY "Admins can view all verifications" ON public.user_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 관리자는 모든 인증 정보를 업데이트할 수 있음
CREATE POLICY "Admins can update all verifications" ON public.user_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_user_verifications_updated_at 
    BEFORE UPDATE ON public.user_verifications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 샘플 데이터 (테스트용)
-- INSERT INTO public.user_verifications (
--     user_id, university, major, grade, student_id, 
--     interests, available_time, status
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     '서울대학교',
--     '한국어교육학과',
--     '3학년',
--     '2024123456',
--     '한국어,한국문화,요리',
--     '평일저녁,주말오후',
--     'approved'
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
사용자 인증 테이블 필드 설명:

1. id: 인증 정보 고유 ID (UUID)
2. user_id: 사용자 ID (users 테이블 참조)
3. university: 대학교명
4. major: 전공
5. grade: 학년
6. student_id: 학번
7. interests: 관심사 (쉼표로 구분된 문자열)
8. available_time: 가능한 시간 (쉼표로 구분된 문자열)
9. status: 인증 상태 (pending, approved, rejected)
10. admin_notes: 관리자 메모
11. submitted_at: 제출 시간
12. reviewed_at: 검토 시간
13. updated_at: 수정 시간

RLS 정책:
- 사용자는 자신의 인증 정보만 조회/수정 가능
- 관리자는 모든 인증 정보 조회/수정 가능
- 사용자는 상태가 pending일 때만 수정 가능

인증 프로세스:
1. 사용자가 인증 정보 제출 (status: pending)
2. 관리자가 검토 후 승인/거부 (status: approved/rejected)
3. 승인된 사용자만 상담 서비스 이용 가능
*/

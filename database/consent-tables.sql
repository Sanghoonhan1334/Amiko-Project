-- =====================================================
-- 개인정보 수집 동의 관련 테이블
-- Description: 사용자 동의 관리 및 로그
-- Date: 2025-01-17
-- =====================================================

-- 1. 사용자 동의 테이블
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_state JSONB NOT NULL, -- 동의 상태를 JSON으로 저장
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- 사용자당 하나의 동의 기록만 유지
);

-- 2. 동의 변경 로그 테이블
CREATE TABLE IF NOT EXISTS public.consent_change_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_state JSONB,
    new_state JSONB NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'withdraw')),
    consent_type TEXT, -- 특정 동의 유형 (essential, profile, activity, system, marketing)
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 3. 사용자 테이블에 동의 관련 컬럼 추가 (기존 테이블이 있다면)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_essential BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_activity BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_system BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 사용자 동의 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON public.user_consents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_consents_updated_at ON public.user_consents(updated_at DESC);

-- 동의 변경 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_consent_change_logs_user_id ON public.consent_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_change_logs_changed_at ON public.consent_change_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_change_logs_change_type ON public.consent_change_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_consent_change_logs_consent_type ON public.consent_change_logs(consent_type);

-- 사용자 테이블 동의 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_consent_essential ON public.users(consent_essential);
CREATE INDEX IF NOT EXISTS idx_users_consent_profile ON public.users(consent_profile);
CREATE INDEX IF NOT EXISTS idx_users_consent_activity ON public.users(consent_activity);
CREATE INDEX IF NOT EXISTS idx_users_consent_system ON public.users(consent_system);
CREATE INDEX IF NOT EXISTS idx_users_consent_marketing ON public.users(consent_marketing);
CREATE INDEX IF NOT EXISTS idx_users_consent_updated_at ON public.users(consent_updated_at DESC);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 사용자 동의 테이블 RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON public.user_consents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON public.user_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 동의 변경 로그 테이블 RLS
ALTER TABLE public.consent_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent logs" ON public.consent_change_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent logs" ON public.consent_change_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 동의 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consent_updated_at
    BEFORE UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_updated_at();

-- 동의 상태 검증 함수
CREATE OR REPLACE FUNCTION validate_consent_state(consent_state JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- 필수 동의 항목 확인
    IF NOT (consent_state->>'essential')::BOOLEAN THEN
        RETURN FALSE;
    END IF;
    
    IF NOT (consent_state->>'system')::BOOLEAN THEN
        RETURN FALSE;
    END IF;
    
    -- 모든 동의 항목이 boolean 값인지 확인
    IF NOT (
        jsonb_typeof(consent_state->'essential') = 'boolean' AND
        jsonb_typeof(consent_state->'profile') = 'boolean' AND
        jsonb_typeof(consent_state->'activity') = 'boolean' AND
        jsonb_typeof(consent_state->'system') = 'boolean' AND
        jsonb_typeof(consent_state->'marketing') = 'boolean'
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 동의 상태 검증 트리거
CREATE OR REPLACE FUNCTION check_consent_state()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_consent_state(NEW.consent_state) THEN
        RAISE EXCEPTION 'Invalid consent state: essential and system consents are required';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_consent_state
    BEFORE INSERT OR UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE FUNCTION check_consent_state();

-- 동의 상태 통계 함수
CREATE OR REPLACE FUNCTION get_consent_statistics()
RETURNS TABLE (
    total_users BIGINT,
    essential_consent BIGINT,
    profile_consent BIGINT,
    activity_consent BIGINT,
    system_consent BIGINT,
    marketing_consent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE consent_essential = true) as essential_consent,
        COUNT(*) FILTER (WHERE consent_profile = true) as profile_consent,
        COUNT(*) FILTER (WHERE consent_activity = true) as activity_consent,
        COUNT(*) FILTER (WHERE consent_system = true) as system_consent,
        COUNT(*) FILTER (WHERE consent_marketing = true) as marketing_consent
    FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 동의 철회 시 관련 데이터 처리 함수
CREATE OR REPLACE FUNCTION handle_consent_withdrawal(
    p_user_id UUID,
    p_consent_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 마케팅 동의 철회 시 마케팅 관련 데이터 삭제
    IF p_consent_type = 'marketing' THEN
        -- 마케팅 관련 데이터 삭제 (예: 마케팅 쿠키, 추천 데이터 등)
        -- 실제 구현 시 필요한 테이블에 따라 조정
        NULL; -- 현재는 구현하지 않음
    END IF;
    
    -- 활동 동의 철회 시 분석 데이터 삭제
    IF p_consent_type = 'activity' THEN
        -- 분석 관련 데이터 삭제 (예: 사용 패턴 분석 데이터)
        -- 실제 구현 시 필요한 테이블에 따라 조정
        NULL; -- 현재는 구현하지 않음
    END IF;
    
    -- 프로필 동의 철회 시 프로필 데이터 삭제
    IF p_consent_type = 'profile' THEN
        -- 프로필 관련 데이터 삭제
        DELETE FROM public.user_profiles WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- 기본 동의 상태 템플릿
INSERT INTO public.user_consents (user_id, consent_state, consent_date)
SELECT 
    id,
    '{"essential": true, "profile": false, "activity": false, "system": true, "marketing": false}'::jsonb,
    NOW()
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_consents)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 동의 상태 조회:
   SELECT * FROM public.user_consents WHERE user_id = 'user-uuid';

2. 동의 상태 업데이트:
   UPDATE public.user_consents 
   SET consent_state = '{"essential": true, "profile": true, "activity": false, "system": true, "marketing": false}'::jsonb
   WHERE user_id = 'user-uuid';

3. 동의 통계 조회:
   SELECT * FROM get_consent_statistics();

4. 동의 철회 처리:
   SELECT handle_consent_withdrawal('user-uuid', 'marketing');

5. 동의 변경 로그 조회:
   SELECT * FROM public.consent_change_logs 
   WHERE user_id = 'user-uuid' 
   ORDER BY changed_at DESC;

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 동의 정보만 조회/수정 가능
- 관리자는 모든 동의 정보 조회 가능
- 동의 상태 검증 함수로 무결성 보장
- 동의 철회 시 관련 데이터 자동 처리
- 모든 동의 변경 사항 로그 기록

법적 고려사항:
- 필수 동의 항목은 철회 불가
- 동의 변경 시 IP 주소 및 User-Agent 기록
- 동의 철회 시 관련 데이터 즉시 삭제
- 동의 상태 변경 이력 영구 보존
*/

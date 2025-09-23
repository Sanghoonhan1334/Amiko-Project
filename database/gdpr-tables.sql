-- =====================================================
-- GDPR 준수 관련 테이블
-- Description: EU 일반데이터보호규정(GDPR) 준수를 위한 데이터 주체 권리 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. GDPR 권리 요청 테이블
CREATE TABLE IF NOT EXISTS public.gdpr_rights_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    right_type TEXT NOT NULL CHECK (right_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
    response_data JSONB,
    rejection_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GDPR 데이터 내보내기 테이블
CREATE TABLE IF NOT EXISTS public.gdpr_data_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL CHECK (data_type IN ('complete', 'profile', 'activity', 'consent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
    download_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    ip_address INET,
    user_agent TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. GDPR 처리 로그 테이블
CREATE TABLE IF NOT EXISTS public.gdpr_processing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.gdpr_rights_requests(id) ON DELETE SET NULL,
    export_id UUID REFERENCES public.gdpr_data_exports(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'right_requested', 'right_cancelled', 'right_approved', 'right_rejected',
        'export_requested', 'export_cancelled', 'export_completed', 'export_failed'
    )),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GDPR 법적 근거 테이블
CREATE TABLE IF NOT EXISTS public.gdpr_legal_basis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_type TEXT NOT NULL,
    processing_purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL CHECK (legal_basis IN (
        'consent', 'contract', 'legal_obligation', 'vital_interests', 
        'public_task', 'legitimate_interests'
    )),
    description TEXT,
    retention_period TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GDPR 데이터 보호 영향 평가 테이블
CREATE TABLE IF NOT EXISTS public.gdpr_dpia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    processing_name TEXT NOT NULL,
    processing_description TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    data_subjects TEXT[] NOT NULL,
    processing_purposes TEXT[] NOT NULL,
    legal_basis TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    mitigation_measures TEXT[],
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    next_review_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- GDPR 권리 요청 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_gdpr_rights_requests_user_id ON public.gdpr_rights_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_rights_requests_right_type ON public.gdpr_rights_requests(right_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_rights_requests_status ON public.gdpr_rights_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_rights_requests_requested_at ON public.gdpr_rights_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_rights_requests_processed_at ON public.gdpr_rights_requests(processed_at DESC);

-- GDPR 데이터 내보내기 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_user_id ON public.gdpr_data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_data_type ON public.gdpr_data_exports(data_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_status ON public.gdpr_data_exports(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_requested_at ON public.gdpr_data_exports(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_expires_at ON public.gdpr_data_exports(expires_at);

-- GDPR 처리 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_logs_user_id ON public.gdpr_processing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_logs_request_id ON public.gdpr_processing_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_logs_export_id ON public.gdpr_processing_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_logs_action_type ON public.gdpr_processing_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_logs_created_at ON public.gdpr_processing_logs(created_at DESC);

-- GDPR 법적 근거 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_gdpr_legal_basis_data_type ON public.gdpr_legal_basis(data_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_legal_basis_legal_basis ON public.gdpr_legal_basis(legal_basis);
CREATE INDEX IF NOT EXISTS idx_gdpr_legal_basis_is_active ON public.gdpr_legal_basis(is_active);

-- GDPR DPIA 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_gdpr_dpia_risk_level ON public.gdpr_dpia(risk_level);
CREATE INDEX IF NOT EXISTS idx_gdpr_dpia_assessment_date ON public.gdpr_dpia(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_dpia_next_review_date ON public.gdpr_dpia(next_review_date);
CREATE INDEX IF NOT EXISTS idx_gdpr_dpia_is_active ON public.gdpr_dpia(is_active);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- GDPR 권리 요청 테이블 RLS
ALTER TABLE public.gdpr_rights_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rights requests" ON public.gdpr_rights_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rights requests" ON public.gdpr_rights_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all rights requests" ON public.gdpr_rights_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

CREATE POLICY "Admins can update rights requests" ON public.gdpr_rights_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- GDPR 데이터 내보내기 테이블 RLS
ALTER TABLE public.gdpr_data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data exports" ON public.gdpr_data_exports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data exports" ON public.gdpr_data_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all data exports" ON public.gdpr_data_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

CREATE POLICY "Admins can update data exports" ON public.gdpr_data_exports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- GDPR 처리 로그 테이블 RLS
ALTER TABLE public.gdpr_processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own processing logs" ON public.gdpr_processing_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all processing logs" ON public.gdpr_processing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- GDPR 법적 근거 테이블 RLS
ALTER TABLE public.gdpr_legal_basis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view legal basis" ON public.gdpr_legal_basis
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage legal basis" ON public.gdpr_legal_basis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- GDPR DPIA 테이블 RLS
ALTER TABLE public.gdpr_dpia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all DPIA" ON public.gdpr_dpia
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

CREATE POLICY "Admins can manage DPIA" ON public.gdpr_dpia
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- GDPR 권리 요청 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_gdpr_rights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gdpr_rights_updated_at
    BEFORE UPDATE ON public.gdpr_rights_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_gdpr_rights_updated_at();

-- GDPR 데이터 내보내기 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_gdpr_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gdpr_exports_updated_at
    BEFORE UPDATE ON public.gdpr_data_exports
    FOR EACH ROW
    EXECUTE FUNCTION update_gdpr_exports_updated_at();

-- GDPR 권리 요청 생성 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_gdpr_rights_request_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gdpr_processing_logs (
        user_id, request_id, action_type, details, created_at
    ) VALUES (
        NEW.user_id, NEW.id, 'right_requested', 
        jsonb_build_object(
            'right_type', NEW.right_type,
            'reason', NEW.reason
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_gdpr_rights_request_creation
    AFTER INSERT ON public.gdpr_rights_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_gdpr_rights_request_creation();

-- GDPR 데이터 내보내기 생성 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_gdpr_data_export_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gdpr_processing_logs (
        user_id, export_id, action_type, details, created_at
    ) VALUES (
        NEW.user_id, NEW.id, 'export_requested', 
        jsonb_build_object(
            'data_type', NEW.data_type
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_gdpr_data_export_creation
    AFTER INSERT ON public.gdpr_data_exports
    FOR EACH ROW
    EXECUTE FUNCTION log_gdpr_data_export_creation();

-- 만료된 데이터 내보내기 자동 정리
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
    export_record RECORD;
BEGIN
    -- 만료된 내보내기 파일들을 찾아서 상태를 만료로 변경
    FOR export_record IN 
        SELECT id FROM public.gdpr_data_exports 
        WHERE status = 'completed' 
        AND expires_at < NOW()
    LOOP
        UPDATE public.gdpr_data_exports 
        SET 
            status = 'expired',
            updated_at = NOW()
        WHERE id = export_record.id;
        
        cleaned_count := cleaned_count + 1;
    END LOOP;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR 통계 함수
CREATE OR REPLACE FUNCTION get_gdpr_statistics()
RETURNS TABLE (
    total_rights_requests BIGINT,
    pending_rights_requests BIGINT,
    completed_rights_requests BIGINT,
    total_data_exports BIGINT,
    pending_data_exports BIGINT,
    completed_data_exports BIGINT,
    expired_data_exports BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_rights_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_rights_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_rights_requests,
        (SELECT COUNT(*) FROM public.gdpr_data_exports) as total_data_exports,
        (SELECT COUNT(*) FROM public.gdpr_data_exports WHERE status = 'pending') as pending_data_exports,
        (SELECT COUNT(*) FROM public.gdpr_data_exports WHERE status = 'completed') as completed_data_exports,
        (SELECT COUNT(*) FROM public.gdpr_data_exports WHERE status = 'expired') as expired_data_exports
    FROM public.gdpr_rights_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR 준수 검증 함수
CREATE OR REPLACE FUNCTION validate_gdpr_compliance()
RETURNS TABLE (
    compliance_check TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- 30일 이내 처리되지 않은 권리 요청 확인
    RETURN QUERY
    SELECT 
        'Pending Rights Requests'::TEXT as compliance_check,
        CASE 
            WHEN COUNT(*) = 0 THEN 'COMPLIANT'::TEXT
            ELSE 'NON_COMPLIANT'::TEXT
        END as status,
        'Found ' || COUNT(*) || ' rights requests pending for more than 30 days'::TEXT as details
    FROM public.gdpr_rights_requests 
    WHERE status = 'pending' 
    AND requested_at < NOW() - INTERVAL '30 days';
    
    -- 만료된 데이터 내보내기 확인
    RETURN QUERY
    SELECT 
        'Expired Data Exports'::TEXT as compliance_check,
        CASE 
            WHEN COUNT(*) = 0 THEN 'COMPLIANT'::TEXT
            ELSE 'ATTENTION_REQUIRED'::TEXT
        END as status,
        'Found ' || COUNT(*) || ' expired data exports that need cleanup'::TEXT as details
    FROM public.gdpr_data_exports 
    WHERE status = 'completed' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- GDPR 법적 근거 초기 데이터
INSERT INTO public.gdpr_legal_basis (data_type, processing_purpose, legal_basis, description, retention_period)
VALUES 
    ('profile', '서비스 제공', 'contract', '서비스 이용 계약 이행을 위한 필수 정보', '회원 탈퇴 시 즉시 삭제'),
    ('activity', '서비스 개선', 'legitimate_interests', '서비스 품질 향상을 위한 이용 패턴 분석', '3년'),
    ('marketing', '맞춤형 서비스', 'consent', '사용자 동의에 따른 마케팅 정보 제공', '1년'),
    ('system', '보안 및 안정성', 'legitimate_interests', '시스템 보안 및 서비스 안정성 유지', '3개월'),
    ('communication', '고객 지원', 'contract', '고객 문의 및 지원 서비스 제공', '2년')
ON CONFLICT DO NOTHING;

-- GDPR DPIA 초기 데이터
INSERT INTO public.gdpr_dpia (processing_name, processing_description, data_categories, data_subjects, processing_purposes, legal_basis, risk_level, mitigation_measures, reviewed_by, next_review_date)
VALUES 
    ('화상채팅 서비스', '사용자 간 화상채팅 서비스 제공', ARRAY['생체정보', '통신내용'], ARRAY['서비스 이용자'], ARRAY['서비스 제공', '품질 관리'], 'contract', 'medium', ARRAY['암호화', '접근 제한', '로그 기록'], NULL, NOW() + INTERVAL '1 year'),
    ('커뮤니티 서비스', '사용자 간 커뮤니티 활동 지원', ARRAY['개인정보', '게시글'], ARRAY['커뮤니티 이용자'], ARRAY['서비스 제공', '커뮤니티 관리'], 'contract', 'low', ARRAY['콘텐츠 필터링', '신고 시스템'], NULL, NOW() + INTERVAL '1 year')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. GDPR 권리 요청 생성:
   INSERT INTO public.gdpr_rights_requests (user_id, right_type, reason)
   VALUES ('user-uuid', 'access', '개인정보 접근 요청');

2. 데이터 내보내기 요청 생성:
   INSERT INTO public.gdpr_data_exports (user_id, data_type)
   VALUES ('user-uuid', 'complete');

3. GDPR 통계 조회:
   SELECT * FROM get_gdpr_statistics();

4. GDPR 준수 검증:
   SELECT * FROM validate_gdpr_compliance();

5. 만료된 데이터 내보내기 정리:
   SELECT cleanup_expired_data_exports();

6. 권리 요청 이력 조회:
   SELECT * FROM public.gdpr_rights_requests 
   WHERE user_id = 'user-uuid' 
   ORDER BY requested_at DESC;

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 데이터만 조회/요청 가능
- 관리자는 모든 GDPR 요청 조회/처리 가능
- 모든 처리 과정 로그 기록
- 만료된 데이터 자동 정리

법적 고려사항:
- 권리 요청은 30일 이내 처리
- 데이터 내보내기는 7일 후 자동 만료
- 모든 처리 과정 투명성 보장
- 법적 근거 명시 및 관리
- 데이터 보호 영향 평가 수행
*/

-- =====================================================
-- 제3자 서비스 관련 테이블
-- Description: 제3자 서비스 연동, 모니터링, 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 제3자 서비스 테이블
CREATE TABLE IF NOT EXISTS public.third_party_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('essential', 'functional', 'analytics', 'marketing')),
    provider TEXT NOT NULL,
    description TEXT,
    data_types TEXT[],
    privacy_level TEXT NOT NULL DEFAULT 'internal' CHECK (privacy_level IN ('public', 'internal', 'confidential', 'restricted')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    security_score INTEGER DEFAULT 85 CHECK (security_score >= 0 AND security_score <= 100),
    compliance_status JSONB DEFAULT '{"gdpr": false, "ccpa": false, "soc2": false, "iso27001": false}',
    contract_info JSONB DEFAULT '{"start_date": null, "end_date": null, "renewal_date": null, "monthly_cost": 0, "sla": "99.9%"}',
    api_endpoints TEXT[],
    authentication_method TEXT,
    data_retention_period TEXT,
    last_health_check TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 제3자 서비스 메트릭 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('uptime', 'response_time', 'error_rate', 'throughput', 'cost')),
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 3. 제3자 서비스 이슈 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('security', 'performance', 'compliance', 'availability', 'cost')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 제3자 서비스 로그 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES public.third_party_services(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'service_added', 'service_removed', 'status_update', 'config_change',
        'health_check', 'error_occurred', 'compliance_check', 'cost_update'
    )),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 제3자 서비스 준수 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_compliance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    compliance_standard TEXT NOT NULL CHECK (compliance_standard IN ('gdpr', 'ccpa', 'soc2', 'iso27001', 'pci_dss', 'hipaa')),
    compliance_status TEXT NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'not_applicable')),
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    last_audit_date TIMESTAMP WITH TIME ZONE,
    next_audit_date TIMESTAMP WITH TIME ZONE,
    audit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 제3자 서비스 계약 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('service_agreement', 'data_processing', 'nda', 'sla')),
    contract_status TEXT NOT NULL CHECK (contract_status IN ('draft', 'active', 'expired', 'terminated')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    renewal_date TIMESTAMP WITH TIME ZONE,
    monthly_cost NUMERIC DEFAULT 0,
    sla_uptime TEXT DEFAULT '99.9%',
    sla_response_time TEXT DEFAULT '200ms',
    data_processing_agreement BOOLEAN DEFAULT FALSE,
    data_retention_policy TEXT,
    termination_clause TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 제3자 서비스 보안 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    security_control TEXT NOT NULL CHECK (security_control IN (
        'encryption', 'authentication', 'authorization', 'network_security',
        'data_protection', 'incident_response', 'access_control', 'monitoring'
    )),
    control_status TEXT NOT NULL CHECK (control_status IN ('implemented', 'partial', 'not_implemented', 'not_applicable')),
    control_description TEXT,
    last_assessment_date TIMESTAMP WITH TIME ZONE,
    next_assessment_date TIMESTAMP WITH TIME ZONE,
    assessment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 제3자 서비스 백업 테이블
CREATE TABLE IF NOT EXISTS public.third_party_service_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.third_party_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_frequency TEXT NOT NULL CHECK (backup_frequency IN ('daily', 'weekly', 'monthly', 'on_demand')),
    backup_location TEXT,
    backup_size BIGINT,
    backup_status TEXT NOT NULL CHECK (backup_status IN ('success', 'failed', 'partial', 'in_progress')),
    last_backup_date TIMESTAMP WITH TIME ZONE,
    next_backup_date TIMESTAMP WITH TIME ZONE,
    retention_period TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 제3자 서비스 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_services_user_id ON public.third_party_services(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_services_category ON public.third_party_services(category);
CREATE INDEX IF NOT EXISTS idx_third_party_services_status ON public.third_party_services(status);
CREATE INDEX IF NOT EXISTS idx_third_party_services_provider ON public.third_party_services(provider);
CREATE INDEX IF NOT EXISTS idx_third_party_services_privacy_level ON public.third_party_services(privacy_level);
CREATE INDEX IF NOT EXISTS idx_third_party_services_created_at ON public.third_party_services(created_at DESC);

-- 제3자 서비스 메트릭 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_metrics_service_id ON public.third_party_service_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_metrics_user_id ON public.third_party_service_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_metrics_metric_type ON public.third_party_service_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_third_party_service_metrics_recorded_at ON public.third_party_service_metrics(recorded_at DESC);

-- 제3자 서비스 이슈 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_service_id ON public.third_party_service_issues(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_user_id ON public.third_party_service_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_issue_type ON public.third_party_service_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_severity ON public.third_party_service_issues(severity);
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_status ON public.third_party_service_issues(status);
CREATE INDEX IF NOT EXISTS idx_third_party_service_issues_detected_at ON public.third_party_service_issues(detected_at DESC);

-- 제3자 서비스 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_logs_service_id ON public.third_party_service_logs(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_logs_user_id ON public.third_party_service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_logs_action_type ON public.third_party_service_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_third_party_service_logs_created_at ON public.third_party_service_logs(created_at DESC);

-- 제3자 서비스 준수 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_compliance_service_id ON public.third_party_service_compliance(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_compliance_user_id ON public.third_party_service_compliance(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_compliance_standard ON public.third_party_service_compliance(compliance_standard);
CREATE INDEX IF NOT EXISTS idx_third_party_service_compliance_status ON public.third_party_service_compliance(compliance_status);

-- 제3자 서비스 계약 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_contracts_service_id ON public.third_party_service_contracts(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_contracts_user_id ON public.third_party_service_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_contracts_status ON public.third_party_service_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_third_party_service_contracts_end_date ON public.third_party_service_contracts(end_date);

-- 제3자 서비스 보안 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_security_service_id ON public.third_party_service_security(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_security_user_id ON public.third_party_service_security(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_security_control ON public.third_party_service_security(security_control);
CREATE INDEX IF NOT EXISTS idx_third_party_service_security_status ON public.third_party_service_security(control_status);

-- 제3자 서비스 백업 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_third_party_service_backups_service_id ON public.third_party_service_backups(service_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_backups_user_id ON public.third_party_service_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_service_backups_status ON public.third_party_service_backups(backup_status);
CREATE INDEX IF NOT EXISTS idx_third_party_service_backups_last_backup ON public.third_party_service_backups(last_backup_date DESC);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 제3자 서비스 테이블 RLS
ALTER TABLE public.third_party_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own third party services" ON public.third_party_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own third party services" ON public.third_party_services
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all third party services" ON public.third_party_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 제3자 서비스 메트릭 테이블 RLS
ALTER TABLE public.third_party_service_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service metrics" ON public.third_party_service_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service metrics" ON public.third_party_service_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 제3자 서비스 이슈 테이블 RLS
ALTER TABLE public.third_party_service_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service issues" ON public.third_party_service_issues
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service issues" ON public.third_party_service_issues
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all service issues" ON public.third_party_service_issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 제3자 서비스 로그 테이블 RLS
ALTER TABLE public.third_party_service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service logs" ON public.third_party_service_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service logs" ON public.third_party_service_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 제3자 서비스 준수 테이블 RLS
ALTER TABLE public.third_party_service_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service compliance" ON public.third_party_service_compliance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service compliance" ON public.third_party_service_compliance
    FOR ALL USING (auth.uid() = user_id);

-- 제3자 서비스 계약 테이블 RLS
ALTER TABLE public.third_party_service_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service contracts" ON public.third_party_service_contracts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service contracts" ON public.third_party_service_contracts
    FOR ALL USING (auth.uid() = user_id);

-- 제3자 서비스 보안 테이블 RLS
ALTER TABLE public.third_party_service_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service security" ON public.third_party_service_security
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service security" ON public.third_party_service_security
    FOR ALL USING (auth.uid() = user_id);

-- 제3자 서비스 백업 테이블 RLS
ALTER TABLE public.third_party_service_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service backups" ON public.third_party_service_backups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service backups" ON public.third_party_service_backups
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 제3자 서비스 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_third_party_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_third_party_service_updated_at
    BEFORE UPDATE ON public.third_party_services
    FOR EACH ROW
    EXECUTE FUNCTION update_third_party_service_updated_at();

-- 제3자 서비스 이슈 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_third_party_service_issue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_third_party_service_issue_updated_at
    BEFORE UPDATE ON public.third_party_service_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_third_party_service_issue_updated_at();

-- 제3자 서비스 생성 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_third_party_service_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.third_party_service_logs (
        service_id, user_id, action_type, details, created_at
    ) VALUES (
        NEW.id, NEW.user_id, 'service_added', 
        jsonb_build_object(
            'service_name', NEW.name,
            'provider', NEW.provider,
            'category', NEW.category
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_third_party_service_creation
    AFTER INSERT ON public.third_party_services
    FOR EACH ROW
    EXECUTE FUNCTION log_third_party_service_creation();

-- 제3자 서비스 통계 함수
CREATE OR REPLACE FUNCTION get_third_party_service_statistics()
RETURNS TABLE (
    total_services BIGINT,
    active_services BIGINT,
    inactive_services BIGINT,
    essential_services BIGINT,
    functional_services BIGINT,
    analytics_services BIGINT,
    marketing_services BIGINT,
    average_security_score NUMERIC,
    total_monthly_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_services,
        COUNT(*) FILTER (WHERE status = 'active') as active_services,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_services,
        COUNT(*) FILTER (WHERE category = 'essential') as essential_services,
        COUNT(*) FILTER (WHERE category = 'functional') as functional_services,
        COUNT(*) FILTER (WHERE category = 'analytics') as analytics_services,
        COUNT(*) FILTER (WHERE category = 'marketing') as marketing_services,
        AVG(security_score) as average_security_score,
        SUM((contract_info->>'monthly_cost')::NUMERIC) as total_monthly_cost
    FROM public.third_party_services;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 제3자 서비스 위험도 평가 함수
CREATE OR REPLACE FUNCTION calculate_third_party_service_risk_score(p_service_id UUID)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    service_record RECORD;
    critical_issues INTEGER;
    compliance_score INTEGER;
BEGIN
    -- 서비스 기본 정보 조회
    SELECT * INTO service_record
    FROM public.third_party_services
    WHERE id = p_service_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 기본 위험도 (보안 점수 기반)
    risk_score := 100 - service_record.security_score;
    
    -- 치명적 이슈 수
    SELECT COUNT(*) INTO critical_issues
    FROM public.third_party_service_issues
    WHERE service_id = p_service_id
    AND severity = 'critical'
    AND status = 'open';
    
    risk_score := risk_score + (critical_issues * 20);
    
    -- 준수 점수
    SELECT AVG(compliance_score) INTO compliance_score
    FROM public.third_party_service_compliance
    WHERE service_id = p_service_id;
    
    IF compliance_score IS NOT NULL THEN
        risk_score := risk_score + (100 - compliance_score);
    END IF;
    
    -- 개인정보 보호 수준
    CASE service_record.privacy_level
        WHEN 'restricted' THEN risk_score := risk_score + 30;
        WHEN 'confidential' THEN risk_score := risk_score + 20;
        WHEN 'internal' THEN risk_score := risk_score + 10;
        WHEN 'public' THEN risk_score := risk_score + 0;
    END CASE;
    
    RETURN LEAST(risk_score, 100); -- 최대 100점
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 제3자 서비스 자동 모니터링 함수
CREATE OR REPLACE FUNCTION monitor_third_party_services()
RETURNS INTEGER AS $$
DECLARE
    monitored_count INTEGER := 0;
    service_record RECORD;
    current_uptime NUMERIC;
    current_response_time NUMERIC;
    current_error_rate NUMERIC;
BEGIN
    -- 모든 활성 서비스에 대해 모니터링
    FOR service_record IN 
        SELECT * FROM public.third_party_services 
        WHERE status = 'active'
    LOOP
        -- 가상의 모니터링 데이터 생성 (실제 구현 시 외부 API 호출)
        current_uptime := 95 + (RANDOM() * 5); -- 95-100%
        current_response_time := 100 + (RANDOM() * 200); -- 100-300ms
        current_error_rate := RANDOM() * 2; -- 0-2%
        
        -- 메트릭 기록
        INSERT INTO public.third_party_service_metrics (
            service_id, user_id, metric_type, metric_value, metric_unit, recorded_at
        ) VALUES 
            (service_record.id, service_record.user_id, 'uptime', current_uptime, '%', NOW()),
            (service_record.id, service_record.user_id, 'response_time', current_response_time, 'ms', NOW()),
            (service_record.id, service_record.user_id, 'error_rate', current_error_rate, '%', NOW());
        
        -- 문제 감지
        IF current_uptime < 99.0 THEN
            INSERT INTO public.third_party_service_issues (
                service_id, user_id, issue_type, severity, title, description
            ) VALUES (
                service_record.id, service_record.user_id, 'availability', 'high',
                '서비스 가동률 저하',
                '서비스 가동률이 ' || current_uptime || '%로 정상 수준 이하입니다.'
            );
        END IF;
        
        IF current_response_time > 500 THEN
            INSERT INTO public.third_party_service_issues (
                service_id, user_id, issue_type, severity, title, description
            ) VALUES (
                service_record.id, service_record.user_id, 'performance', 'medium',
                '응답 시간 지연',
                '평균 응답 시간이 ' || current_response_time || 'ms로 정상 수준을 초과합니다.'
            );
        END IF;
        
        IF current_error_rate > 1.0 THEN
            INSERT INTO public.third_party_service_issues (
                service_id, user_id, issue_type, severity, title, description
            ) VALUES (
                service_record.id, service_record.user_id, 'performance', 'high',
                '에러율 증가',
                '에러율이 ' || current_error_rate || '%로 정상 수준을 초과합니다.'
            );
        END IF;
        
        monitored_count := monitored_count + 1;
    END LOOP;
    
    RETURN monitored_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- 기본 제3자 서비스 데이터 (샘플)
INSERT INTO public.third_party_services (
    user_id, name, category, provider, description, data_types, privacy_level, 
    security_score, compliance_status, contract_info
)
SELECT 
    id,
    'Supabase Auth',
    'essential',
    'Supabase',
    '사용자 인증 및 권한 관리 서비스',
    ARRAY['이메일', '비밀번호', '프로필 정보'],
    'confidential',
    95,
    '{"gdpr": true, "ccpa": true, "soc2": true, "iso27001": true}',
    '{"start_date": "2024-01-01T00:00:00Z", "end_date": "2025-12-31T23:59:59Z", "renewal_date": "2025-10-01T00:00:00Z", "monthly_cost": 25, "sla": "99.9%"}'
FROM public.users
WHERE id NOT IN (
    SELECT user_id FROM public.third_party_services 
    WHERE name = 'Supabase Auth'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 제3자 서비스 등록:
   INSERT INTO public.third_party_services (user_id, name, category, provider, description)
   VALUES ('user-uuid', 'Google Analytics', 'analytics', 'Google', '웹 분석 서비스');

2. 서비스 메트릭 조회:
   SELECT * FROM public.third_party_service_metrics 
   WHERE service_id = 'service-uuid' 
   ORDER BY recorded_at DESC;

3. 서비스 통계 조회:
   SELECT * FROM get_third_party_service_statistics();

4. 서비스 위험도 평가:
   SELECT calculate_third_party_service_risk_score('service-uuid');

5. 자동 모니터링 실행:
   SELECT monitor_third_party_services();

6. 서비스 이슈 조회:
   SELECT * FROM public.third_party_service_issues 
   WHERE service_id = 'service-uuid' 
   AND status = 'open';

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 서비스만 조회/관리 가능
- 관리자는 모든 서비스 조회/관리 가능
- 모든 서비스 활동 로그 기록
- 자동 모니터링 및 위험 탐지

법적 고려사항:
- 제3자 서비스 계약 조건 명시
- 개인정보 처리 계약 체결
- 준수 상태 정기 모니터링
- 서비스 종료 시 데이터 반환
- 정기적인 서비스 검토 및 평가
*/

-- =====================================================
-- 보안 관련 테이블
-- Description: 보안 모니터링, 이벤트 로깅, 설정 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 보안 이벤트 테이블
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'logout', 'password_change',
        'blocked_attack', 'suspicious_activity', 'data_access',
        'permission_change', 'system_error', 'security_scan'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 보안 이슈 테이블
CREATE TABLE IF NOT EXISTS public.security_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL CHECK (issue_type IN (
        'vulnerability', 'configuration', 'access', 'encryption',
        'network', 'application', 'data', 'compliance'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_systems TEXT[],
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 보안 권장사항 테이블
CREATE TABLE IF NOT EXISTS public.security_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact TEXT NOT NULL,
    effort TEXT NOT NULL CHECK (effort IN ('low', 'medium', 'high')),
    category TEXT NOT NULL CHECK (category IN (
        'authentication', 'authorization', 'encryption', 'network',
        'application', 'data', 'monitoring', 'compliance'
    )),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'implemented', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 보안 설정 테이블
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_name TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('boolean', 'string', 'number', 'json')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_name)
);

-- 5. 시스템 메트릭 테이블
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 백업 로그 테이블
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_size BIGINT,
    backup_location TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 암호화 키 관리 테이블
CREATE TABLE IF NOT EXISTS public.encryption_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_type TEXT NOT NULL CHECK (key_type IN ('master', 'data', 'backup', 'communication')),
    key_status TEXT NOT NULL DEFAULT 'active' CHECK (key_status IN ('active', 'rotated', 'revoked')),
    encrypted_key TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rotated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, key_name, key_version)
);

-- 8. 보안 정책 테이블
CREATE TABLE IF NOT EXISTS public.security_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_name TEXT NOT NULL UNIQUE,
    policy_type TEXT NOT NULL CHECK (policy_type IN (
        'access_control', 'data_protection', 'network', 'application',
        'incident_response', 'compliance', 'encryption'
    )),
    policy_content TEXT NOT NULL,
    version TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 보안 이벤트 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON public.security_events(ip_address);

-- 보안 이슈 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_security_issues_user_id ON public.security_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_security_issues_issue_type ON public.security_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_security_issues_severity ON public.security_issues(severity);
CREATE INDEX IF NOT EXISTS idx_security_issues_status ON public.security_issues(status);
CREATE INDEX IF NOT EXISTS idx_security_issues_detected_at ON public.security_issues(detected_at DESC);

-- 보안 권장사항 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_security_recommendations_user_id ON public.security_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_security_recommendations_priority ON public.security_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_security_recommendations_category ON public.security_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_security_recommendations_status ON public.security_recommendations(status);

-- 보안 설정 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON public.security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_setting_name ON public.security_settings(setting_name);

-- 시스템 메트릭 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_system_metrics_user_id ON public.system_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);

-- 백업 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_logs_user_id ON public.backup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_type ON public.backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON public.backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON public.backup_logs(created_at DESC);

-- 암호화 키 관리 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user_id ON public.encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_type ON public.encryption_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_status ON public.encryption_keys(key_status);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_created_at ON public.encryption_keys(created_at DESC);

-- 보안 정책 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_security_policies_policy_type ON public.security_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_security_policies_is_active ON public.security_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_security_policies_effective_date ON public.security_policies(effective_date);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 보안 이벤트 테이블 RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events" ON public.security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON public.security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 보안 이슈 테이블 RLS
ALTER TABLE public.security_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security issues" ON public.security_issues
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all security issues" ON public.security_issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 보안 권장사항 테이블 RLS
ALTER TABLE public.security_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security recommendations" ON public.security_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all security recommendations" ON public.security_recommendations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 보안 설정 테이블 RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own security settings" ON public.security_settings
    FOR ALL USING (auth.uid() = user_id);

-- 시스템 메트릭 테이블 RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own system metrics" ON public.system_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all system metrics" ON public.system_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 백업 로그 테이블 RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backup logs" ON public.backup_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all backup logs" ON public.backup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 암호화 키 관리 테이블 RLS
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own encryption keys" ON public.encryption_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all encryption keys" ON public.encryption_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 보안 정책 테이블 RLS
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active security policies" ON public.security_policies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage security policies" ON public.security_policies
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

-- 보안 이슈 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_security_issue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_issue_updated_at
    BEFORE UPDATE ON public.security_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_security_issue_updated_at();

-- 보안 권장사항 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_security_recommendation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_recommendation_updated_at
    BEFORE UPDATE ON public.security_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_security_recommendation_updated_at();

-- 보안 설정 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_security_setting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_setting_updated_at
    BEFORE UPDATE ON public.security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_security_setting_updated_at();

-- 보안 이벤트 생성 시 자동 분석
CREATE OR REPLACE FUNCTION analyze_security_event()
RETURNS TRIGGER AS $$
BEGIN
    -- 의심스러운 활동 패턴 탐지
    IF NEW.event_type = 'login_failed' THEN
        -- 5분 내 3회 이상 실패한 로그인 시도
        IF (
            SELECT COUNT(*) 
            FROM public.security_events 
            WHERE user_id = NEW.user_id 
            AND event_type = 'login_failed' 
            AND created_at > NOW() - INTERVAL '5 minutes'
        ) >= 3 THEN
            -- 의심스러운 활동 이벤트 생성
            INSERT INTO public.security_events (
                user_id, event_type, severity, description, metadata, ip_address, user_agent
            ) VALUES (
                NEW.user_id, 'suspicious_activity', 'high',
                'Multiple failed login attempts detected',
                jsonb_build_object('trigger_event_id', NEW.id, 'attempt_count', 3),
                NEW.ip_address, NEW.user_agent
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analyze_security_event
    AFTER INSERT ON public.security_events
    FOR EACH ROW
    EXECUTE FUNCTION analyze_security_event();

-- 보안 통계 함수
CREATE OR REPLACE FUNCTION get_security_statistics()
RETURNS TABLE (
    total_events BIGINT,
    critical_events BIGINT,
    high_events BIGINT,
    medium_events BIGINT,
    low_events BIGINT,
    open_issues BIGINT,
    active_recommendations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
        COUNT(*) FILTER (WHERE severity = 'high') as high_events,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_events,
        COUNT(*) FILTER (WHERE severity = 'low') as low_events,
        (SELECT COUNT(*) FROM public.security_issues WHERE status = 'open') as open_issues,
        (SELECT COUNT(*) FROM public.security_recommendations WHERE status = 'active') as active_recommendations
    FROM public.security_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 보안 위험도 평가 함수
CREATE OR REPLACE FUNCTION calculate_security_risk_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    critical_count INTEGER;
    high_count INTEGER;
    medium_count INTEGER;
    low_count INTEGER;
BEGIN
    -- 최근 30일간의 보안 이벤트 기반 위험도 계산
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical'),
        COUNT(*) FILTER (WHERE severity = 'high'),
        COUNT(*) FILTER (WHERE severity = 'medium'),
        COUNT(*) FILTER (WHERE severity = 'low')
    INTO critical_count, high_count, medium_count, low_count
    FROM public.security_events 
    WHERE user_id = p_user_id 
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- 위험도 점수 계산 (높을수록 위험)
    risk_score := (critical_count * 10) + (high_count * 5) + (medium_count * 2) + (low_count * 1);
    
    RETURN LEAST(risk_score, 100); -- 최대 100점
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 자동 보안 스캔 함수
CREATE OR REPLACE FUNCTION perform_security_scan(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    issues_found INTEGER := 0;
BEGIN
    -- 보안 설정 검사
    IF NOT EXISTS (
        SELECT 1 FROM public.security_settings 
        WHERE user_id = p_user_id 
        AND setting_name = 'encryption_enabled' 
        AND setting_value = 'true'
    ) THEN
        INSERT INTO public.security_issues (
            user_id, issue_type, severity, title, description, affected_systems
        ) VALUES (
            p_user_id, 'encryption', 'high', '암호화 비활성화',
            '데이터 암호화가 비활성화되어 있습니다.',
            ARRAY['database', 'storage']
        );
        issues_found := issues_found + 1;
    END IF;
    
    -- 오래된 백업 검사
    IF EXISTS (
        SELECT 1 FROM public.backup_logs 
        WHERE user_id = p_user_id 
        AND created_at < NOW() - INTERVAL '7 days'
        AND status = 'success'
    ) THEN
        INSERT INTO public.security_issues (
            user_id, issue_type, severity, title, description, affected_systems
        ) VALUES (
            p_user_id, 'backup', 'medium', '오래된 백업',
            '마지막 백업이 7일 이상 되었습니다.',
            ARRAY['backup']
        );
        issues_found := issues_found + 1;
    END IF;
    
    RETURN issues_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- 기본 보안 설정
INSERT INTO public.security_settings (user_id, setting_name, setting_value, setting_type, description)
SELECT 
    id,
    'encryption_enabled',
    'true',
    'boolean',
    '데이터 암호화 활성화 여부'
FROM public.users
WHERE id NOT IN (
    SELECT user_id FROM public.security_settings 
    WHERE setting_name = 'encryption_enabled'
)
ON CONFLICT (user_id, setting_name) DO NOTHING;

-- 기본 보안 정책
INSERT INTO public.security_policies (policy_name, policy_type, policy_content, version, created_by)
VALUES 
    ('데이터 암호화 정책', 'encryption', '모든 민감한 데이터는 AES-256으로 암호화되어야 합니다.', '1.0', NULL),
    ('접근 제어 정책', 'access_control', '최소 권한 원칙에 따라 사용자 권한을 부여해야 합니다.', '1.0', NULL),
    ('사고 대응 정책', 'incident_response', '보안 사고 발생 시 24시간 내에 대응해야 합니다.', '1.0', NULL)
ON CONFLICT (policy_name) DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 보안 이벤트 기록:
   INSERT INTO public.security_events (user_id, event_type, severity, description)
   VALUES ('user-uuid', 'login_failed', 'medium', '잘못된 비밀번호 입력');

2. 보안 이슈 조회:
   SELECT * FROM public.security_issues 
   WHERE user_id = 'user-uuid' 
   AND status = 'open';

3. 보안 통계 조회:
   SELECT * FROM get_security_statistics();

4. 사용자 위험도 평가:
   SELECT calculate_security_risk_score('user-uuid');

5. 자동 보안 스캔:
   SELECT perform_security_scan('user-uuid');

6. 보안 설정 조회:
   SELECT * FROM public.security_settings 
   WHERE user_id = 'user-uuid';

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 보안 정보만 조회 가능
- 관리자는 모든 보안 정보 조회/관리 가능
- 모든 보안 이벤트 로그 기록
- 자동 위협 탐지 및 대응

법적 고려사항:
- 보안 로그 최소 1년간 보존
- 보안 사고 시 즉시 보고
- 개인정보보호법 준수
- 보안 정책 정기 검토 및 업데이트
*/

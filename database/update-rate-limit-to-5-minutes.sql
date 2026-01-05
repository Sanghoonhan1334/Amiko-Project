-- =====================================================
-- Rate Limit 제한 시간을 60분에서 5분으로 변경
-- Date: 2025-01-31
-- =====================================================

-- check_auth_rate_limit 함수 수정: block_duration을 5분으로 변경
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
    p_identifier TEXT,
    p_auth_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rate_limit_record RECORD;
    max_attempts INTEGER := 5;
    block_duration INTERVAL := '5 minutes';  -- 60분에서 5분으로 변경
BEGIN
    -- 기존 시도 기록 조회
    SELECT * INTO rate_limit_record
    FROM public.auth_rate_limits
    WHERE identifier = p_identifier AND auth_type = p_auth_type;
    
    -- 기록이 없는 경우 새로 생성
    IF NOT FOUND THEN
        INSERT INTO public.auth_rate_limits (identifier, auth_type, attempt_count)
        VALUES (p_identifier, p_auth_type, 1);
        RETURN TRUE;
    END IF;
    
    -- 차단 시간이 지났는지 확인
    IF rate_limit_record.blocked_until IS NOT NULL AND rate_limit_record.blocked_until > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- 시도 횟수 증가
    UPDATE public.auth_rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = NOW(),
        blocked_until = CASE 
            WHEN attempt_count + 1 >= max_attempts THEN NOW() + block_duration
            ELSE NULL
        END
    WHERE identifier = p_identifier AND auth_type = p_auth_type;
    
    -- 최대 시도 횟수 초과 시 차단
    IF rate_limit_record.attempt_count + 1 >= max_attempts THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


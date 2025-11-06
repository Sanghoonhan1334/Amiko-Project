-- =====================================================
-- 포인트 시스템 인증 문제 해결
-- Description: add_points_with_limit 함수에서 auth 체크 제거
-- Reason: 서버 사이드 API에서 auth.uid()가 NULL이 되어 포인트 적립 실패
-- Solution: API 레벨에서 이미 인증을 처리하므로 함수에서는 제거
-- =====================================================

-- 1. add_points_with_limit 함수 재생성 (인증 체크 제거)
DROP FUNCTION IF EXISTS add_points_with_limit(UUID, VARCHAR, INTEGER, TEXT, UUID, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION add_points_with_limit(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_amount INTEGER,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    activity_allowed BOOLEAN;
BEGIN
    -- ✅ 인증 체크 제거 (API 레벨에서 이미 처리)
    -- ✅ SECURITY DEFINER 제거 (RLS 정책으로 보안 처리)
    
    -- 일일 활동 제한 확인 및 업데이트
    activity_allowed := update_daily_activity(p_user_id, p_type, p_amount);
    
    IF NOT activity_allowed THEN
        RETURN FALSE;  -- 일일 한도 초과 또는 활동 제한 도달
    END IF;
    
    -- 포인트 히스토리 추가
    INSERT INTO public.points_history (
        user_id, 
        points, 
        type, 
        description, 
        related_id, 
        related_type
    ) VALUES (
        p_user_id, 
        p_amount, 
        p_type, 
        p_description, 
        p_related_id, 
        p_related_type
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'add_points_with_limit 함수 인증 문제 해결 완료!' as message;


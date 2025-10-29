-- 포인트 적립 함수에 인증 추가
-- Supabase SQL Editor에서 실행하세요

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
    current_user_id UUID;
BEGIN
    -- 인증 확인: 로그인한 사용자만 포인트 적립 가능
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다. 로그인 후 이용해주세요.';
    END IF;
    
    -- 인증된 사용자와 요청한 user_id가 일치하는지 확인 (본인만 자신의 포인트를 적립할 수 있음)
    IF current_user_id != p_user_id THEN
        RAISE EXCEPTION '자신의 포인트만 적립할 수 있습니다.';
    END IF;
    
    -- 일일 활동 제한 확인 및 업데이트
    activity_allowed := update_daily_activity(p_user_id, p_type, p_amount);
    
    IF NOT activity_allowed THEN
        RETURN FALSE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
SELECT '포인트 적립 함수에 인증 추가 완료!' as message;


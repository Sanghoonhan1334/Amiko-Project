-- 포인트 기록 테이블
CREATE TABLE IF NOT EXISTS public.points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'question_post', 'answer_post', 'story_post', 'freeboard_post',
        'comment', 'reaction_received', 'reaction_given',
        'daily_login', 'attendance_check', 'consultation',
        'admin_grant', 'admin_deduct', 'purchase', 'refund'
    )),
    amount INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
    description TEXT NOT NULL,
    related_id UUID, -- 관련 게시물/댓글/예약 ID
    related_type TEXT CHECK (related_type IN ('post', 'comment', 'booking', 'attendance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 적립 함수
CREATE OR REPLACE FUNCTION add_points(
    p_user_id UUID,
    p_type TEXT,
    p_amount INTEGER,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- 포인트 기록 추가
    INSERT INTO public.points (
        user_id, 
        type, 
        amount, 
        description, 
        related_id, 
        related_type
    ) VALUES (
        p_user_id, 
        p_type, 
        p_amount, 
        p_description, 
        p_related_id, 
        p_related_type
    );
    
    -- 사용자 프로필의 총 포인트 업데이트
    PERFORM update_user_points(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql;

-- 일일 포인트 한도 확인 함수
CREATE OR REPLACE FUNCTION check_daily_point_limit(
    p_user_id UUID,
    p_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    daily_limit INTEGER := 20;
    today_points INTEGER;
BEGIN
    -- 오늘 적립된 포인트 계산
    SELECT COALESCE(SUM(amount), 0) INTO today_points
    FROM public.points 
    WHERE user_id = p_user_id 
    AND amount > 0 
    AND created_at >= CURRENT_DATE;
    
    RETURN today_points < daily_limit;
END;
$$ LANGUAGE plpgsql;

-- 포인트 적립 (한도 체크 포함)
CREATE OR REPLACE FUNCTION add_points_with_limit(
    p_user_id UUID,
    p_type TEXT,
    p_amount INTEGER,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 포인트가 양수이고 일일 한도를 초과하는지 확인
    IF p_amount > 0 AND NOT check_daily_point_limit(p_user_id, p_type) THEN
        RETURN FALSE;
    END IF;
    
    -- 포인트 적립
    PERFORM add_points(p_user_id, p_type, p_amount, p_description, p_related_id, p_related_type);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

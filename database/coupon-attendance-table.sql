-- =====================================================
-- 쿠폰 출석체크 테이블 (Coupon Attendance Table)
-- Description: 쿠폰 이벤트 출석체크 상태를 저장하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 쿠폰 출석체크 테이블
CREATE TABLE IF NOT EXISTS public.coupon_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- 출석체크 날짜
    streak_count INTEGER DEFAULT 1, -- 연속 출석 일수
    is_completed BOOLEAN DEFAULT TRUE, -- 출석체크 완료 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 사용자가 같은 날짜에 중복 출석체크 방지
    UNIQUE(user_id, date)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupon_attendance_user_id ON public.coupon_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_attendance_date ON public.coupon_attendance(date);
CREATE INDEX IF NOT EXISTS idx_coupon_attendance_user_date ON public.coupon_attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_coupon_attendance_created_at ON public.coupon_attendance(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.coupon_attendance ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 출석체크 기록만 볼 수 있음
CREATE POLICY "Users can view own coupon attendance" ON public.coupon_attendance
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 출석체크 기록을 생성할 수 있음
CREATE POLICY "Users can create own coupon attendance" ON public.coupon_attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 출석체크 기록을 업데이트할 수 있음
CREATE POLICY "Users can update own coupon attendance" ON public.coupon_attendance
    FOR UPDATE USING (auth.uid() = user_id);

-- 관리자는 모든 출석체크 기록을 관리할 수 있음
CREATE POLICY "Admins can manage all coupon attendance" ON public.coupon_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- 5. 출석체크 함수
CREATE OR REPLACE FUNCTION check_coupon_attendance(
    user_uuid UUID DEFAULT NULL,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    user_id_to_use UUID;
    today_record RECORD;
    current_streak INTEGER := 0;
    can_check_today BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_id_to_use := auth.uid();
    ELSE
        user_id_to_use := user_uuid;
    END IF;
    
    -- 오늘 출석체크 기록 확인
    SELECT * INTO today_record
    FROM public.coupon_attendance
    WHERE user_id = user_id_to_use
        AND date = check_date;
    
    -- 오늘 이미 출석체크를 했다면
    IF FOUND THEN
        can_check_today := FALSE;
        current_streak := today_record.streak_count;
    ELSE
        can_check_today := TRUE;
        
        -- 어제 출석체크 기록 확인하여 연속 일수 계산
        SELECT streak_count INTO current_streak
        FROM public.coupon_attendance
        WHERE user_id = user_id_to_use
            AND date = check_date - INTERVAL '1 day'
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- 어제 기록이 없으면 1부터 시작
        IF NOT FOUND THEN
            current_streak := 0;
        END IF;
    END IF;
    
    -- 결과 반환
    result := json_build_object(
        'canCheckToday', can_check_today,
        'currentStreak', current_streak,
        'todayChecked', FOUND,
        'checkDate', check_date
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 출석체크 실행 함수
CREATE OR REPLACE FUNCTION execute_coupon_attendance(
    user_uuid UUID DEFAULT NULL,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    user_id_to_use UUID;
    attendance_info JSON;
    new_streak INTEGER;
    result JSON;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_id_to_use := auth.uid();
    ELSE
        user_id_to_use := user_uuid;
    END IF;
    
    -- 출석체크 가능 여부 확인
    SELECT check_coupon_attendance(user_id_to_use, check_date) INTO attendance_info;
    
    -- 오늘 이미 출석체크를 했다면
    IF (attendance_info->>'canCheckToday')::BOOLEAN = FALSE THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', '오늘 이미 출석체크를 완료했습니다.',
            'currentStreak', (attendance_info->>'currentStreak')::INTEGER
        );
    END IF;
    
    -- 새로운 연속 일수 계산
    new_streak := (attendance_info->>'currentStreak')::INTEGER + 1;
    
    -- 출석체크 기록 생성
    INSERT INTO public.coupon_attendance (
        user_id,
        date,
        streak_count,
        is_completed
    ) VALUES (
        user_id_to_use,
        check_date,
        new_streak,
        TRUE
    );
    
    -- 3일 연속 완료 시 쿠폰 지급 (추후 구현)
    -- TODO: 3일 완료 시 쿠폰 지급 로직 추가
    
    -- 결과 반환
    result := json_build_object(
        'success', TRUE,
        'message', '출석체크가 완료되었습니다.',
        'currentStreak', new_streak,
        'isCompleted', new_streak >= 3,
        'checkDate', check_date
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 사용자 출석체크 히스토리 조회 함수
CREATE OR REPLACE FUNCTION get_coupon_attendance_history(
    user_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    streak_count INTEGER,
    is_completed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_id_to_use UUID;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_id_to_use := auth.uid();
    ELSE
        user_id_to_use := user_uuid;
    END IF;
    
    RETURN QUERY
    SELECT 
        ca.date,
        ca.streak_count,
        ca.is_completed,
        ca.created_at
    FROM public.coupon_attendance ca
    WHERE ca.user_id = user_id_to_use
    ORDER BY ca.date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
쿠폰 출석체크 테이블 필드 설명:

1. id: 출석체크 기록 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. date: 출석체크 날짜
4. streak_count: 연속 출석 일수
5. is_completed: 출석체크 완료 여부
6. created_at: 생성 시간
7. updated_at: 수정 시간

함수:
- check_coupon_attendance(): 출석체크 가능 여부 및 현재 연속 일수 확인
- execute_coupon_attendance(): 출석체크 실행 및 연속 일수 업데이트
- get_coupon_attendance_history(): 사용자 출석체크 히스토리 조회

RLS 정책:
- 사용자는 자신의 출석체크 기록만 조회/생성/수정 가능
- 관리자는 모든 출석체크 기록 관리 가능

출석체크 규칙:
- 같은 사용자가 같은 날짜에 중복 출석체크 불가
- 연속 출석 일수는 자동으로 계산
- 3일 연속 완료 시 쿠폰 지급 (추후 구현)
*/

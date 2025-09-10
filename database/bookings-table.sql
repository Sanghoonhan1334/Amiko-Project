-- =====================================================
-- 예약 테이블 (Bookings Table)
-- Description: 상담 예약 정보를 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 예약 테이블 (Bookings Table)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL, -- 내부 주문 번호
    topic TEXT NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- 분 단위 (20분 = 1 AKO)
    price NUMERIC(10, 2) NOT NULL, -- AKO 단위
    currency TEXT DEFAULT 'AKO', -- AKO 통화 단위
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_id TEXT, -- PayPal 결제 ID
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_end_at ON public.bookings(end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 복합 인덱스 (자주 함께 조회되는 필드들)
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON public.bookings(start_at, end_at);

-- 3. RLS 활성화
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 예약만 볼 수 있음
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 예약을 생성할 수 있음
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 예약을 업데이트할 수 있음 (취소 등)
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- 상담사는 자신과 관련된 예약을 볼 수 있음
CREATE POLICY "Consultants can view own bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE public.consultants.id = public.bookings.consultant_id 
            AND public.consultants.user_id = auth.uid()
        )
    );

-- 상담사는 자신의 예약 상태를 업데이트할 수 있음 (확정, 완료 등)
CREATE POLICY "Consultants can update own bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE public.consultants.id = public.bookings.consultant_id 
            AND public.consultants.user_id = auth.uid()
        )
    );

-- 관리자는 모든 예약을 관리할 수 있음
CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 예약 상태 변경 시 알림을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 상태가 변경된 경우에만 알림 생성
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- 사용자에게 알림
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            content,
            ref_id
        ) VALUES (
            NEW.user_id,
            'booking_status',
            CASE NEW.status
                WHEN 'confirmed' THEN '예약이 확정되었습니다'
                WHEN 'cancelled' THEN '예약이 취소되었습니다'
                WHEN 'completed' THEN '상담이 완료되었습니다'
                WHEN 'no_show' THEN '상담이 진행되지 않았습니다'
                ELSE '예약 상태가 변경되었습니다'
            END,
            '예약 ID: ' || NEW.order_id || ' 상태: ' || NEW.status,
            NEW.id
        );
        
        -- 상담사에게도 알림 (상담사가 사용자와 다른 경우)
        IF EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE public.consultants.id = NEW.consultant_id 
            AND public.consultants.user_id != NEW.user_id
        ) THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                content,
                ref_id
            ) VALUES (
                (SELECT user_id FROM public.consultants WHERE id = NEW.consultant_id),
                'booking_status',
                CASE NEW.status
                    WHEN 'confirmed' THEN '새로운 예약이 확정되었습니다'
                    WHEN 'cancelled' THEN '예약이 취소되었습니다'
                    WHEN 'completed' THEN '상담이 완료되었습니다'
                    WHEN 'no_show' THEN '상담이 진행되지 않았습니다'
                    ELSE '예약 상태가 변경되었습니다'
                END,
                '예약 ID: ' || NEW.order_id || ' 상태: ' || NEW.status,
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 예약 상태 변경 트리거 적용
CREATE TRIGGER booking_status_change_trigger
    AFTER UPDATE ON public.bookings
    FOR EACH ROW 
    EXECUTE FUNCTION notify_booking_status_change();

-- 7. 예약 통계를 위한 함수 생성
CREATE OR REPLACE FUNCTION get_booking_stats(
    user_uuid UUID DEFAULT NULL,
    consultant_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_bookings BIGINT,
    completed_bookings BIGINT,
    cancelled_bookings BIGINT,
    total_revenue NUMERIC,
    avg_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(AVG(duration) FILTER (WHERE status = 'completed'), 0) as avg_duration
    FROM public.bookings
    WHERE (user_uuid IS NULL OR user_id = user_uuid)
        AND (consultant_uuid IS NULL OR consultant_id = consultant_uuid)
        AND (start_date IS NULL OR start_at >= start_date)
        AND (end_date IS NULL OR end_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 예약 가능 시간 확인 함수
CREATE OR REPLACE FUNCTION check_booking_availability(
    consultant_uuid UUID,
    booking_start TIMESTAMP WITH TIME ZONE,
    booking_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    consultant_available BOOLEAN := FALSE;
    conflicting_bookings INTEGER := 0;
BEGIN
    -- 상담사가 활성화되어 있는지 확인
    SELECT is_active INTO consultant_available
    FROM public.consultants
    WHERE id = consultant_uuid;
    
    IF NOT consultant_available THEN
        RETURN FALSE;
    END IF;
    
    -- 시간 충돌 확인
    SELECT COUNT(*) INTO conflicting_bookings
    FROM public.bookings
    WHERE consultant_id = consultant_uuid
        AND status IN ('pending', 'confirmed')
        AND (
            (start_at < booking_start + INTERVAL '1 minute' * booking_duration)
            AND (end_at > booking_start)
        );
    
    RETURN conflicting_bookings = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 샘플 데이터 (테스트용)
-- INSERT INTO public.bookings (
--     user_id,
--     consultant_id,
--     order_id,
--     topic,
--     start_at,
--     end_at,
--     duration,
--     price,
--     status
-- ) VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001',
--     (SELECT id FROM public.consultants LIMIT 1),
--     'ORDER-001',
--     '한국어 기초 문법',
--     NOW() + INTERVAL '1 day',
--     NOW() + INTERVAL '1 day' + INTERVAL '20 minutes',
--     20,
--     1.00,
--     'pending'
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
예약 테이블 필드 설명:

1. id: 예약 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. consultant_id: 상담사 테이블 참조 (CASCADE 삭제)
4. order_id: 내부 주문 번호 (고유값)
5. topic: 상담 주제
6. start_at: 상담 시작 시간
7. end_at: 상담 종료 시간
8. duration: 상담 시간 (분 단위, 20분 = 1 AKO)
9. price: 가격 (AKO 단위)
10. currency: 통화 단위 (기본값: 'AKO')
11. status: 예약 상태 (pending, confirmed, cancelled, completed, no_show)
12. payment_id: PayPal 결제 ID
13. notes: 추가 메모
14. created_at: 생성 시간
15. updated_at: 수정 시간

RLS 정책:
- 사용자는 자신의 예약만 조회/생성/수정 가능
- 상담사는 자신과 관련된 예약 조회/상태 수정 가능
- 관리자는 모든 예약 관리 가능

함수:
- notify_booking_status_change(): 예약 상태 변경 시 알림 생성
- get_booking_stats(): 예약 통계 조회
- check_booking_availability(): 예약 가능 시간 확인

트리거:
- 상태 변경 시 자동 알림 생성
- 사용자와 상담사 모두에게 알림 전송

AKO 시스템:
- duration: 20분 = 1 AKO
- price: AKO 단위로 설정
- currency: 'AKO'로 통일
*/

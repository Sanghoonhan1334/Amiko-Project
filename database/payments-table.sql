-- =====================================================
-- 결제 테이블 (Payments Table)
-- Description: PayPal 결제 정보를 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 결제 테이블 (Payments Table)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL, -- 내부 주문 번호
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL, -- AKO 단위
    currency TEXT NOT NULL DEFAULT 'AKO', -- AKO 통화 단위
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    paypal_data JSONB, -- PayPal 응답 데이터 저장
    refund_amount NUMERIC(10, 2) DEFAULT 0, -- 환불 금액
    refund_reason TEXT, -- 환불 사유
    refunded_at TIMESTAMP WITH TIME ZONE, -- 환불 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON public.payments(amount);

-- 복합 인덱스 (자주 함께 조회되는 필드들)
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);

-- JSONB 인덱스 (PayPal 데이터 검색용)
CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);

-- 3. RLS 활성화
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 결제만 볼 수 있음
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 결제를 생성할 수 있음
CREATE POLICY "Users can create own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 결제를 업데이트할 수 있음 (제한적)
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- 관리자는 모든 결제를 관리할 수 있음
CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 결제 상태 변경 시 알림을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 상태가 변경된 경우에만 알림 생성
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            content,
            ref_id
        ) VALUES (
            NEW.user_id,
            'payment_status',
            CASE NEW.status
                WHEN 'completed' THEN '결제가 완료되었습니다'
                WHEN 'failed' THEN '결제가 실패했습니다'
                WHEN 'refunded' THEN '환불이 처리되었습니다'
                WHEN 'cancelled' THEN '결제가 취소되었습니다'
                ELSE '결제 상태가 변경되었습니다'
            END,
            '주문 ID: ' || NEW.order_id || ' 상태: ' || NEW.status || ' 금액: ' || NEW.amount || ' ' || NEW.currency,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 결제 상태 변경 트리거 적용
CREATE TRIGGER payment_status_change_trigger
    AFTER UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION notify_payment_status_change();

-- 7. 환불 처리를 위한 함수
CREATE OR REPLACE FUNCTION process_refund(
    payment_uuid UUID,
    refund_amount NUMERIC,
    refund_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_payment RECORD;
BEGIN
    -- 결제 정보 조회
    SELECT * INTO current_payment
    FROM public.payments
    WHERE id = payment_uuid AND status = 'completed';
    
    -- 결제가 존재하고 완료된 상태인지 확인
    IF NOT FOUND THEN
        RAISE EXCEPTION '결제를 찾을 수 없거나 완료되지 않은 상태입니다.';
    END IF;
    
    -- 환불 금액이 결제 금액을 초과하는지 확인
    IF refund_amount > current_payment.amount THEN
        RAISE EXCEPTION '환불 금액이 결제 금액을 초과할 수 없습니다.';
    END IF;
    
    -- 환불 처리
    UPDATE public.payments
    SET 
        status = 'refunded',
        refund_amount = refund_amount,
        refund_reason = refund_reason,
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = payment_uuid;
    
    -- 예약 상태도 취소로 변경 (연결된 예약이 있는 경우)
    IF current_payment.booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE id = current_payment.booking_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 결제 통계를 위한 함수
CREATE OR REPLACE FUNCTION get_payment_stats(
    user_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_payments BIGINT,
    completed_payments BIGINT,
    failed_payments BIGINT,
    refunded_payments BIGINT,
    total_revenue NUMERIC,
    total_refunds NUMERIC,
    net_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(SUM(refund_amount) FILTER (WHERE status = 'refunded'), 0) as total_refunds,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) - 
        COALESCE(SUM(refund_amount) FILTER (WHERE status = 'refunded'), 0) as net_revenue
    FROM public.payments
    WHERE (user_uuid IS NULL OR user_id = user_uuid)
        AND (start_date IS NULL OR created_at >= start_date)
        AND (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. PayPal 웹훅 처리를 위한 함수
CREATE OR REPLACE FUNCTION handle_paypal_webhook(
    webhook_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    event_type TEXT;
    resource_data JSONB;
    payment_id TEXT;
    payment_status TEXT;
    amount_value NUMERIC;
BEGIN
    -- 웹훅 데이터에서 이벤트 타입 추출
    event_type := webhook_data->>'event_type';
    resource_data := webhook_data->'resource';
    
    -- 결제 관련 이벤트만 처리
    IF event_type IN ('PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.REFUNDED') THEN
        payment_id := resource_data->>'id';
        payment_status := CASE 
            WHEN event_type = 'PAYMENT.CAPTURE.COMPLETED' THEN 'completed'
            WHEN event_type = 'PAYMENT.CAPTURE.DENIED' THEN 'failed'
            WHEN event_type = 'PAYMENT.CAPTURE.REFUNDED' THEN 'refunded'
        END;
        
        -- 결제 상태 업데이트
        UPDATE public.payments
        SET 
            status = payment_status,
            paypal_data = webhook_data,
            updated_at = NOW()
        WHERE payment_id = payment_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 결제 검증을 위한 함수
CREATE OR REPLACE FUNCTION verify_payment(
    payment_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_record RECORD;
BEGIN
    -- 결제 정보 조회
    SELECT * INTO payment_record
    FROM public.payments
    WHERE id = payment_uuid;
    
    -- 결제가 존재하는지 확인
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- PayPal 데이터가 있는지 확인
    IF payment_record.paypal_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- PayPal에서 결제 상태 확인 (실제 구현에서는 PayPal API 호출)
    -- 여기서는 간단히 데이터 존재 여부만 확인
    RETURN payment_record.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 샘플 데이터 (테스트용)
-- INSERT INTO public.payments (
--     order_id,
--     payment_id,
--     user_id,
--     booking_id,
--     amount,
--     currency,
--     status,
--     paypal_data
-- ) VALUES 
-- (
--     'ORDER-001',
--     'PAYPAL-001',
--     '00000000-0000-0000-0000-000000000001',
--     (SELECT id FROM public.bookings LIMIT 1),
--     1.00,
--     'AKO',
--     'completed',
--     '{"id": "PAYPAL-001", "status": "COMPLETED"}'::jsonb
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
결제 테이블 필드 설명:

1. id: 결제 고유 ID (UUID)
2. order_id: 내부 주문 번호
3. payment_id: PayPal Order ID (고유값)
4. user_id: 사용자 테이블 참조 (CASCADE 삭제)
5. booking_id: 예약 테이블 참조 (SET NULL 삭제)
6. amount: 결제 금액 (AKO 단위)
7. currency: 통화 단위 (기본값: 'AKO')
8. status: 결제 상태 (pending, completed, failed, refunded, cancelled)
9. paypal_data: PayPal 응답 데이터 (JSONB)
10. refund_amount: 환불 금액 (기본값: 0)
11. refund_reason: 환불 사유
12. refunded_at: 환불 시간
13. created_at: 생성 시간
14. updated_at: 수정 시간

RLS 정책:
- 사용자는 자신의 결제만 조회/생성/수정 가능
- 관리자는 모든 결제 관리 가능

함수:
- notify_payment_status_change(): 결제 상태 변경 시 알림 생성
- process_refund(): 환불 처리 함수
- get_payment_stats(): 결제 통계 조회
- handle_paypal_webhook(): PayPal 웹훅 처리
- verify_payment(): 결제 검증

트리거:
- 상태 변경 시 자동 알림 생성

PayPal 연동:
- 웹훅을 통한 실시간 상태 업데이트
- JSONB로 PayPal 응답 데이터 저장
- 환불 처리 자동화

AKO 시스템:
- amount: AKO 단위로 설정
- currency: 'AKO'로 통일
- 예약과 연동하여 AKO 결제 처리
*/

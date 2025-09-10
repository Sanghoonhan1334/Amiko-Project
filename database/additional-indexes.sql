-- =====================================================
-- 추가 인덱스 생성 (Additional Indexes)
-- Description: 성능 최적화를 위한 추가 인덱스들
-- Date: 2024-12-19
-- =====================================================

-- 제공된 인덱스들을 확인하고 누락된 것들만 추가
-- (대부분의 인덱스는 이미 각 테이블 파일에 포함되어 있음)

-- 1. 예약 테이블 인덱스 확인 및 추가
-- 이미 bookings-table.sql에 포함되어 있지만 확인용으로 추가
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 2. 결제 테이블 인덱스 확인 및 추가
-- 이미 payments-table.sql에 포함되어 있지만 확인용으로 추가
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);

-- 3. 알림 테이블 인덱스 확인 및 추가
-- 이미 notifications-table.sql에 포함되어 있지만 확인용으로 추가
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 4. 후기 테이블 인덱스 확인 및 추가
-- 이미 reviews-table.sql에 포함되어 있지만 확인용으로 추가
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_id ON public.reviews(consultant_id);

-- 5. 추가 성능 최적화 인덱스들

-- 사용자 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);

-- 상담사 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);
CREATE INDEX IF NOT EXISTS idx_consultants_hourly_rate ON public.consultants(hourly_rate);

-- 예약 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_end_at ON public.bookings(end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);

-- 결제 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON public.payments(amount);

-- 알림 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 후기 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON public.reviews(is_public);

-- 쿠폰 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at);

-- 알림설정 테이블 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- 6. 복합 인덱스 (자주 함께 조회되는 필드들)

-- 예약 관련 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON public.bookings(start_at, end_at);

-- 결제 관련 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);

-- 알림 관련 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority ON public.notifications(user_id, priority);

-- 후기 관련 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_public ON public.reviews(consultant_id, is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_rating ON public.reviews(consultant_id, rating);

-- 쿠폰 관련 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_user_active ON public.coupons(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_user_type ON public.coupons(user_id, type);

-- 7. JSONB 인덱스 (JSON 데이터 검색용)

-- 상담사 테이블 JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_consultants_languages ON public.consultants USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_consultants_availability ON public.consultants USING GIN(availability);

-- 결제 테이블 JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);

-- 알림 테이블 JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_data ON public.notifications USING GIN(data);

-- 8. 부분 인덱스 (특정 조건의 데이터만 인덱싱)

-- 활성화된 상담사만 인덱싱
CREATE INDEX IF NOT EXISTS idx_consultants_active_only ON public.consultants(id) 
WHERE is_active = true;

-- 공개된 후기만 인덱싱
CREATE INDEX IF NOT EXISTS idx_reviews_public_only ON public.reviews(id) 
WHERE is_public = true;

-- 활성화된 쿠폰만 인덱싱
CREATE INDEX IF NOT EXISTS idx_coupons_active_only ON public.coupons(id) 
WHERE is_active = true;

-- 읽지 않은 알림만 인덱싱
CREATE INDEX IF NOT EXISTS idx_notifications_unread_only ON public.notifications(id) 
WHERE is_read = false;

-- 9. 인덱스 사용 통계 조회 함수
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        indexname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 인덱스 최적화 권장사항 함수
CREATE OR REPLACE FUNCTION get_index_recommendations()
RETURNS TABLE (
    table_name TEXT,
    recommendation TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'public.bookings'::TEXT as table_name,
        'user_id, status 복합 인덱스 권장'::TEXT as recommendation,
        'high'::TEXT as priority
    UNION ALL
    SELECT 
        'public.payments'::TEXT as table_name,
        'user_id, status 복합 인덱스 권장'::TEXT as recommendation,
        'high'::TEXT as priority
    UNION ALL
    SELECT 
        'public.notifications'::TEXT as table_name,
        'user_id, is_read 복합 인덱스 권장'::TEXT as recommendation,
        'medium'::TEXT as priority
    UNION ALL
    SELECT 
        'public.reviews'::TEXT as table_name,
        'consultant_id, is_public 복합 인덱스 권장'::TEXT as recommendation,
        'medium'::TEXT as priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
인덱스 최적화 전략:

1. 단일 컬럼 인덱스:
   - 자주 조회되는 컬럼에 대한 기본 인덱스
   - 외래키, 상태값, 날짜 등

2. 복합 인덱스:
   - 자주 함께 조회되는 컬럼들의 조합
   - WHERE 절에서 AND 조건으로 사용되는 컬럼들

3. JSONB 인덱스:
   - JSON 데이터 내부 검색을 위한 GIN 인덱스
   - 배열과 JSON 객체 검색 최적화

4. 부분 인덱스:
   - 특정 조건을 만족하는 행만 인덱싱
   - 활성화된 레코드, 공개된 레코드 등

5. 성능 모니터링:
   - 인덱스 사용 통계 조회
   - 최적화 권장사항 제공

인덱스 사용 가이드:
- 자주 조회되는 컬럼에 인덱스 생성
- 복합 인덱스는 자주 함께 사용되는 컬럼 조합
- JSONB 데이터는 GIN 인덱스 사용
- 부분 인덱스는 특정 조건의 데이터만 인덱싱
- 정기적으로 인덱스 사용 통계 확인
*/

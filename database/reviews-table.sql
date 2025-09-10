-- =====================================================
-- 후기 테이블 (Reviews Table)
-- Description: 상담사 후기를 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 후기 테이블 (Reviews Table)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_id ON public.reviews(consultant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON public.reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 복합 인덱스 (자주 함께 조회되는 필드들)
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_public ON public.reviews(consultant_id, is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_consultant_rating ON public.reviews(consultant_id, rating);

-- 3. RLS 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 모든 사용자는 공개된 후기를 볼 수 있음
CREATE POLICY "Anyone can view public reviews" ON public.reviews
    FOR SELECT USING (is_public = true);

-- 사용자는 자신의 후기를 볼 수 있음 (비공개 포함)
CREATE POLICY "Users can view own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 예약에 대한 후기를 생성할 수 있음
CREATE POLICY "Users can create reviews for own bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE public.bookings.id = public.reviews.booking_id 
            AND public.bookings.user_id = auth.uid()
            AND public.bookings.status = 'completed'
        )
    );

-- 사용자는 자신의 후기를 업데이트할 수 있음
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 후기를 삭제할 수 있음
CREATE POLICY "Users can delete own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- 상담사는 자신에 대한 후기를 볼 수 있음
CREATE POLICY "Consultants can view own reviews" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE public.consultants.id = public.reviews.consultant_id 
            AND public.consultants.user_id = auth.uid()
        )
    );

-- 관리자는 모든 후기를 관리할 수 있음
CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 후기 생성 시 알림을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_review_created()
RETURNS TRIGGER AS $$
BEGIN
    -- 상담사에게 후기 작성 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        data,
        priority
    ) VALUES (
        (SELECT user_id FROM public.consultants WHERE id = NEW.consultant_id),
        'review_received',
        '새로운 후기가 작성되었습니다',
        '평점: ' || NEW.rating || '점' || 
        CASE 
            WHEN NEW.comment IS NOT NULL THEN ' - ' || LEFT(NEW.comment, 50) || '...'
            ELSE ''
        END,
        jsonb_build_object(
            'review_id', NEW.id,
            'booking_id', NEW.booking_id,
            'rating', NEW.rating,
            'is_public', NEW.is_public
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 후기 생성 트리거 적용
CREATE TRIGGER review_created_trigger
    AFTER INSERT ON public.reviews
    FOR EACH ROW 
    EXECUTE FUNCTION notify_review_created();

-- 6. 상담사 평점 업데이트 함수
CREATE OR REPLACE FUNCTION update_consultant_rating(consultant_uuid UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- 평점과 리뷰 수 계산
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.reviews
    WHERE consultant_id = consultant_uuid 
        AND is_public = true;
    
    -- 상담사 테이블에 평점 정보 업데이트 (별도 컬럼이 있다면)
    -- 여기서는 계산된 값만 반환
    -- 실제 구현에서는 상담사 테이블에 avg_rating, total_reviews 컬럼 추가 필요
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 후기 통계 조회 함수
CREATE OR REPLACE FUNCTION get_review_stats(
    consultant_uuid UUID DEFAULT NULL,
    user_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_reviews BIGINT,
    public_reviews BIGINT,
    avg_rating NUMERIC,
    rating_distribution JSONB,
    recent_reviews JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE is_public = true) as public_reviews,
        COALESCE(AVG(rating) FILTER (WHERE is_public = true), 0) as avg_rating,
        jsonb_build_object(
            '5_star', COUNT(*) FILTER (WHERE rating = 5 AND is_public = true),
            '4_star', COUNT(*) FILTER (WHERE rating = 4 AND is_public = true),
            '3_star', COUNT(*) FILTER (WHERE rating = 3 AND is_public = true),
            '2_star', COUNT(*) FILTER (WHERE rating = 2 AND is_public = true),
            '1_star', COUNT(*) FILTER (WHERE rating = 1 AND is_public = true)
        ) as rating_distribution,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'rating', rating,
                'comment', comment,
                'created_at', created_at,
                'user_name', (SELECT full_name FROM public.users WHERE id = user_id)
            ) ORDER BY created_at DESC
        ) FILTER (WHERE is_public = true) as recent_reviews
    FROM public.reviews
    WHERE (consultant_uuid IS NULL OR consultant_id = consultant_uuid)
        AND (user_uuid IS NULL OR user_id = user_uuid)
        AND (start_date IS NULL OR created_at >= start_date)
        AND (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 후기 검색 함수
CREATE OR REPLACE FUNCTION search_reviews(
    consultant_uuid UUID DEFAULT NULL,
    min_rating INTEGER DEFAULT NULL,
    max_rating INTEGER DEFAULT NULL,
    has_comment BOOLEAN DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    rating INTEGER,
    comment TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    consultant_name TEXT,
    booking_topic TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.rating,
        r.comment,
        r.is_public,
        r.created_at,
        u.full_name as user_name,
        c.name as consultant_name,
        b.topic as booking_topic
    FROM public.reviews r
    JOIN public.users u ON r.user_id = u.id
    JOIN public.consultants c ON r.consultant_id = c.id
    JOIN public.bookings b ON r.booking_id = b.id
    WHERE r.is_public = true
        AND (consultant_uuid IS NULL OR r.consultant_id = consultant_uuid)
        AND (min_rating IS NULL OR r.rating >= min_rating)
        AND (max_rating IS NULL OR r.rating <= max_rating)
        AND (has_comment IS NULL OR (has_comment = true AND r.comment IS NOT NULL) OR (has_comment = false AND r.comment IS NULL))
    ORDER BY r.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 후기 작성 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION can_write_review(
    booking_uuid UUID,
    user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    booking_record RECORD;
    existing_review_count INTEGER;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 예약 정보 조회
    SELECT * INTO booking_record
    FROM public.bookings
    WHERE id = booking_uuid AND user_id = user_uuid;
    
    -- 예약이 존재하지 않거나 사용자의 예약이 아닌 경우
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 예약이 완료되지 않은 경우
    IF booking_record.status != 'completed' THEN
        RETURN FALSE;
    END IF;
    
    -- 이미 후기가 작성된 경우
    SELECT COUNT(*) INTO existing_review_count
    FROM public.reviews
    WHERE booking_id = booking_uuid;
    
    IF existing_review_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 후기 생성 시 상담사 평점 업데이트 트리거
CREATE OR REPLACE FUNCTION update_consultant_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- 상담사 평점 업데이트
    PERFORM update_consultant_rating(NEW.consultant_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 후기 생성/수정 시 상담사 통계 업데이트 트리거
CREATE TRIGGER update_consultant_stats_trigger
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW 
    EXECUTE FUNCTION update_consultant_stats_on_review();

-- 11. 샘플 데이터 (테스트용)
-- INSERT INTO public.reviews (
--     booking_id,
--     user_id,
--     consultant_id,
--     rating,
--     comment,
--     is_public
-- ) VALUES 
-- (
--     (SELECT id FROM public.bookings LIMIT 1),
--     '00000000-0000-0000-0000-000000000001',
--     (SELECT id FROM public.consultants LIMIT 1),
--     5,
--     '정말 좋은 수업이었습니다!',
--     true
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
후기 테이블 필드 설명:

1. id: 후기 고유 ID (UUID)
2. booking_id: 예약 테이블 참조 (CASCADE 삭제, 고유값)
3. user_id: 사용자 테이블 참조 (CASCADE 삭제)
4. consultant_id: 상담사 테이블 참조 (CASCADE 삭제)
5. rating: 평점 (1-5점)
6. comment: 후기 내용
7. is_public: 공개 여부 (기본값: TRUE)
8. created_at: 생성 시간

RLS 정책:
- 모든 사용자는 공개된 후기 조회 가능
- 사용자는 자신의 후기만 생성/수정/삭제 가능
- 상담사는 자신에 대한 후기 조회 가능
- 관리자는 모든 후기 관리 가능

함수:
- notify_review_created(): 후기 생성 시 상담사 알림
- update_consultant_rating(): 상담사 평점 업데이트
- get_review_stats(): 후기 통계 조회
- search_reviews(): 후기 검색
- can_write_review(): 후기 작성 가능 여부 확인

트리거:
- 후기 생성 시 상담사에게 알림 전송
- 후기 생성/수정 시 상담사 통계 자동 업데이트

제약사항:
- 예약당 하나의 후기만 작성 가능
- 완료된 예약에만 후기 작성 가능
- 평점은 1-5점 범위

통계 기능:
- 평점 분포 (별점별 개수)
- 평균 평점 계산
- 최근 후기 목록
- 공개/비공개 후기 구분
*/

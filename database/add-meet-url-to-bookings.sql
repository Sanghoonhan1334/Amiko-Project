-- =====================================================
-- Google Meet URL 필드 추가 (Bookings Table)
-- Description: 예약 테이블에 Google Meet 링크 필드 추가
-- Date: 2025-01-XX
-- =====================================================

-- 1. bookings 테이블에 meet_url 필드 추가
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS meet_url TEXT;

-- 2. 설명 추가
COMMENT ON COLUMN public.bookings.meet_url IS 'Google Meet 링크 (MVP 테스트용)';

-- 3. 인덱스 추가 (선택사항, 필요시만)
-- CREATE INDEX IF NOT EXISTS idx_bookings_meet_url ON public.bookings(meet_url) WHERE meet_url IS NOT NULL;

-- =====================================================
-- 사용 예시
-- =====================================================

-- 예약 생성 시 Google Meet 링크 함께 저장
-- INSERT INTO public.bookings (
--     user_id,
--     consultant_id,
--     order_id,
--     topic,
--     start_at,
--     end_at,
--     duration,
--     price,
--     meet_url,
--     status
-- ) VALUES (
--     'user-id-here',
--     'consultant-id-here',
--     'ORDER-001',
--     '한국어 기초 문법',
--     NOW() + INTERVAL '1 day',
--     NOW() + INTERVAL '1 day' + INTERVAL '20 minutes',
--     20,
--     1.00,
--     'https://meet.google.com/xxx-xxxx-xxx',
--     'confirmed'
-- );

-- Google Meet 링크 업데이트
-- UPDATE public.bookings
-- SET meet_url = 'https://meet.google.com/xxx-xxxx-xxx'
-- WHERE id = 'booking-id-here';


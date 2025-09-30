-- 안전한 사용자 데이터 삭제 스크립트 (순서대로)

-- 1. 관련 테이블 먼저 삭제 (존재하는 테이블만)
-- 기본 테이블들
DELETE FROM user_preferences;
DELETE FROM verification_codes;

-- 존재할 수 있는 테이블들 (오류 무시)
DO $$
BEGIN
    -- 세션 관련
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DELETE FROM user_sessions;
    END IF;
    
    -- 활동 로그
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
        DELETE FROM user_activity_logs;
    END IF;
    
    -- 커뮤니티 관련
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts') THEN
        DELETE FROM community_posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_comments') THEN
        DELETE FROM community_comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_reactions') THEN
        DELETE FROM community_reactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_points') THEN
        DELETE FROM community_points;
    END IF;
    
    -- 기타 테이블들
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
        DELETE FROM stories;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DELETE FROM notifications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions') THEN
        DELETE FROM points_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        DELETE FROM bookings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        DELETE FROM reviews;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
        DELETE FROM purchases;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') THEN
        DELETE FROM coupons;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        DELETE FROM payments;
    END IF;
END $$;

-- 2. public.users 테이블 삭제
DELETE FROM users;

-- 3. auth.users 테이블 삭제 (Supabase Auth)
DELETE FROM auth.users;

-- 확인용 쿼리
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'verification_codes', COUNT(*) FROM verification_codes;

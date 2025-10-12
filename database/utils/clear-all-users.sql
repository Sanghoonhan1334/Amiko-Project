-- 모든 사용자 데이터 삭제 스크립트

-- 외래키 제약 조건 임시 비활성화
SET session_replication_role = replica;

-- 1. auth.users 테이블의 모든 사용자 삭제 (Supabase Auth)
DELETE FROM auth.users;

-- 2. public.users 테이블의 모든 사용자 삭제
DELETE FROM users;

-- 외래키 제약 조건 다시 활성화
SET session_replication_role = DEFAULT;

-- 3. user_preferences 테이블의 모든 데이터 삭제
DELETE FROM user_preferences;

-- 4. verification_codes 테이블의 모든 인증코드 삭제
DELETE FROM verification_codes;

-- 5. user_sessions 테이블의 모든 세션 삭제
DELETE FROM user_sessions;

-- 6. user_activity_logs 테이블의 모든 로그 삭제
DELETE FROM user_activity_logs;

-- 7. 커뮤니티 관련 데이터 삭제
DELETE FROM community_posts;
DELETE FROM community_comments;
DELETE FROM community_reactions;
DELETE FROM community_points;

-- 8. 스토리 데이터 삭제
DELETE FROM stories;

-- 9. 기타 관련 데이터 삭제
DELETE FROM notifications;
DELETE FROM points_transactions;
DELETE FROM bookings;
DELETE FROM reviews;
DELETE FROM purchases;
DELETE FROM coupons;
DELETE FROM payments;

-- 확인용 쿼리 (실행 후 확인)
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'verification_codes', COUNT(*) FROM verification_codes;

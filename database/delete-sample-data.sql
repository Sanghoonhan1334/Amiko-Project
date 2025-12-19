-- ============================================
-- AMIKO 샘플 데이터 삭제 스크립트
-- Sample Data Deletion Script
-- ============================================
-- 이 스크립트는 insert-sample-data.sql로 삽입된 모든 샘플 데이터를 삭제합니다
-- This script deletes all sample data inserted by insert-sample-data.sql
-- ============================================

-- 샘플 데이터 삭제 시작
-- SAMPLE_DATA_DELETION_START

-- 1. 샘플 뉴스 삭제
DELETE FROM public.news WHERE id LIKE 'SAMPLE-NEWS-%';

-- 2. 샘플 투표 삭제
DELETE FROM public.polls WHERE id LIKE 'SAMPLE-POLL-%';

-- 3. 샘플 채팅방 삭제
DELETE FROM public.chat_rooms WHERE id LIKE 'SAMPLE-CHAT-%';

-- 4. 샘플 아이돌 사진 삭제
DELETE FROM public.idol_memes WHERE id LIKE 'SAMPLE-IDOL-%';

-- 5. 샘플 팬아트 삭제
DELETE FROM public.fan_art WHERE id LIKE 'SAMPLE-FANART-%';

-- 6. 샘플 게시물 삭제 (댓글, 반응도 함께 삭제됨 - CASCADE)
DELETE FROM public.posts WHERE id LIKE 'SAMPLE-POST-%';

-- 7. 샘플 이벤트 삭제
DELETE FROM public.events WHERE id LIKE 'SAMPLE-EVENT-%';

-- 8. 샘플 사용자 프로필 삭제 (관련 포인트, 반응 등도 함께 삭제됨 - CASCADE)
DELETE FROM public.user_profiles WHERE user_id LIKE 'SAMPLE-USER-%';

-- 샘플 데이터 삭제 완료
-- SAMPLE_DATA_DELETION_END

-- ============================================
-- 삭제 완료 확인
-- Verify Deletion
-- ============================================

-- 남아있는 샘플 데이터 확인 (모두 0이어야 함)
SELECT 'user_profiles' as table_name, COUNT(*) as remaining_count FROM public.user_profiles WHERE user_id LIKE 'SAMPLE-USER-%'
UNION ALL
SELECT 'events', COUNT(*) FROM public.events WHERE id LIKE 'SAMPLE-EVENT-%'
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts WHERE id LIKE 'SAMPLE-POST-%'
UNION ALL
SELECT 'fan_art', COUNT(*) FROM public.fan_art WHERE id LIKE 'SAMPLE-FANART-%'
UNION ALL
SELECT 'idol_memes', COUNT(*) FROM public.idol_memes WHERE id LIKE 'SAMPLE-IDOL-%'
UNION ALL
SELECT 'chat_rooms', COUNT(*) FROM public.chat_rooms WHERE id LIKE 'SAMPLE-CHAT-%'
UNION ALL
SELECT 'polls', COUNT(*) FROM public.polls WHERE id LIKE 'SAMPLE-POLL-%'
UNION ALL
SELECT 'news', COUNT(*) FROM public.news WHERE id LIKE 'SAMPLE-NEWS-%';

-- ============================================
-- 샘플 데이터 삭제 완료
-- Sample Data Deletion Complete
-- ============================================

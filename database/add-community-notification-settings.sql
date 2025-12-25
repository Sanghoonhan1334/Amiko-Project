-- 커뮤니티 알림 설정 필드 추가
-- 좋아요 알림, 게시물 알림, 하루 요약 알림 설정

-- notification_settings 테이블에 필드 추가
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS like_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS post_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS daily_digest_time TIME DEFAULT '08:30:00';

-- 기존 사용자들에게 기본값 설정
UPDATE notification_settings 
SET 
  like_notifications_enabled = COALESCE(like_notifications_enabled, TRUE),
  post_notifications_enabled = COALESCE(post_notifications_enabled, TRUE),
  daily_digest_enabled = COALESCE(daily_digest_enabled, TRUE),
  daily_digest_time = COALESCE(daily_digest_time, '08:30:00'::TIME)
WHERE like_notifications_enabled IS NULL 
   OR post_notifications_enabled IS NULL 
   OR daily_digest_enabled IS NULL 
   OR daily_digest_time IS NULL;

-- 인덱스 추가 (선택적, 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notification_settings_daily_digest 
ON notification_settings(daily_digest_enabled, daily_digest_time) 
WHERE daily_digest_enabled = TRUE;

-- 완료 메시지
SELECT '커뮤니티 알림 설정 필드가 성공적으로 추가되었습니다! 🎉' as message;


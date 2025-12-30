-- 알림 설정 간소화 마이그레이션
-- Simplify Notification Settings Migration

-- 1. 새로운 필드 추가
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS event_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS interaction_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS new_post_notifications_enabled BOOLEAN DEFAULT TRUE;

-- 2. 기존 데이터 마이그레이션
-- 이벤트 알림 = 마케팅 알림
UPDATE notification_settings 
SET event_notifications_enabled = COALESCE(marketing_emails, TRUE)
WHERE event_notifications_enabled IS NULL;

-- 좋아요·댓글 알림 = 좋아요 알림 AND 댓글 알림
UPDATE notification_settings 
SET interaction_notifications_enabled = COALESCE(
  (like_notifications_enabled AND comment_notifications_enabled), 
  TRUE
)
WHERE interaction_notifications_enabled IS NULL;

-- 새게시물 알림 = 게시물 알림 AND 하루 요약 알림
UPDATE notification_settings 
SET new_post_notifications_enabled = COALESCE(
  (post_notifications_enabled AND daily_digest_enabled), 
  TRUE
)
WHERE new_post_notifications_enabled IS NULL;

-- 3. 기본값 설정
UPDATE notification_settings 
SET 
  event_notifications_enabled = COALESCE(event_notifications_enabled, TRUE),
  interaction_notifications_enabled = COALESCE(interaction_notifications_enabled, TRUE),
  new_post_notifications_enabled = COALESCE(new_post_notifications_enabled, TRUE)
WHERE event_notifications_enabled IS NULL 
   OR interaction_notifications_enabled IS NULL 
   OR new_post_notifications_enabled IS NULL;

-- 완료 메시지
SELECT '알림 설정이 성공적으로 간소화되었습니다! 🎉' as message;


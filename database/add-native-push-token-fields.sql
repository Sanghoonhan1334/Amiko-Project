-- 네이티브 앱 푸시 토큰 필드 추가
-- Add Native App Push Token Fields

-- push_subscriptions 테이블에 네이티브 토큰 필드 추가
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS native_token TEXT,
ADD COLUMN IF NOT EXISTS platform VARCHAR(20),
ADD COLUMN IF NOT EXISTS token_type VARCHAR(10) DEFAULT 'fcm';

-- 웹 푸시 키 필드를 NULL 허용으로 변경 (네이티브 토큰은 키가 없음)
ALTER TABLE push_subscriptions 
ALTER COLUMN p256dh_key DROP NOT NULL,
ALTER COLUMN auth_key DROP NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_native_token ON push_subscriptions(native_token) WHERE native_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform ON push_subscriptions(platform) WHERE platform IS NOT NULL;

-- 완료 메시지
SELECT '네이티브 앱 푸시 토큰 필드가 성공적으로 추가되었습니다! 🎉' as message;


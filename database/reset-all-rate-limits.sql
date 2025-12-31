-- =====================================================
-- 모든 Rate Limit 제한 해제 (테스트/긴급 상황용)
-- Date: 2025-01-31
-- =====================================================

-- 모든 rate limit 레코드 삭제 (완전 초기화)
DELETE FROM public.auth_rate_limits;

-- 또는 특정 전화번호/이메일의 제한만 해제하려면:
-- DELETE FROM public.auth_rate_limits WHERE identifier = '+51908632674' AND auth_type = 'sms';
-- DELETE FROM public.auth_rate_limits WHERE identifier = 'user@example.com' AND auth_type = 'email';

-- 또는 blocked_until 시간만 초기화하려면:
-- UPDATE public.auth_rate_limits 
-- SET blocked_until = NULL, attempt_count = 0 
-- WHERE blocked_until IS NOT NULL AND blocked_until > NOW();


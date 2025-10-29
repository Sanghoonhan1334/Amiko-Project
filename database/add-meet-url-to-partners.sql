-- conversation_partners 테이블에 meet_url 필드 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE public.conversation_partners 
ADD COLUMN IF NOT EXISTS meet_url TEXT;

COMMENT ON COLUMN public.conversation_partners.meet_url IS 'Google Meet 링크 (MVP 테스트용)';

-- 완료 메시지
SELECT 'meet_url column added to conversation_partners table!' as message;


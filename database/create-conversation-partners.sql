-- 화상 채팅 파트너 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.conversation_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    language_level VARCHAR(50) NOT NULL, -- '초급', '중급', '고급'
    country VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy')),
    interests TEXT[], -- 관심사 배열
    bio TEXT, -- 자기소개
    avatar_url TEXT, -- 프로필 이미지 URL
    meet_url TEXT, -- Google Meet 링크 (MVP 테스트용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_conversation_partners_user_id ON public.conversation_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_partners_status ON public.conversation_partners(status);
CREATE INDEX IF NOT EXISTS idx_conversation_partners_country ON public.conversation_partners(country);

-- RLS 활성화
ALTER TABLE public.conversation_partners ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view conversation partners" ON public.conversation_partners
    FOR SELECT USING (true);

-- 시스템만 모든 작업 가능
CREATE POLICY "System can manage all conversation partners" ON public.conversation_partners
    FOR ALL USING (true);

-- 완료 메시지
SELECT 'Conversation partners table created successfully!' as message;


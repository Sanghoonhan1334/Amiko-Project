-- =====================================================
-- Events 테이블 생성
-- Description: ZEP 이벤트 등 관리
-- Date: 2026-01-XX
-- =====================================================

-- Events 테이블 생성
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'zep', 'general', etc.
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    zep_link TEXT, -- ZEP 링크
    banner_image TEXT, -- 배너 이미지 URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- RLS 활성화
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- RLS 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view events" ON public.events
    FOR SELECT USING (true);

-- 관리자만 생성/수정/삭제 가능
-- (서버에서 is_admin 체크하므로 RLS에서는 모든 사용자 허용)


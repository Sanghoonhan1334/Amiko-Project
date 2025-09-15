-- =====================================================
-- 포인트 시스템 스키마 (Points System Schema)
-- Description: 사용자 포인트 및 랭킹 시스템
-- Date: 2024-12-19
-- =====================================================

-- 1. 사용자 포인트 테이블 (User Points Table)
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    available_points INTEGER DEFAULT 0, -- 사용 가능한 포인트 (상점에서 사용)
    total_points INTEGER DEFAULT 0, -- 총 누적 포인트 (랭킹용, 차감되지 않음)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 포인트 히스토리 테이블 (Points History Table)
CREATE TABLE IF NOT EXISTS public.points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL, -- 획득/사용 포인트 (양수: 획득, 음수: 사용)
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'question_post',      -- 질문 작성 (+5)
        'question_answer',    -- 답변 작성 (+10)
        'story_post',         -- 스토리 작성 (+3)
        'freeboard_post',     -- 자유게시판 작성 (+2)
        'video_call',         -- 영상통화 완료 (+40)
        'chat_extension',     -- 채팅 연장 사용 (-100)
        'daily_limit'         -- 일일 한도 도달
    )),
    description TEXT, -- 포인트 획득/사용 설명
    related_id UUID, -- 관련 게시물/활동 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 일일 포인트 한도 테이블 (Daily Points Limit Table)
CREATE TABLE IF NOT EXISTS public.daily_points_limit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    community_points INTEGER DEFAULT 0, -- 커뮤니티 활동으로 획득한 포인트 (일일 최대 20)
    video_call_points INTEGER DEFAULT 0, -- 영상통화로 획득한 포인트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON public.user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_available_points ON public.user_points(available_points);

CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_type ON public.points_history(type);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON public.points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_points ON public.points_history(points);

CREATE INDEX IF NOT EXISTS idx_daily_points_limit_user_id ON public.daily_points_limit(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_points_limit_date ON public.daily_points_limit(date);
CREATE INDEX IF NOT EXISTS idx_daily_points_limit_user_date ON public.daily_points_limit(user_id, date);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_points_limit ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책
-- 사용자는 자신의 포인트 정보만 조회 가능
CREATE POLICY "Users can view own points" ON public.user_points
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 포인트 히스토리만 조회 가능
CREATE POLICY "Users can view own points history" ON public.points_history
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 일일 한도 정보만 조회 가능
CREATE POLICY "Users can view own daily limit" ON public.daily_points_limit
    FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 모든 포인트 관련 작업 가능
CREATE POLICY "System can manage all points" ON public.user_points
    FOR ALL USING (true);

CREATE POLICY "System can manage all points history" ON public.points_history
    FOR ALL USING (true);

CREATE POLICY "System can manage all daily limits" ON public.daily_points_limit
    FOR ALL USING (true);

-- 7. 포인트 업데이트 함수 (Trigger용)
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자 포인트 테이블 업데이트
    INSERT INTO public.user_points (user_id, available_points, total_points)
    VALUES (NEW.user_id, NEW.points, NEW.points)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        available_points = user_points.available_points + NEW.points,
        total_points = user_points.total_points + NEW.points,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 포인트 히스토리 삽입 시 자동으로 사용자 포인트 업데이트
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT ON public.points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points();

-- 9. 초기 데이터 삽입 (기존 사용자들을 위한 기본 포인트 설정)
INSERT INTO public.user_points (user_id, available_points, total_points)
SELECT id, 0, 0
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_points)
ON CONFLICT (user_id) DO NOTHING;

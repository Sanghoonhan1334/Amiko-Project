-- =====================================================
-- 통합 포인트 시스템 스키마 (Unified Points System Schema)
-- Description: 모든 포인트 관련 기능을 통합한 완전한 시스템
-- Date: 2024-12-19
-- =====================================================

-- 기존 테이블 정리 (충돌 방지)
DROP TABLE IF EXISTS public.points CASCADE;
DROP TABLE IF EXISTS public.point_history CASCADE;

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
        'comment_post',       -- 댓글 작성 (+1)
        'reaction_received',  -- 좋아요 받음 (+2)
        'video_call',         -- 영상통화 완료 (+40)
        'chat_extension',     -- 채팅 연장 사용 (-100)
        'coupon_purchase',    -- 쿠폰 구매 (-포인트)
        'admin_grant',        -- 관리자 지급
        'admin_deduct',       -- 관리자 차감
        'daily_limit',        -- 일일 한도 도달
        'welcome_bonus'       -- 가입 보너스
    )),
    description TEXT, -- 포인트 획득/사용 설명
    related_id UUID, -- 관련 게시물/활동 ID
    related_type VARCHAR(20) CHECK (related_type IN ('post', 'comment', 'booking', 'attendance', 'coupon')),
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

-- 7. 통합 포인트 관리 함수들

-- 포인트 업데이트 함수 (Trigger용)
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

-- 포인트 적립 함수 (한도 체크 포함)
CREATE OR REPLACE FUNCTION add_points_with_limit(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_amount INTEGER,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    daily_limit INTEGER := 20;
    today_points INTEGER;
    is_community_activity BOOLEAN := FALSE;
BEGIN
    -- 커뮤니티 활동인지 확인
    is_community_activity := p_type IN ('question_post', 'question_answer', 'story_post', 'freeboard_post', 'comment_post', 'reaction_received');
    
    -- 포인트가 양수이고 커뮤니티 활동인 경우 일일 한도 확인
    IF p_amount > 0 AND is_community_activity THEN
        -- 오늘 커뮤니티 활동으로 획득한 포인트 계산
        SELECT COALESCE(SUM(ph.points), 0) INTO today_points
        FROM public.points_history ph
        WHERE ph.user_id = p_user_id 
        AND ph.points > 0 
        AND ph.type IN ('question_post', 'question_answer', 'story_post', 'freeboard_post', 'comment_post', 'reaction_received')
        AND ph.created_at >= CURRENT_DATE;
        
        -- 일일 한도 초과 확인
        IF today_points + p_amount > daily_limit THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- 포인트 히스토리 추가
    INSERT INTO public.points_history (
        user_id, 
        points, 
        type, 
        description, 
        related_id, 
        related_type
    ) VALUES (
        p_user_id, 
        p_amount, 
        p_type, 
        p_description, 
        p_related_id, 
        p_related_type
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 포인트 사용 함수 (available_points 차감)
CREATE OR REPLACE FUNCTION use_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_available_points INTEGER;
BEGIN
    -- 현재 사용 가능한 포인트 확인
    SELECT available_points INTO current_available_points
    FROM public.user_points
    WHERE user_id = p_user_id;
    
    -- 포인트 부족 확인
    IF current_available_points < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- 포인트 히스토리 추가 (음수로 기록)
    INSERT INTO public.points_history (
        user_id, 
        points, 
        type, 
        description, 
        related_id, 
        related_type
    ) VALUES (
        p_user_id, 
        -p_amount, 
        'coupon_purchase', 
        p_description, 
        p_related_id, 
        p_related_type
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. 포인트 히스토리 삽입 시 자동으로 사용자 포인트 업데이트
DROP TRIGGER IF EXISTS trigger_update_user_points ON public.points_history;
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

-- 10. 포인트 시스템 상태 확인 함수
CREATE OR REPLACE FUNCTION get_user_points_summary(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    available_points INTEGER,
    total_points INTEGER,
    today_community_points INTEGER,
    today_video_points INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.available_points,
        up.total_points,
        COALESCE(dpl.community_points, 0) as today_community_points,
        COALESCE(dpl.video_call_points, 0) as today_video_points,
        up.updated_at
    FROM public.user_points up
    LEFT JOIN public.daily_points_limit dpl ON up.user_id = dpl.user_id AND dpl.date = CURRENT_DATE
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 11. 포인트 랭킹 조회 함수
CREATE OR REPLACE FUNCTION get_points_ranking(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    total_points INTEGER,
    available_points INTEGER,
    full_name TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank,
        up.user_id,
        up.total_points,
        up.available_points,
        u.full_name,
        u.avatar_url
    FROM public.user_points up
    JOIN public.users u ON up.user_id = u.id
    ORDER BY up.total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 12. 일일 포인트 한도 업데이트 함수
CREATE OR REPLACE FUNCTION update_daily_points_limit(
    p_user_id UUID,
    p_community_points INTEGER DEFAULT 0,
    p_video_points INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.daily_points_limit (user_id, date, community_points, video_call_points)
    VALUES (p_user_id, CURRENT_DATE, p_community_points, p_video_points)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        community_points = daily_points_limit.community_points + p_community_points,
        video_call_points = daily_points_limit.video_call_points + p_video_points,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

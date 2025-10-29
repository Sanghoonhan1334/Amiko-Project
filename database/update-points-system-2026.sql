-- =====================================================
-- 2026 포인트 시스템 업데이트
-- Description: 새로운 75점 체계 및 일일 미션 추적
-- Date: 2026-01-XX
-- =====================================================

-- 1. user_points 테이블에 monthly_points 컬럼 추가
-- 먼저 테이블이 있는지 확인하고 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_points' 
        AND column_name = 'monthly_points'
    ) THEN
        ALTER TABLE public.user_points 
        ADD COLUMN monthly_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- monthly_points용 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_points_monthly_points ON public.user_points(monthly_points DESC);

-- 2. points_history의 type에 새로운 타입들 추가
-- 기존 CHECK 제약조건 제거
ALTER TABLE public.points_history DROP CONSTRAINT IF EXISTS points_history_type_check;

-- 새로운 CHECK 제약조건 추가
ALTER TABLE public.points_history ADD CONSTRAINT points_history_type_check CHECK (type IN (
    'attendance_check',      -- 출석체크 (+10)
    'comment_post',          -- 댓글 작성 (+1, max 5)
    'likes',                 -- 좋아요 누르기 (+1, max 10)
    'freeboard_post',        -- 자유게시판 작성 (+2)
    'story_post',            -- 스토리 작성 (+3)
    'fanart_upload',         -- 팬아트 업로드 (+5, max 1)
    'idol_photo_upload',     -- 아이돌 사진 업로드 (+5, max 1)
    'fanart_likes',          -- 팬아트 좋아요 (+1, max 10)
    'idol_photo_likes',      -- 아이돌 사진 좋아요 (+1, max 10)
    'poll_vote',             -- 투표 참여 (+3, max 3)
    'news_comment',          -- 뉴스 댓글 (+2, max 5)
    'share',                 -- 공유 (+3, max 5)
    'video_call',            -- 영상통화 완료 (+40)
    'chat_extension',        -- 채팅 연장 사용 (-100)
    'coupon_purchase',       -- 쿠폰 구매 (-포인트)
    'admin_grant',           -- 관리자 지급
    'admin_deduct',          -- 관리자 차감
    'daily_limit',           -- 일일 한도 도달
    'welcome_bonus'          -- 가입 보너스
));

-- 3. 일일 활동 추적 테이블 생성
CREATE TABLE IF NOT EXISTS public.daily_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 각 활동 횟수
    attendance_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    freeboard_post_count INTEGER DEFAULT 0,
    story_post_count INTEGER DEFAULT 0,
    fanart_upload_count INTEGER DEFAULT 0,
    idol_photo_upload_count INTEGER DEFAULT 0,
    fanart_likes_count INTEGER DEFAULT 0,
    idol_photo_likes_count INTEGER DEFAULT 0,
    poll_vote_count INTEGER DEFAULT 0,
    news_comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- 일일 총 포인트
    total_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_id ON public.daily_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity(date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, date);

-- RLS 활성화
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (기존 정책이 있으면 삭제 후 재생성)
DROP POLICY IF EXISTS "Users can view own daily activity" ON public.daily_activity;
DROP POLICY IF EXISTS "System can manage all daily activity" ON public.daily_activity;

CREATE POLICY "Users can view own daily activity" ON public.daily_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all daily activity" ON public.daily_activity
    FOR ALL USING (true);

-- 4. update_user_points 함수 수정 (monthly_points 추가)
DROP FUNCTION IF EXISTS update_user_points() CASCADE;

CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
DECLARE
    current_month INTEGER;
    current_year INTEGER;
    history_month INTEGER;
    history_year INTEGER;
BEGIN
    current_month := EXTRACT(MONTH FROM NOW());
    current_year := EXTRACT(YEAR FROM NOW());
    history_month := EXTRACT(MONTH FROM NEW.created_at);
    history_year := EXTRACT(YEAR FROM NEW.created_at);
    
    -- 사용자 포인트 테이블 업데이트
    INSERT INTO public.user_points (user_id, available_points, total_points, monthly_points)
    VALUES (
        NEW.user_id, 
        NEW.points, 
        NEW.points,
        CASE 
            WHEN history_year = current_year AND history_month = current_month 
            THEN NEW.points 
            ELSE 0 
        END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        available_points = user_points.available_points + NEW.points,
        total_points = user_points.total_points + NEW.points,
        monthly_points = CASE 
            WHEN history_year = current_year AND history_month = current_month 
            THEN user_points.monthly_points + NEW.points 
            ELSE user_points.monthly_points 
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 재생성
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT ON public.points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points();

-- 5. 일일 활동 업데이트 함수
CREATE OR REPLACE FUNCTION update_daily_activity(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_points INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    activity_count INTEGER;
    max_count INTEGER;
    daily_limit INTEGER := 75;
    current_total_points INTEGER;
BEGIN
    -- 기존 일일 활동 조회 또는 생성
    INSERT INTO public.daily_activity (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    -- 현재 일일 총 포인트 조회
    SELECT total_points INTO current_total_points
    FROM public.daily_activity
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    
    -- 일일 최대 제한 확인
    IF current_total_points + p_points > daily_limit THEN
        RETURN FALSE;
    END IF;
    
    -- 활동별 최대 횟수 및 현재 횟수 확인
    CASE p_type
        WHEN 'comment_post' THEN
            SELECT comment_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            UPDATE public.daily_activity SET comment_count = comment_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'likes' THEN
            SELECT likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            UPDATE public.daily_activity SET likes_count = likes_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'fanart_upload' THEN
            SELECT fanart_upload_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            UPDATE public.daily_activity SET fanart_upload_count = fanart_upload_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'idol_photo_upload' THEN
            SELECT idol_photo_upload_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            UPDATE public.daily_activity SET idol_photo_upload_count = idol_photo_upload_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'fanart_likes' THEN
            SELECT fanart_likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            UPDATE public.daily_activity SET fanart_likes_count = fanart_likes_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'idol_photo_likes' THEN
            SELECT idol_photo_likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            UPDATE public.daily_activity SET idol_photo_likes_count = idol_photo_likes_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'poll_vote' THEN
            SELECT poll_vote_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 3;
            UPDATE public.daily_activity SET poll_vote_count = poll_vote_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'news_comment' THEN
            SELECT news_comment_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            UPDATE public.daily_activity SET news_comment_count = news_comment_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        WHEN 'share' THEN
            SELECT share_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            UPDATE public.daily_activity SET share_count = share_count + 1, total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        ELSE
            -- 제한 없는 활동들 (attendance_check, freeboard_post, story_post)
            UPDATE public.daily_activity SET total_points = total_points + p_points WHERE user_id = p_user_id AND date = CURRENT_DATE;
            RETURN TRUE;
    END CASE;
    
    -- 제한이 있는 활동의 경우 횟수 체크
    IF max_count > 0 AND activity_count >= max_count THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. 포인트 적립 함수 (새로운 75점 체계 적용)
DROP FUNCTION IF EXISTS add_points_with_limit(UUID, VARCHAR, INTEGER, TEXT, UUID, VARCHAR) CASCADE;

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
    activity_allowed BOOLEAN;
    current_user_id UUID;
BEGIN
    -- 인증 확인: 로그인한 사용자만 포인트 적립 가능
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다. 로그인 후 이용해주세요.';
    END IF;
    
    -- 인증된 사용자와 요청한 user_id가 일치하는지 확인 (본인만 자신의 포인트를 적립할 수 있음)
    IF current_user_id != p_user_id THEN
        RAISE EXCEPTION '자신의 포인트만 적립할 수 있습니다.';
    END IF;
    
    -- 일일 활동 제한 확인 및 업데이트
    activity_allowed := update_daily_activity(p_user_id, p_type, p_amount);
    
    IF NOT activity_allowed THEN
        RETURN FALSE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 월별 포인트 초기화 함수 (매월 1일 실행)
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_points SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql;

-- 8. 일일 활동 조회 함수
CREATE OR REPLACE FUNCTION get_daily_activity(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    attendance_count INTEGER,
    comment_count INTEGER,
    likes_count INTEGER,
    freeboard_post_count INTEGER,
    story_post_count INTEGER,
    fanart_upload_count INTEGER,
    idol_photo_upload_count INTEGER,
    fanart_likes_count INTEGER,
    idol_photo_likes_count INTEGER,
    poll_vote_count INTEGER,
    news_comment_count INTEGER,
    share_count INTEGER,
    total_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(da.attendance_count, 0),
        COALESCE(da.comment_count, 0),
        COALESCE(da.likes_count, 0),
        COALESCE(da.freeboard_post_count, 0),
        COALESCE(da.story_post_count, 0),
        COALESCE(da.fanart_upload_count, 0),
        COALESCE(da.idol_photo_upload_count, 0),
        COALESCE(da.fanart_likes_count, 0),
        COALESCE(da.idol_photo_likes_count, 0),
        COALESCE(da.poll_vote_count, 0),
        COALESCE(da.news_comment_count, 0),
        COALESCE(da.share_count, 0),
        COALESCE(da.total_points, 0)
    FROM public.daily_activity da
    WHERE da.user_id = p_user_id AND da.date = p_date;
    
    -- 데이터가 없으면 0으로 채워진 결과 반환
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. 사용자 포인트 요약 조회 함수 업데이트
DROP FUNCTION IF EXISTS get_user_points_summary(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_user_points_summary(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    available_points INTEGER,
    total_points INTEGER,
    monthly_points INTEGER,
    today_total_points INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.available_points,
        up.total_points,
        up.monthly_points,
        COALESCE(da.total_points, 0) as today_total_points,
        up.updated_at
    FROM public.user_points up
    LEFT JOIN public.daily_activity da ON up.user_id = da.user_id AND da.date = CURRENT_DATE
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'Points system updated successfully for 2026!' as message;


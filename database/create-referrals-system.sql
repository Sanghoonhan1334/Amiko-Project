-- =====================================================
-- 추천인 시스템 (Referral System)
-- Description: 회원가입 시 추천인 코드 추적 및 이벤트 관리
-- Date: 2026-01-XX
-- =====================================================

-- 1. 추천인 테이블 (Referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL, -- 추천인 코드
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 추천한 사람 (null일 수 있음, 추후 추천인 보상용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON public.referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON public.referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

-- RLS 활성화
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own referral info" ON public.referrals;
DROP POLICY IF EXISTS "System can manage all referrals" ON public.referrals;

-- 사용자는 자신의 추천 정보만 조회 가능
CREATE POLICY "Users can view own referral info" ON public.referrals
    FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 모든 추천 관련 작업 가능
CREATE POLICY "System can manage all referrals" ON public.referrals
    FOR ALL USING (true);

-- 2. 추천인 이벤트 참가자 테이블 (Referral Event Participants)
CREATE TABLE IF NOT EXISTS public.referral_event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_period VARCHAR(20) NOT NULL, -- 'january-2026' 형식
    is_winner BOOLEAN DEFAULT FALSE, -- 당첨 여부
    prize_rank INTEGER, -- 1등, 10명 중 몇등인지 (1 = 1등, 2-11 = 10명 추첨)
    prize_type VARCHAR(50), -- 'skincare' (1등), 'mask_pack' (추첨)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, event_period)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_referral_event_user_id ON public.referral_event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_event_period ON public.referral_event_participants(event_period);
CREATE INDEX IF NOT EXISTS idx_referral_event_winner ON public.referral_event_participants(is_winner);

-- RLS 활성화
ALTER TABLE public.referral_event_participants ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own event participation" ON public.referral_event_participants;
DROP POLICY IF EXISTS "System can manage all event participants" ON public.referral_event_participants;

CREATE POLICY "Users can view own event participation" ON public.referral_event_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all event participants" ON public.referral_event_participants
    FOR ALL USING (true);

-- 3. 월별 포인트 이벤트 참가자 테이블 (Monthly Points Event Participants)
CREATE TABLE IF NOT EXISTS public.monthly_points_event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_period VARCHAR(20) NOT NULL, -- 'february-2026' 형식
    monthly_points INTEGER NOT NULL, -- 해당 월 포인트
    total_points_rank INTEGER, -- 월별 포인트 랭킹 (1 = 1등)
    is_raffle_winner BOOLEAN DEFAULT FALSE, -- 추첨 당첨 여부
    prize_type VARCHAR(50), -- 'skincare_mask' (추첨 3명), 'premium_sunscreen' (1등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, event_period)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_points_event_user_id ON public.monthly_points_event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_points_event_period ON public.monthly_points_event_participants(event_period);
CREATE INDEX IF NOT EXISTS idx_monthly_points_event_rank ON public.monthly_points_event_participants(event_period, total_points_rank);
CREATE INDEX IF NOT EXISTS idx_monthly_points_event_points ON public.monthly_points_event_participants(event_period, monthly_points DESC);

-- RLS 활성화
ALTER TABLE public.monthly_points_event_participants ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own monthly event participation" ON public.monthly_points_event_participants;
DROP POLICY IF EXISTS "System can manage all monthly event participants" ON public.monthly_points_event_participants;

CREATE POLICY "Users can view own monthly event participation" ON public.monthly_points_event_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all monthly event participants" ON public.monthly_points_event_participants
    FOR ALL USING (true);

-- 4. 추천인 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 1, I, 0, O 제외
    result VARCHAR(20) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. 추천인 정보 저장 함수
CREATE OR REPLACE FUNCTION save_referral(
    p_user_id UUID,
    p_referral_code VARCHAR(20),
    p_referred_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    referral_id UUID;
BEGIN
    -- 추천 정보 저장
    INSERT INTO public.referrals (user_id, referral_code, referred_by)
    VALUES (p_user_id, p_referral_code, p_referred_by)
    RETURNING id INTO referral_id;
    
    -- 해당 월의 이벤트 참가자로 자동 등록
    INSERT INTO public.referral_event_participants (referral_id, user_id, event_period)
    VALUES (referral_id, p_user_id, to_char(NOW(), 'Month-YYYY'))
    ON CONFLICT (user_id, event_period) DO NOTHING;
    
    RETURN referral_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 월말 추천인 이벤트 추첨 함수 (1등 + 10명 추첨)
CREATE OR REPLACE FUNCTION draw_referral_event_winner(p_period VARCHAR(20))
RETURNS VOID AS $$
DECLARE
    winner_count INTEGER := 10;
    first_place_user UUID;
    raffle_users UUID[];
BEGIN
    -- 1등: 총 추천인이 가장 많은 사람 (추후 구현)
    -- 현재는 랜덤으로 선택
    SELECT user_id INTO first_place_user
    FROM public.referral_event_participants
    WHERE event_period = p_period
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- 1등 업데이트
    UPDATE public.referral_event_participants
    SET 
        is_winner = TRUE,
        prize_rank = 1,
        prize_type = 'skincare',
        updated_at = NOW()
    WHERE user_id = first_place_user AND event_period = p_period;
    
    -- 나머지 10명 추첨
    WITH raffle_candidates AS (
        SELECT user_id
        FROM public.referral_event_participants
        WHERE event_period = p_period
        AND is_winner = FALSE
        ORDER BY RANDOM()
        LIMIT winner_count
    )
    UPDATE public.referral_event_participants
    SET 
        is_winner = TRUE,
        prize_rank = 2,
        prize_type = 'mask_pack',
        updated_at = NOW()
    WHERE user_id IN (SELECT user_id FROM raffle_candidates);
END;
$$ LANGUAGE plpgsql;

-- 7. 월말 포인트 이벤트 추첨 함수 (1등 + 3명 추첨)
CREATE OR REPLACE FUNCTION draw_monthly_points_event_winner(p_period VARCHAR(20), p_point_threshold INTEGER DEFAULT 0)
RETURNS VOID AS $$
DECLARE
    first_place_user UUID;
    raffle_users UUID[];
BEGIN
    -- 1등: 월별 포인트가 가장 높은 사람
    SELECT user_id INTO first_place_user
    FROM public.user_points
    WHERE monthly_points = (
        SELECT MAX(monthly_points)
        FROM public.user_points
    )
    LIMIT 1;
    
    -- 1등 업데이트
    INSERT INTO public.monthly_points_event_participants (user_id, event_period, monthly_points, total_points_rank, is_raffle_winner, prize_type)
    VALUES (
        first_place_user,
        p_period,
        (SELECT monthly_points FROM public.user_points WHERE user_id = first_place_user),
        1,
        TRUE,
        'premium_sunscreen'
    )
    ON CONFLICT (user_id, event_period) 
    DO UPDATE SET 
        is_raffle_winner = TRUE,
        prize_type = 'premium_sunscreen',
        total_points_rank = 1;
    
    -- 추첨 대상자 조회 (특정 점수 이상)
    WITH eligible_users AS (
        SELECT up.user_id, up.monthly_points
        FROM public.user_points up
        WHERE up.monthly_points >= p_point_threshold
        AND up.user_id NOT IN (
            SELECT user_id FROM public.monthly_points_event_participants 
            WHERE event_period = p_period
        )
        ORDER BY RANDOM()
        LIMIT 3
    )
    INSERT INTO public.monthly_points_event_participants (user_id, event_period, monthly_points, is_raffle_winner, prize_type)
    SELECT user_id, p_period, monthly_points, TRUE, 'skincare_mask'
    FROM eligible_users;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'Referral system created successfully!' as message;


-- 매칭 시스템 관련 테이블들

-- 1. 매칭 요청 테이블
CREATE TABLE IF NOT EXISTS matching_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('instant', 'selective')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    message TEXT, -- 선택적 매칭 시 보내는 메시지
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 매칭 세션 테이블 (실제 대화가 시작된 경우)
CREATE TABLE IF NOT EXISTS matching_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES matching_requests(id) ON DELETE CASCADE,
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('instant', 'selective')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'timeout')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 선호도 테이블 (인증에서 수집한 정보)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    matching_preferences TEXT[] DEFAULT '{}', -- ['instant', 'selective']
    interests TEXT[] DEFAULT '{}',
    custom_interests TEXT DEFAULT '',
    korean_level TEXT CHECK (korean_level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    english_level TEXT CHECK (english_level IN ('none', 'beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    spanish_level TEXT CHECK (spanish_level IN ('none', 'beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
    is_korean BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 찜하기 테이블 (즉석 매칭에서 만난 사람을 찜하기)
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    favorite_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES matching_sessions(id) ON DELETE CASCADE, -- 어떤 세션에서 만났는지
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, favorite_user_id)
);

-- 5. 매칭 통계 테이블 (일일 활동 통계)
CREATE TABLE IF NOT EXISTS daily_matching_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_active_users INTEGER DEFAULT 0,
    instant_matches INTEGER DEFAULT 0,
    selective_matches INTEGER DEFAULT 0,
    total_coupons_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_matching_requests_requester ON matching_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_matching_requests_target ON matching_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_matching_requests_status ON matching_requests(status);
CREATE INDEX IF NOT EXISTS idx_matching_requests_type ON matching_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_matching_requests_expires ON matching_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_matching_sessions_user1 ON matching_sessions(user1_id);
CREATE INDEX IF NOT EXISTS idx_matching_sessions_user2 ON matching_sessions(user2_id);
CREATE INDEX IF NOT EXISTS idx_matching_sessions_status ON matching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_matching_sessions_started ON matching_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_korean ON user_preferences(is_korean);
CREATE INDEX IF NOT EXISTS idx_user_preferences_interests ON user_preferences USING GIN(interests);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_favorite ON user_favorites(favorite_user_id);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_matching_stats(date);

-- 함수: 만료된 매칭 요청 정리
CREATE OR REPLACE FUNCTION cleanup_expired_requests()
RETURNS void AS $$
BEGIN
    UPDATE matching_requests 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 함수: 매칭 요청 생성 (쿠폰 차감 포함)
CREATE OR REPLACE FUNCTION create_matching_request(
    p_requester_id UUID,
    p_target_id UUID DEFAULT NULL,
    p_request_type TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_coupon_id UUID;
BEGIN
    -- 사용 가능한 쿠폰 확인 및 차감
    SELECT id INTO v_coupon_id
    FROM coupons 
    WHERE user_id = p_requester_id 
    AND amount > used_amount 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF v_coupon_id IS NULL THEN
        RAISE EXCEPTION '사용 가능한 쿠폰이 없습니다';
    END IF;
    
    -- 쿠폰 사용량 증가
    UPDATE coupons 
    SET used_amount = used_amount + 1 
    WHERE id = v_coupon_id;
    
    -- 매칭 요청 생성
    INSERT INTO matching_requests (requester_id, target_id, request_type, coupon_id, message)
    VALUES (p_requester_id, p_target_id, p_request_type, v_coupon_id, p_message)
    RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- 함수: 매칭 요청 수락
CREATE OR REPLACE FUNCTION accept_matching_request(p_request_id UUID)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_requester_id UUID;
    v_target_id UUID;
    v_request_type TEXT;
BEGIN
    -- 요청 정보 가져오기
    SELECT requester_id, target_id, request_type 
    INTO v_requester_id, v_target_id, v_request_type
    FROM matching_requests 
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_requester_id IS NULL THEN
        RAISE EXCEPTION '유효하지 않은 매칭 요청입니다';
    END IF;
    
    -- 요청 상태 업데이트
    UPDATE matching_requests 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = p_request_id;
    
    -- 매칭 세션 생성
    INSERT INTO matching_sessions (request_id, user1_id, user2_id, session_type)
    VALUES (p_request_id, v_requester_id, v_target_id, v_request_type)
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_matching_requests_updated_at 
    BEFORE UPDATE ON matching_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_sessions_updated_at 
    BEFORE UPDATE ON matching_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE matching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 매칭 요청 정책
CREATE POLICY "Users can view their own requests" ON matching_requests
    FOR SELECT USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create requests" ON matching_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own requests" ON matching_requests
    FOR UPDATE USING (requester_id = auth.uid() OR target_id = auth.uid());

-- 매칭 세션 정책
CREATE POLICY "Users can view their own sessions" ON matching_sessions
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON matching_sessions
    FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- 사용자 선호도 정책
CREATE POLICY "Users can view all preferences" ON user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- 찜하기 정책
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites" ON user_favorites
    FOR ALL USING (user_id = auth.uid());

-- 화상 채팅 예약 시스템을 위한 스키마

-- 1. 한국인 파트너의 가능 시간 테이블
CREATE TABLE IF NOT EXISTS public.available_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.conversation_partners(user_id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'cancelled')),
    booking_request_id UUID, -- 예약 요청 ID (선택적)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 시간에 중복 등록 방지
    UNIQUE(partner_id, date, start_time)
);

-- 2. 예약 요청 테이블 (기존 bookings 테이블과 별도로 관리)
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.conversation_partners(user_id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- 예약 정보
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- 분 단위
    topic VARCHAR(200),
    description TEXT,
    meet_url TEXT,
    
    -- 상태 관리
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    rejection_reason TEXT, -- 거절 사유
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- 알림 관련
    notification_sent BOOLEAN DEFAULT FALSE
);

-- 3. 정기 시간표 테이블 (한국인이 평소에 가능한 시간)
CREATE TABLE IF NOT EXISTS public.partner_recurring_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.conversation_partners(user_id) ON DELETE CASCADE NOT NULL,
    
    -- 요일 (0=일요일, 1=월요일, ..., 6=토요일)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- 활성 상태
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 적용 시작/종료 날짜
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 요일에 중복 시간 등록 방지
    UNIQUE(partner_id, day_of_week, start_time)
);

-- RLS 정책 설정
ALTER TABLE public.available_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_recurring_schedules ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 오류 방지)
DROP POLICY IF EXISTS "Anyone can view available schedules" ON public.available_schedules;
DROP POLICY IF EXISTS "Partners can manage their own schedules" ON public.available_schedules;
DROP POLICY IF EXISTS "Users can view their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Users can create booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Partners can update their booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Anyone can view active recurring schedules" ON public.partner_recurring_schedules;
DROP POLICY IF EXISTS "Partners can manage their own recurring schedules" ON public.partner_recurring_schedules;

-- available_schedules RLS 정책
CREATE POLICY "Anyone can view available schedules" ON public.available_schedules
    FOR SELECT USING (true);

CREATE POLICY "Partners can manage their own schedules" ON public.available_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversation_partners
            WHERE conversation_partners.user_id = auth.uid()
            AND conversation_partners.user_id = available_schedules.partner_id
        )
    );

-- booking_requests RLS 정책
CREATE POLICY "Users can view their own booking requests" ON public.booking_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create booking requests" ON public.booking_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their booking requests" ON public.booking_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_partners
            WHERE conversation_partners.user_id = auth.uid()
            AND conversation_partners.user_id = booking_requests.partner_id
        )
    );

-- partner_recurring_schedules RLS 정책
CREATE POLICY "Anyone can view active recurring schedules" ON public.partner_recurring_schedules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Partners can manage their own recurring schedules" ON public.partner_recurring_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversation_partners
            WHERE conversation_partners.user_id = auth.uid()
            AND conversation_partners.user_id = partner_recurring_schedules.partner_id
        )
    );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_available_schedules_partner_id ON public.available_schedules(partner_id);
CREATE INDEX IF NOT EXISTS idx_available_schedules_date ON public.available_schedules(date);
CREATE INDEX IF NOT EXISTS idx_available_schedules_status ON public.available_schedules(status);

CREATE INDEX IF NOT EXISTS idx_booking_requests_partner_id ON public.booking_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_date ON public.booking_requests(date);

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_partner_id ON public.partner_recurring_schedules(partner_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_day ON public.partner_recurring_schedules(day_of_week);


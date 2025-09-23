-- =====================================================
-- 개인정보 보관기간 정책 관련 테이블
-- Description: 개인정보 삭제 요청 및 로그 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 개인정보 삭제 요청 테이블
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    delete_all BOOLEAN DEFAULT FALSE,
    deleted_profile BOOLEAN DEFAULT FALSE,
    deleted_posts INTEGER DEFAULT 0,
    deleted_comments INTEGER DEFAULT 0,
    deleted_video_calls INTEGER DEFAULT 0,
    deleted_points INTEGER DEFAULT 0,
    errors TEXT[],
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed'))
);

-- 2. 자동 삭제 로그 테이블
CREATE TABLE IF NOT EXISTS public.deletion_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deleted_users INTEGER DEFAULT 0,
    deleted_logs INTEGER DEFAULT 0,
    deleted_support INTEGER DEFAULT 0,
    deleted_video_calls INTEGER DEFAULT 0,
    errors TEXT[],
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_type TEXT DEFAULT 'automatic' CHECK (execution_type IN ('automatic', 'manual'))
);

-- 3. 접속 로그 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 화상채팅 로그 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS public.video_call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER,
    call_quality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 고객 지원 티켓 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. 포인트 거래 기록 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- 관련된 게시글, 화상채팅 등의 ID
    reference_type TEXT, -- 'post', 'comment', 'video_call', 'event' 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 삭제 요청 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON public.deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_at ON public.deletion_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests(status);

-- 삭제 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_deletion_logs_executed_at ON public.deletion_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_executed_by ON public.deletion_logs(executed_by);

-- 접속 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip_address ON public.access_logs(ip_address);

-- 화상채팅 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_video_call_logs_user_id ON public.video_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_partner_id ON public.video_call_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_video_call_logs_created_at ON public.video_call_logs(created_at DESC);

-- 고객 지원 티켓 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- 포인트 거래 기록 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON public.point_transactions(transaction_type);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 삭제 요청 테이블 RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests" ON public.deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON public.deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests" ON public.deletion_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 삭제 로그 테이블 RLS
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deletion logs" ON public.deletion_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 접속 로그 테이블 RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs" ON public.access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access logs" ON public.access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 화상채팅 로그 테이블 RLS
ALTER TABLE public.video_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video call logs" ON public.video_call_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Admins can view all video call logs" ON public.video_call_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 고객 지원 티켓 테이블 RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets" ON public.support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 포인트 거래 기록 테이블 RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own point transactions" ON public.point_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all point transactions" ON public.point_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 고객 지원 티켓 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_ticket_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_updated_at();

-- 접속 로그 자동 생성 함수
CREATE OR REPLACE FUNCTION log_user_access(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_page_url TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.access_logs (user_id, ip_address, user_agent, page_url)
    VALUES (p_user_id, p_ip_address, p_user_agent, p_page_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 화상채팅 로그 자동 생성 함수
CREATE OR REPLACE FUNCTION log_video_call(
    p_user_id UUID,
    p_partner_id UUID,
    p_duration_minutes INTEGER,
    p_call_quality TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.video_call_logs (user_id, partner_id, duration_minutes, call_quality)
    VALUES (p_user_id, p_partner_id, p_duration_minutes, p_call_quality);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 포인트 거래 기록 자동 생성 함수
CREATE OR REPLACE FUNCTION log_point_transaction(
    p_user_id UUID,
    p_transaction_type TEXT,
    p_amount INTEGER,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.point_transactions (
        user_id, 
        transaction_type, 
        amount, 
        description, 
        reference_id, 
        reference_type
    )
    VALUES (
        p_user_id, 
        p_transaction_type, 
        p_amount, 
        p_description, 
        p_reference_id, 
        p_reference_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 개인정보 삭제 요청:
   INSERT INTO public.deletion_requests (user_id, reason, delete_all)
   VALUES ('user-uuid', '개인정보 보호', true);

2. 접속 로그 기록:
   SELECT log_user_access('user-uuid', '192.168.1.1', 'Mozilla/5.0...', '/main');

3. 화상채팅 로그 기록:
   SELECT log_video_call('user-uuid', 'partner-uuid', 20, 'good');

4. 포인트 거래 기록:
   SELECT log_point_transaction('user-uuid', 'earned', 5, '게시글 작성', 'post-uuid', 'post');

5. 자동 삭제 실행:
   - 매일 자동으로 실행되는 스케줄러 설정 필요
   - 관리자 권한으로 API 호출

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 관리자만 전체 데이터 조회 가능
- 사용자는 본인 데이터만 조회/삭제 가능
- 삭제 로그는 영구 보존
- 법정 보존 기간 준수
*/

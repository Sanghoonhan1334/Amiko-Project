-- =====================================================
-- 개인정보 삭제 요청 관련 테이블
-- Description: 사용자 개인정보 삭제 요청 및 처리 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 사용자 삭제 요청 테이블
CREATE TABLE IF NOT EXISTS public.user_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('partial', 'complete')),
    reason TEXT NOT NULL,
    delete_all BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
    ip_address INET,
    user_agent TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 데이터 삭제 로그 테이블
CREATE TABLE IF NOT EXISTS public.data_deletion_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.user_deletion_requests(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'request_created', 'request_cancelled', 'admin_approved', 
        'admin_rejected', 'deletion_started', 'deletion_completed', 'deletion_failed'
    )),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 관리자 알림 테이블
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 4. 사용자 알림 테이블
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 5. 사용자 테이블에 삭제 관련 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 사용자 삭제 요청 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_user_id ON public.user_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_status ON public.user_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_requested_at ON public.user_deletion_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_processed_at ON public.user_deletion_requests(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_request_type ON public.user_deletion_requests(request_type);

-- 데이터 삭제 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_data_deletion_logs_user_id ON public.data_deletion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_logs_request_id ON public.data_deletion_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_logs_action_type ON public.data_deletion_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_data_deletion_logs_created_at ON public.data_deletion_logs(created_at DESC);

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 사용자 삭제 요청 테이블 RLS
ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests" ON public.user_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON public.user_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests" ON public.user_deletion_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

CREATE POLICY "Admins can update deletion requests" ON public.user_deletion_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 데이터 삭제 로그 테이블 RLS
ALTER TABLE public.data_deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion logs" ON public.data_deletion_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion logs" ON public.data_deletion_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 관리자 알림 테이블 RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin notifications" ON public.admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

CREATE POLICY "Admins can update admin notifications" ON public.admin_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 사용자 알림 테이블 RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 삭제 요청 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_deletion_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deletion_request_updated_at
    BEFORE UPDATE ON public.user_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_deletion_request_updated_at();

-- 삭제 요청 생성 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_deletion_request_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.data_deletion_logs (
        user_id, request_id, action_type, details, created_at
    ) VALUES (
        NEW.user_id, NEW.id, 'request_created', 
        jsonb_build_object(
            'request_type', NEW.request_type,
            'reason', NEW.reason,
            'delete_all', NEW.delete_all
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deletion_request_creation
    AFTER INSERT ON public.user_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_deletion_request_creation();

-- 삭제 요청 상태 변경 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_deletion_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO public.data_deletion_logs (
            user_id, request_id, action_type, details, created_at
        ) VALUES (
            NEW.user_id, NEW.id, 
            CASE 
                WHEN NEW.status = 'processing' THEN 'deletion_started'
                WHEN NEW.status = 'completed' THEN 'deletion_completed'
                WHEN NEW.status = 'rejected' THEN 'admin_rejected'
                WHEN NEW.status = 'cancelled' THEN 'request_cancelled'
                ELSE 'status_changed'
            END,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'processed_by', NEW.processed_by,
                'rejection_reason', NEW.rejection_reason
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deletion_request_status_change
    AFTER UPDATE ON public.user_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_deletion_request_status_change();

-- 삭제 요청 통계 함수
CREATE OR REPLACE FUNCTION get_deletion_request_statistics()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    completed_requests BIGINT,
    rejected_requests BIGINT,
    partial_requests BIGINT,
    complete_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE request_type = 'partial') as partial_requests,
        COUNT(*) FILTER (WHERE request_type = 'complete') as complete_requests
    FROM public.user_deletion_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 삭제 요청 자동 처리 함수 (스케줄러용)
CREATE OR REPLACE FUNCTION process_pending_deletion_requests()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    request_record RECORD;
BEGIN
    -- 7일 이상 대기 중인 요청들을 자동 승인
    FOR request_record IN 
        SELECT * FROM public.user_deletion_requests 
        WHERE status = 'pending' 
        AND requested_at < NOW() - INTERVAL '7 days'
    LOOP
        -- 자동 승인 처리
        UPDATE public.user_deletion_requests 
        SET 
            status = 'processing',
            processed_by = NULL, -- 시스템 자동 처리
            updated_at = NOW()
        WHERE id = request_record.id;
        
        -- 실제 삭제 작업 수행
        IF request_record.delete_all OR request_record.request_type = 'complete' THEN
            PERFORM perform_complete_deletion(request_record.user_id);
        ELSE
            PERFORM perform_partial_deletion(request_record.user_id);
        END IF;
        
        -- 완료 상태로 변경
        UPDATE public.user_deletion_requests 
        SET 
            status = 'completed',
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 전체 삭제 수행 함수
CREATE OR REPLACE FUNCTION perform_complete_deletion(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 관련 테이블에서 데이터 삭제
    DELETE FROM public.user_profiles WHERE user_id = p_user_id;
    DELETE FROM public.community_posts WHERE user_id = p_user_id;
    DELETE FROM public.community_comments WHERE user_id = p_user_id;
    DELETE FROM public.video_call_logs WHERE user_id = p_user_id;
    DELETE FROM public.point_transactions WHERE user_id = p_user_id;
    DELETE FROM public.user_consents WHERE user_id = p_user_id;
    DELETE FROM public.consent_change_logs WHERE user_id = p_user_id;
    DELETE FROM public.access_logs WHERE user_id = p_user_id;
    DELETE FROM public.customer_support_records WHERE user_id = p_user_id;
    
    -- 사용자 계정 비활성화
    UPDATE public.users 
    SET 
        is_active = FALSE,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 부분 삭제 수행 함수
CREATE OR REPLACE FUNCTION perform_partial_deletion(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 프로필 및 커뮤니티 활동만 삭제
    DELETE FROM public.user_profiles WHERE user_id = p_user_id;
    DELETE FROM public.community_posts WHERE user_id = p_user_id;
    DELETE FROM public.community_comments WHERE user_id = p_user_id;
    
    -- 프로필 정보 초기화
    UPDATE public.users 
    SET 
        profile_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- 관리자 알림 설정
INSERT INTO public.admin_notifications (type, title, message, data)
VALUES (
    'system_info',
    '개인정보 삭제 시스템 활성화',
    '개인정보 삭제 요청 처리 시스템이 활성화되었습니다.',
    '{"system": "data_deletion", "version": "1.0"}'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 삭제 요청 생성:
   INSERT INTO public.user_deletion_requests (user_id, request_type, reason, delete_all)
   VALUES ('user-uuid', 'partial', '프로필 정보 삭제 요청', false);

2. 삭제 요청 조회:
   SELECT * FROM public.user_deletion_requests WHERE user_id = 'user-uuid';

3. 삭제 요청 승인:
   UPDATE public.user_deletion_requests 
   SET status = 'processing', processed_by = 'admin-uuid'
   WHERE id = 'request-uuid';

4. 삭제 통계 조회:
   SELECT * FROM get_deletion_request_statistics();

5. 대기 중인 요청 자동 처리:
   SELECT process_pending_deletion_requests();

6. 삭제 로그 조회:
   SELECT * FROM public.data_deletion_logs 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC;

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 삭제 요청만 조회/생성 가능
- 관리자는 모든 삭제 요청 조회/처리 가능
- 모든 삭제 작업 로그 기록
- 자동 삭제 처리 기능 제공

법적 고려사항:
- 삭제 요청 접수 시 즉시 확인
- 삭제 처리 완료 시 사용자에게 통지
- 삭제 작업 전체 과정 로그 보존
- 삭제 요청 거부 시 명확한 사유 제공
- 자동 삭제 처리 시 7일 대기 기간 적용
*/

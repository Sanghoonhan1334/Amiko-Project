-- 알림 시스템 데이터베이스 스키마
-- Notification System Database Schema

-- 알림 테이블 생성
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'comment', 'like', 'answer_accepted', 'story_comment', 'story_like'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- 추가 데이터 (게시물 ID, 댓글 ID 등)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS 정책 설정
-- Set up RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 볼 수 있음
-- Users can only view their own notifications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view own notifications'
    ) THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 사용자는 자신의 알림을 업데이트할 수 있음 (읽음 상태 변경)
-- Users can update their own notifications (read status)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update own notifications'
    ) THEN
        CREATE POLICY "Users can update own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 시스템은 모든 알림을 생성할 수 있음
-- System can create all notifications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'System can create notifications'
    ) THEN
        CREATE POLICY "System can create notifications" ON public.notifications
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 업데이트 시간 자동 갱신 트리거
-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_triggers 
        WHERE trigger_name = 'trigger_update_notifications_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_notifications_updated_at
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION update_notifications_updated_at();
    END IF;
END $$;

-- 알림 생성 함수
-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(200),
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 알림 생성 트리거
-- Trigger to create comment notifications
CREATE OR REPLACE FUNCTION notify_comment_created()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title VARCHAR(200);
    comment_author_name VARCHAR(100);
BEGIN
    -- 게시물 작성자 정보 가져오기
    SELECT author_id, title INTO post_author_id, post_title
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- 댓글 작성자 이름 가져오기
    SELECT full_name INTO comment_author_name
    FROM public.users
    WHERE id = NEW.author_id;
    
    -- 자신의 게시물에 댓글을 달지 않은 경우에만 알림 생성
    IF post_author_id != NEW.author_id THEN
        PERFORM create_notification(
            post_author_id,
            'comment',
            '새로운 댓글이 달렸습니다',
            comment_author_name || '님이 "' || post_title || '" 게시물에 댓글을 남겼습니다.',
            jsonb_build_object(
                'post_id', NEW.post_id,
                'comment_id', NEW.id,
                'comment_author_id', NEW.author_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 테이블에 트리거 추가
-- Add trigger to comments table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_triggers 
        WHERE trigger_name = 'trigger_notify_comment_created'
    ) THEN
        CREATE TRIGGER trigger_notify_comment_created
            AFTER INSERT ON public.comments
            FOR EACH ROW
            EXECUTE FUNCTION notify_comment_created();
    END IF;
END $$;

-- 좋아요 알림 생성 트리거
-- Trigger to create like notifications
CREATE OR REPLACE FUNCTION notify_like_created()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title VARCHAR(200);
    like_author_name VARCHAR(100);
BEGIN
    -- 게시물 작성자 정보 가져오기
    SELECT author_id, title INTO post_author_id, post_title
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- 좋아요 누른 사용자 이름 가져오기
    SELECT full_name INTO like_author_name
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- 자신의 게시물에 좋아요를 누르지 않은 경우에만 알림 생성
    IF post_author_id != NEW.user_id THEN
        PERFORM create_notification(
            post_author_id,
            'like',
            '좋아요를 받았습니다',
            like_author_name || '님이 "' || post_title || '" 게시물에 좋아요를 눌렀습니다.',
            jsonb_build_object(
                'post_id', NEW.post_id,
                'like_user_id', NEW.user_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 테이블에 트리거 추가
-- Add trigger to post_reactions table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_triggers 
        WHERE trigger_name = 'trigger_notify_like_created'
    ) THEN
        CREATE TRIGGER trigger_notify_like_created
            AFTER INSERT ON public.post_reactions
            FOR EACH ROW
            WHEN (NEW.reaction_type = 'like')
            EXECUTE FUNCTION notify_like_created();
    END IF;
END $$;

-- 샘플 데이터 (테스트용)
-- Sample data for testing
INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
(
    (SELECT id FROM public.users LIMIT 1),
    'comment',
    '새로운 댓글이 달렸습니다',
    '김민수님이 "한국 문화에 대해 질문드립니다" 게시물에 댓글을 남겼습니다.',
    '{"post_id": "sample-post-id", "comment_id": "sample-comment-id"}'
),
(
    (SELECT id FROM public.users LIMIT 1),
    'like',
    '좋아요를 받았습니다',
    '박지영님이 "스토리 공유" 게시물에 좋아요를 눌렀습니다.',
    '{"post_id": "sample-post-id", "like_user_id": "sample-user-id"}'
)
ON CONFLICT DO NOTHING;

-- 완료 메시지
-- Completion message
SELECT '알림 시스템 데이터베이스 스키마가 성공적으로 생성되었습니다!' as status,
       'Notification system database schema created successfully!' as status_en;

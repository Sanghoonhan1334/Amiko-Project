-- 댓글 알림 설정 필드 추가 및 트리거 수정
-- Add comment notification settings and update trigger

-- 1. notification_settings 테이블에 댓글 알림 설정 필드 추가
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS comment_notifications_enabled BOOLEAN DEFAULT TRUE;

-- 기존 사용자들에게 기본값 설정
UPDATE notification_settings 
SET comment_notifications_enabled = COALESCE(comment_notifications_enabled, TRUE)
WHERE comment_notifications_enabled IS NULL;

-- 2. 댓글 알림 생성 트리거 수정 (사용자 알림 설정 확인 추가)
CREATE OR REPLACE FUNCTION notify_comment_created()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title VARCHAR(200);
    comment_author_name VARCHAR(100);
    comment_notifications_enabled BOOLEAN;
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
        -- 사용자의 댓글 알림 설정 확인
        SELECT COALESCE(comment_notifications_enabled, TRUE) INTO comment_notifications_enabled
        FROM public.notification_settings
        WHERE user_id = post_author_id;
        
        -- 알림 설정이 활성화된 경우에만 알림 생성
        IF comment_notifications_enabled THEN
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
SELECT '댓글 알림 설정이 성공적으로 업데이트되었습니다! 🎉' as message;


-- 간소화된 알림 설정에 맞게 트리거 업데이트
-- Update triggers to use simplified notification settings

-- 댓글 알림 트리거 업데이트 (interaction_notifications_enabled 사용)
CREATE OR REPLACE FUNCTION notify_comment_created()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title VARCHAR(200);
    comment_author_name VARCHAR(100);
    interaction_notifications_enabled BOOLEAN;
    push_enabled BOOLEAN;
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
        -- 사용자의 상호작용 알림 설정 확인 (간소화된 설정)
        SELECT 
            COALESCE(interaction_notifications_enabled, TRUE),
            COALESCE(push_enabled, TRUE)
        INTO interaction_notifications_enabled, push_enabled
        FROM public.notification_settings
        WHERE user_id = post_author_id;
        
        -- 상호작용 알림과 푸시 알림이 모두 활성화된 경우에만 알림 생성
        IF interaction_notifications_enabled AND push_enabled THEN
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

-- 좋아요 알림 트리거 업데이트 (interaction_notifications_enabled 사용)
CREATE OR REPLACE FUNCTION notify_like_created()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title VARCHAR(200);
    like_author_name VARCHAR(100);
    interaction_notifications_enabled BOOLEAN;
    push_enabled BOOLEAN;
BEGIN
    -- 게시물 작성자 정보 가져오기
    SELECT author_id, title INTO post_author_id, post_title
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- 좋아요 작성자 이름 가져오기
    SELECT full_name INTO like_author_name
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- 자신의 게시물에 좋아요를 누르지 않은 경우에만 알림 생성
    IF post_author_id != NEW.user_id THEN
        -- 사용자의 상호작용 알림 설정 확인 (간소화된 설정)
        SELECT 
            COALESCE(interaction_notifications_enabled, TRUE),
            COALESCE(push_enabled, TRUE)
        INTO interaction_notifications_enabled, push_enabled
        FROM public.notification_settings
        WHERE user_id = post_author_id;
        
        -- 상호작용 알림과 푸시 알림이 모두 활성화된 경우에만 알림 생성
        IF interaction_notifications_enabled AND push_enabled THEN
            PERFORM create_notification(
                post_author_id,
                'like',
                '새로운 좋아요가 달렸습니다',
                like_author_name || '님이 "' || post_title || '" 게시물에 좋아요를 눌렀습니다.',
                jsonb_build_object(
                    'post_id', NEW.post_id,
                    'like_id', NEW.id,
                    'like_author_id', NEW.user_id
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
SELECT '알림 트리거가 간소화된 설정에 맞게 업데이트되었습니다! 🎉' as message;


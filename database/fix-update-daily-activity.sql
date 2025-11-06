-- =====================================================
-- update_daily_activity 함수 개선
-- Description: 모든 활동 타입의 카운트를 정확히 업데이트
-- =====================================================

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
        -- 출석 체크
        WHEN 'attendance_check' THEN
            SELECT attendance_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET attendance_count = attendance_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        
        -- 댓글 작성
        WHEN 'comment_post' THEN
            SELECT comment_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET comment_count = comment_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 좋아요
        WHEN 'likes' THEN
            SELECT likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET likes_count = likes_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        
        -- 자유게시판 작성
        WHEN 'freeboard_post' THEN
            SELECT freeboard_post_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET freeboard_post_count = freeboard_post_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        
        -- 스토리 작성
        WHEN 'story_post' THEN
            SELECT story_post_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET story_post_count = story_post_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 팬아트 업로드
        WHEN 'fanart_upload' THEN
            SELECT fanart_upload_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET fanart_upload_count = fanart_upload_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 아이돌 사진 업로드
        WHEN 'idol_photo_upload' THEN
            SELECT idol_photo_upload_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 1;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET idol_photo_upload_count = idol_photo_upload_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 팬아트 좋아요
        WHEN 'fanart_likes' THEN
            SELECT fanart_likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET fanart_likes_count = fanart_likes_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 아이돌 사진 좋아요
        WHEN 'idol_photo_likes' THEN
            SELECT idol_photo_likes_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 10;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET idol_photo_likes_count = idol_photo_likes_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 투표 참여
        WHEN 'poll_vote' THEN
            SELECT poll_vote_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 3;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET poll_vote_count = poll_vote_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 뉴스 댓글
        WHEN 'news_comment' THEN
            SELECT news_comment_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET news_comment_count = news_comment_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        -- 공유
        WHEN 'share' THEN
            SELECT share_count INTO activity_count FROM public.daily_activity WHERE user_id = p_user_id AND date = CURRENT_DATE;
            max_count := 5;
            IF activity_count >= max_count THEN
                RETURN FALSE;
            END IF;
            UPDATE public.daily_activity 
            SET share_count = share_count + 1, total_points = total_points + p_points 
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
            
        ELSE
            -- 인식되지 않은 활동 타입
            RAISE NOTICE '알 수 없는 활동 타입: %', p_type;
            RETURN FALSE;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'update_daily_activity 함수 개선 완료!' as message;


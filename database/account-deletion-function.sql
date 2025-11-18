-- =====================================================
-- 계정 삭제 함수 (Account Deletion Function)
-- Description: 사용자 계정을 완전히 삭제하는 SQL 함수
-- Date: 2025-01-XX
-- =====================================================

-- 계정 삭제 함수 생성 (SECURITY DEFINER로 권한 우회)
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_original_email TEXT;
    v_deletion_timestamp TIMESTAMP WITH TIME ZONE;
    v_anonymized_email TEXT;
    v_failed_operations TEXT[] := ARRAY[]::TEXT[];
    v_result JSONB;
    v_table TEXT;
    v_sql TEXT;
BEGIN
    -- 삭제 타임스탬프 생성
    v_deletion_timestamp := NOW();
    v_anonymized_email := 'deleted_' || p_user_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '@helloamiko.com';
    
    -- 원본 이메일 저장
    SELECT email INTO v_original_email FROM public.users WHERE id = p_user_id;
    
    -- 1. user_id 컬럼을 사용하는 테이블들 삭제
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'public.user_profiles',
            'public.user_preferences',
            'public.user_consents',
            'public.user_notifications',
            'public.user_favorites',
            'public.user_korean_level_results',
            'public.user_quiz_responses',
            'public.user_general_info',
            'public.user_student_info',
            'public.user_auth_status',
            'public.user_roles',
            'public.user_points',
            'public.user_deletion_requests',
            'public.data_deletion_logs',
            'public.point_transactions',
            'public.story_comments',
            'public.video_call_logs',
            'public.access_logs',
            'public.customer_support_records',
            'public.bookings',
            'public.quiz_interactions',
            'public.quiz_responses'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            BEGIN
                v_sql := format('DELETE FROM %s WHERE user_id = $1', v_table);
                EXECUTE v_sql USING p_user_id;
            EXCEPTION WHEN OTHERS THEN
                v_failed_operations := array_append(v_failed_operations, v_table);
            END;
        END IF;
    END LOOP;
    
    -- 2. author_id 컬럼을 사용하는 테이블들 삭제
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'public.posts',
            'public.comments'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            BEGIN
                v_sql := format('DELETE FROM %s WHERE author_id = $1', v_table);
                EXECUTE v_sql USING p_user_id;
            EXCEPTION WHEN OTHERS THEN
                v_failed_operations := array_append(v_failed_operations, v_table);
            END;
        END IF;
    END LOOP;
    
    -- 3. user_id를 익명화하는 테이블들
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'public.point_history',
            'public.post_reactions',
            'public.post_views',
            'public.reactions'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            BEGIN
                v_sql := format('UPDATE %s SET user_id = NULL WHERE user_id = $1', v_table);
                EXECUTE v_sql USING p_user_id;
            EXCEPTION WHEN OTHERS THEN
                v_failed_operations := array_append(v_failed_operations, v_table);
            END;
        END IF;
    END LOOP;
    
    -- 4. 갤러리 게시글/댓글은 삭제 상태로 표시
    IF to_regclass('public.gallery_posts') IS NOT NULL THEN
        BEGIN
            UPDATE public.gallery_posts 
            SET is_deleted = true, deleted_at = v_deletion_timestamp
            WHERE user_id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.gallery_posts');
        END;
    END IF;
    
    IF to_regclass('public.post_comments') IS NOT NULL THEN
        BEGIN
            UPDATE public.post_comments 
            SET is_deleted = true, content = '[삭제된 댓글]'
            WHERE user_id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.post_comments');
        END;
    END IF;
    
    -- 5. users 테이블 익명화
    IF to_regclass('public.users') IS NOT NULL THEN
        BEGIN
            UPDATE public.users
            SET 
                email = v_anonymized_email,
                full_name = NULL,
                spanish_name = NULL,
                korean_name = NULL,
                nickname = NULL,
                phone = NULL,
                phone_country = NULL,
                avatar_url = NULL,
                profile_image = NULL,
                language = NULL,
                is_active = FALSE,
                deleted_at = v_deletion_timestamp,
                updated_at = v_deletion_timestamp
            WHERE id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.users');
        END;
    END IF;
    
    -- 결과 반환
    v_result := jsonb_build_object(
        'success', array_length(v_failed_operations, 1) IS NULL,
        'user_id', p_user_id,
        'original_email', v_original_email,
        'anonymized_email', v_anonymized_email,
        'deleted_at', v_deletion_timestamp,
        'failed_operations', v_failed_operations
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO service_role;

-- 사용 예시 주석
-- SELECT delete_user_account('user-uuid-here');


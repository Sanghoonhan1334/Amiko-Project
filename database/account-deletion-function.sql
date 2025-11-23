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
    v_fk_constraint_name TEXT;
BEGIN
    -- 삭제 타임스탬프 생성
    v_deletion_timestamp := NOW();
    v_anonymized_email := 'deleted_' || p_user_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '@helloamiko.com';
    
    -- 원본 이메일 저장
    SELECT email INTO v_original_email FROM public.users WHERE id = p_user_id;
    
    -- 1. user_id 컬럼을 사용하는 테이블들 삭제 (존재하는 테이블만)
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
            'public.user_points',
            'public.user_deletion_requests',
            'public.data_deletion_logs',
            'public.story_comments',
            'public.bookings'
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
    
    -- 4. 갤러리 게시글/댓글은 삭제 상태로 표시 (SECURITY DEFINER로 RLS 우회)
    -- deleted_at 컬럼이 없을 수 있으므로 is_deleted만 업데이트
    IF to_regclass('public.gallery_posts') IS NOT NULL THEN
        BEGIN
            -- deleted_at 컬럼 존재 여부 확인
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'gallery_posts' 
                AND column_name = 'deleted_at'
            ) THEN
                -- deleted_at 컬럼이 있으면 함께 업데이트
                UPDATE public.gallery_posts 
                SET is_deleted = true, deleted_at = v_deletion_timestamp
                WHERE user_id = p_user_id;
            ELSE
                -- deleted_at 컬럼이 없으면 is_deleted만 업데이트
                UPDATE public.gallery_posts 
                SET is_deleted = true
                WHERE user_id = p_user_id;
            END IF;
            
            -- 업데이트된 행이 없어도 실패로 간주하지 않음
            IF NOT FOUND THEN
                RAISE NOTICE '[ACCOUNT_DELETE_SQL] gallery_posts에 해당 사용자 데이터 없음 (ID: %)', p_user_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.gallery_posts');
            RAISE WARNING '[ACCOUNT_DELETE_SQL] gallery_posts 업데이트 실패 (ID: %): %', p_user_id, SQLERRM;
        END;
    END IF;
    
    IF to_regclass('public.post_comments') IS NOT NULL THEN
        BEGIN
            UPDATE public.post_comments 
            SET is_deleted = true, content = '[삭제된 댓글]'
            WHERE user_id = p_user_id;
            
            IF NOT FOUND THEN
                RAISE NOTICE '[ACCOUNT_DELETE_SQL] post_comments에 해당 사용자 데이터 없음 (ID: %)', p_user_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.post_comments');
            RAISE WARNING '[ACCOUNT_DELETE_SQL] post_comments 업데이트 실패 (ID: %): %', p_user_id, SQLERRM;
        END;
    END IF;
    
    -- 5. users 테이블 익명화 후 삭제 (SECURITY DEFINER로 RLS 우회)
    -- 주의: public.users는 auth.users를 참조하는 외래 키가 있으므로,
    -- session_replication_role을 사용하여 외래 키 제약 조건을 완전히 비활성화
    IF to_regclass('public.users') IS NOT NULL THEN
        BEGIN
            -- 외래 키 제약 조건을 완전히 비활성화 (clear-all-users.sql 방식)
            -- 이렇게 하면 auth.users 삭제 전에 public.users를 안전하게 삭제할 수 있음
            PERFORM set_config('session_replication_role', 'replica', true);
            RAISE NOTICE '[ACCOUNT_DELETE_SQL] session_replication_role을 replica로 설정하여 외래 키 제약 조건 비활성화';
            
            -- 먼저 익명화
            UPDATE public.users
            SET 
                email = v_anonymized_email,
                full_name = NULL,
                spanish_name = NULL,
                korean_name = NULL,
                nickname = COALESCE(NULLIF(nickname, ''), 'deleted_user'), -- NOT NULL 제약 조건을 위해 기본값 사용
                phone = NULL,
                phone_country = NULL,
                avatar_url = NULL,
                profile_image = NULL,
                language = NULL,
                is_active = FALSE,
                deleted_at = v_deletion_timestamp,
                updated_at = v_deletion_timestamp
            WHERE id = p_user_id;
            
            IF NOT FOUND THEN
                v_failed_operations := array_append(v_failed_operations, 'public.users_not_found');
                RAISE WARNING '[ACCOUNT_DELETE_SQL] users 테이블에서 사용자를 찾을 수 없음 (ID: %)', p_user_id;
            ELSE
                RAISE NOTICE '[ACCOUNT_DELETE_SQL] users 테이블 익명화 성공 (ID: %)', p_user_id;
                
                -- 익명화 성공 후 삭제 (auth.users 삭제 전에)
                -- session_replication_role = replica로 설정했으므로 외래 키 제약 조건이 비활성화됨
                DELETE FROM public.users WHERE id = p_user_id;
                
                RAISE NOTICE '[ACCOUNT_DELETE_SQL] public.users 삭제 성공 (ID: %). session_replication_role = replica로 외래 키 제약 조건이 비활성화되어 있음.', p_user_id;
            END IF;
            
            -- session_replication_role을 원래대로 복구 (하지만 auth.users 삭제를 위해 유지하지 않음)
            -- 주의: auth.users 삭제를 위해 session_replication_role을 유지하지 않음
            -- API에서 auth.users 삭제가 성공한 후 필요시 수동으로 복구해야 함
            -- PERFORM set_config('session_replication_role', 'default', true);
        EXCEPTION WHEN OTHERS THEN
            v_failed_operations := array_append(v_failed_operations, 'public.users');
            RAISE WARNING '[ACCOUNT_DELETE_SQL] users 테이블 처리 실패 (ID: %): %', p_user_id, SQLERRM;
            -- 에러 발생 시에도 session_replication_role 복구 시도
            BEGIN
                PERFORM set_config('session_replication_role', 'default', true);
            EXCEPTION WHEN OTHERS THEN
                -- 복구 실패는 무시
            END;
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


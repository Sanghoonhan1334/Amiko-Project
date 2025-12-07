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
    v_row_count INTEGER;
    v_user_exists BOOLEAN;
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
                
                -- 삭제된 행 수 확인
                GET DIAGNOSTICS v_row_count = ROW_COUNT;
                
                IF v_row_count > 0 THEN
                    RAISE NOTICE '[ACCOUNT_DELETE_SQL] public.users 삭제 성공 (ID: %, 삭제된 행 수: %). session_replication_role = replica로 외래 키 제약 조건이 비활성화되어 있음.', p_user_id, v_row_count;
                ELSE
                    RAISE WARNING '[ACCOUNT_DELETE_SQL] public.users 삭제: 삭제된 행이 없음 (ID: %) - 이미 삭제되었거나 존재하지 않음', p_user_id;
                    -- 이미 삭제된 경우는 실패로 간주하지 않음
                END IF;
            END IF;
            
            -- session_replication_role을 원래대로 복구 (하지만 auth.users 삭제를 위해 유지하지 않음)
            -- 주의: auth.users 삭제를 위해 session_replication_role을 유지하지 않음
            -- API에서 auth.users 삭제가 성공한 후 필요시 수동으로 복구해야 함
            -- PERFORM set_config('session_replication_role', 'default', true);
        EXCEPTION WHEN OTHERS THEN
            -- 예외 발생 후에 삭제가 실제로 성공했는지 확인
            BEGIN
                SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) INTO v_user_exists;
                
                IF NOT v_user_exists THEN
                    -- 사용자가 존재하지 않으면 삭제가 성공한 것으로 간주
                    RAISE NOTICE '[ACCOUNT_DELETE_SQL] 예외 발생했지만 public.users가 삭제되었음 (ID: %)', p_user_id;
                ELSE
                    -- 사용자가 여전히 존재하면 삭제 실패
                    v_failed_operations := array_append(v_failed_operations, 'public.users');
                    RAISE WARNING '[ACCOUNT_DELETE_SQL] users 테이블 처리 실패 (ID: %): %', p_user_id, SQLERRM;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- 확인 자체가 실패하면 실패로 간주
                v_failed_operations := array_append(v_failed_operations, 'public.users');
                RAISE WARNING '[ACCOUNT_DELETE_SQL] users 테이블 처리 실패 (ID: %), 확인 중 오류: %', p_user_id, SQLERRM;
            END;
            
            -- 에러 발생 시에도 session_replication_role 복구 시도
            BEGIN
                PERFORM set_config('session_replication_role', 'default', true);
            EXCEPTION WHEN OTHERS THEN
                -- 복구 실패는 무시
            END;
        END;
    END IF;
    
    -- 6. auth.users 직접 삭제 시도 (SECURITY DEFINER로 권한 우회)
    -- 주의: Supabase는 일반적으로 auth.users를 직접 삭제하는 것을 권장하지 않지만,
    -- API에서 계속 실패하는 경우를 대비하여 SQL에서 직접 시도
    -- session_replication_role = replica로 설정되어 있으므로 외래 키 제약 조건이 비활성화됨
    -- 주의: auth.users는 Supabase의 내부 스키마이므로 직접 삭제가 제한될 수 있음
    -- API에서 처리하도록 하고, SQL 함수에서는 시도하지 않음
    BEGIN
        -- auth.users 삭제는 API에서 처리하도록 함 (Supabase Auth Admin API 사용)
        -- SQL 함수에서는 직접 삭제하지 않고 API에서 처리하도록 표시
        RAISE NOTICE '[ACCOUNT_DELETE_SQL] auth.users 삭제는 API에서 처리해야 함 (SQL에서는 권한 제한)';
        -- SQL 함수에서는 auth.users 삭제를 시도하지 않음
        -- API에서 supabaseServer.auth.admin.deleteUser()를 사용해야 함
    EXCEPTION WHEN OTHERS THEN
        -- 예외 발생 시 로그만 기록
        RAISE WARNING '[ACCOUNT_DELETE_SQL] 예외 발생: %', SQLERRM;
    END;
    
    -- session_replication_role을 원래대로 복구
    BEGIN
        PERFORM set_config('session_replication_role', 'default', true);
        RAISE NOTICE '[ACCOUNT_DELETE_SQL] session_replication_role을 default로 복구';
    EXCEPTION WHEN OTHERS THEN
        -- 복구 실패는 무시
        RAISE WARNING '[ACCOUNT_DELETE_SQL] session_replication_role 복구 실패: %', SQLERRM;
    END;
    
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

-- =====================================================
-- auth.users 직접 삭제 함수 (SECURITY DEFINER)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_auth_user_directly(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_deleted BOOLEAN := false;
    v_row_count INTEGER;
    v_error_message TEXT;
BEGIN
    RAISE NOTICE '[DELETE_AUTH_USER] auth.users 직접 삭제 시도 (ID: %)', p_user_id;
    
    -- session_replication_role을 replica로 설정하여 외래 키 제약 조건 비활성화
    BEGIN
        PERFORM set_config('session_replication_role', 'replica', true);
        RAISE NOTICE '[DELETE_AUTH_USER] session_replication_role을 replica로 설정';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[DELETE_AUTH_USER] session_replication_role 설정 실패: %', SQLERRM;
    END;
    
    -- auth.users 직접 삭제 시도
    BEGIN
        DELETE FROM auth.users WHERE id = p_user_id;
        
        -- 삭제된 행 수 확인
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        
        IF v_row_count > 0 THEN
            v_deleted := true;
            RAISE NOTICE '[DELETE_AUTH_USER] auth.users 삭제 성공 (ID: %, 삭제된 행 수: %)', p_user_id, v_row_count;
        ELSE
            RAISE WARNING '[DELETE_AUTH_USER] auth.users에서 사용자를 찾을 수 없음 (ID: %)', p_user_id;
            -- 이미 삭제된 경우는 성공으로 간주
            v_deleted := true;
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        v_error_message := '권한 부족으로 auth.users 삭제 실패';
        RAISE WARNING '[DELETE_AUTH_USER] % (ID: %)', v_error_message, p_user_id;
        v_deleted := false;
    WHEN OTHERS THEN
        v_error_message := SQLERRM;
        RAISE WARNING '[DELETE_AUTH_USER] auth.users 삭제 실패 (ID: %): %', p_user_id, v_error_message;
        v_deleted := false;
    END;
    
    -- session_replication_role 복구
    BEGIN
        PERFORM set_config('session_replication_role', 'default', true);
        RAISE NOTICE '[DELETE_AUTH_USER] session_replication_role을 default로 복구';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[DELETE_AUTH_USER] session_replication_role 복구 실패: %', SQLERRM;
    END;
    
    -- 결과 반환
    v_result := jsonb_build_object(
        'success', v_deleted,
        'user_id', p_user_id,
        'deleted', v_deleted
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION delete_auth_user_directly(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user_directly(UUID) TO service_role;

-- 사용 예시 주석
-- SELECT delete_user_account('user-uuid-here');
-- SELECT delete_auth_user_directly('user-uuid-here');


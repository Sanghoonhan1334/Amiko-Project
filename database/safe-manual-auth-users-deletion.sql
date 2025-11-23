-- =====================================================
-- 안전한 수동 auth.users 삭제 스크립트
-- Description: 진단 후 안전하게 auth.users를 삭제하는 스크립트
-- ⚠️ 주의: 이 스크립트를 실행하기 전에 반드시 diagnose-auth-users-deletion.sql을 먼저 실행하세요!
-- =====================================================

-- 사용자 ID를 여기에 입력하세요
DO $$
DECLARE
    v_user_id UUID := '6ea93c19-81ba-4f9f-a848-325c5418cbba'; -- ⚠️ 여기에 삭제하려는 사용자 ID 입력
    v_fk_constraint_name TEXT;
    v_table_name TEXT;
    v_column_name TEXT;
    v_count INTEGER;
    v_safe_to_delete BOOLEAN := true;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '안전한 auth.users 삭제 프로세스 시작';
    RAISE NOTICE '사용자 ID: %', v_user_id;
    RAISE NOTICE '========================================';
    
    -- 1. public.users에 데이터가 있는지 확인 및 삭제
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE id = v_user_id;
    
    IF v_count > 0 THEN
        RAISE NOTICE '⚠️  public.users에 데이터가 있습니다. 삭제 중...';
        
        -- 외래 키 제약 조건이 없으므로 바로 삭제 가능
        BEGIN
            DELETE FROM public.users WHERE id = v_user_id;
            RAISE NOTICE '✅ public.users 삭제 완료';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ public.users 삭제 실패: %', SQLERRM;
            v_safe_to_delete := false;
        END;
    ELSE
        RAISE NOTICE '✅ public.users에 데이터 없음';
    END IF;
    
    -- 2. public.users의 외래 키 제약 조건 확인 및 제거
    SELECT tc.constraint_name INTO v_fk_constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'users'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
    LIMIT 1;
    
    IF v_fk_constraint_name IS NOT NULL THEN
        RAISE NOTICE '⚠️  외래 키 제약 조건 발견: %', v_fk_constraint_name;
        RAISE NOTICE '외래 키 제약 조건 제거 중...';
        
        BEGIN
            EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', v_fk_constraint_name);
            RAISE NOTICE '✅ 외래 키 제약 조건 제거 완료';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ 외래 키 제약 조건 제거 실패: %', SQLERRM;
            v_safe_to_delete := false;
        END;
    ELSE
        RAISE NOTICE '✅ 외래 키 제약 조건 없음';
    END IF;
    
    -- 3. auth.users를 참조하는 다른 테이블 확인
    RAISE NOTICE '========================================';
    RAISE NOTICE 'auth.users를 참조하는 다른 테이블 확인 중...';
    RAISE NOTICE '========================================';
    
    FOR v_table_name, v_column_name IN
        SELECT DISTINCT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
          AND tc.table_schema = 'public'
          AND tc.table_name != 'users' -- public.users는 이미 확인했으므로 제외
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE %I = $1', v_table_name, v_column_name)
            INTO v_count
            USING v_user_id;
            
            IF v_count > 0 THEN
                RAISE WARNING '⚠️  public.%에 % 행이 남아있습니다 (컬럼: %)', v_table_name, v_count, v_column_name;
                -- ON DELETE CASCADE가 설정되어 있으면 자동으로 삭제되지만, 확인은 필요
            ELSE
                RAISE NOTICE '✅ public.%: 데이터 없음', v_table_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️  public.% 조회 실패 (테이블이 없을 수 있음): %', v_table_name, SQLERRM;
        END;
    END LOOP;
    
    -- 4. 최종 확인 및 auth.users 삭제 시도
    RAISE NOTICE '========================================';
    
    -- public.users 최종 확인
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE id = v_user_id;
    
    IF v_count > 0 THEN
        RAISE WARNING '❌ public.users에 여전히 데이터가 있습니다.';
        v_safe_to_delete := false;
    END IF;
    
    IF v_safe_to_delete THEN
        RAISE NOTICE '✅ 모든 준비가 완료되었습니다.';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  auth.users 삭제를 시도합니다...';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  다음 명령어를 실행하여 auth.users를 삭제하세요:';
        RAISE NOTICE 'DELETE FROM auth.users WHERE id = ''%'';', v_user_id;
        RAISE NOTICE '';
        RAISE NOTICE '또는 Supabase 대시보드 > Authentication > Users에서 수동으로 삭제하세요.';
    ELSE
        RAISE WARNING '❌ 안전하게 삭제할 수 없습니다.';
        RAISE WARNING '위의 경고를 확인하고 문제를 해결한 후 다시 시도하세요.';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 실제 삭제 명령어 (위의 스크립트가 안전하다고 확인한 후 실행)
-- =====================================================

-- ⚠️ 주의: 이 명령어는 실제로 auth.users를 삭제합니다!
-- 사용자 ID를 변경해서 실행하세요
-- DELETE FROM auth.users WHERE id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';

-- =====================================================
-- 삭제 후 외래 키 제약 조건 복구 (선택사항)
-- =====================================================

-- public.users의 외래 키 제약 조건을 다시 생성하려면:
-- ALTER TABLE public.users 
-- ADD CONSTRAINT users_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id);


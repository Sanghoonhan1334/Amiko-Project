-- =====================================================
-- 삭제 상태 확인 스크립트
-- Description: public.users와 auth.users 삭제 상태 확인
-- =====================================================

-- 사용자 ID를 여기에 입력하세요
DO $$
DECLARE
    v_user_id UUID := '6ea93c19-81ba-4f9f-a848-325c5418cbba'; -- ⚠️ 여기에 확인하려는 사용자 ID 입력
    v_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '삭제 상태 확인';
    RAISE NOTICE '사용자 ID: %', v_user_id;
    RAISE NOTICE '========================================';
    
    -- 1. public.users 확인
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE id = v_user_id;
    
    IF v_count > 0 THEN
        RAISE WARNING '❌ public.users에 데이터가 여전히 존재합니다 (% 행)', v_count;
    ELSE
        RAISE NOTICE '✅ public.users에 데이터 없음 (삭제 완료)';
    END IF;
    
    -- 2. auth.users 확인
    SELECT COUNT(*) INTO v_count
    FROM auth.users
    WHERE id = v_user_id;
    
    IF v_count > 0 THEN
        RAISE WARNING '⚠️  auth.users에 데이터가 여전히 존재합니다 (% 행)', v_count;
        RAISE NOTICE '';
        RAISE NOTICE '다음 명령어로 auth.users를 삭제하세요:';
        RAISE NOTICE 'DELETE FROM auth.users WHERE id = ''%'';', v_user_id;
    ELSE
        RAISE NOTICE '✅ auth.users에 데이터 없음 (삭제 완료)';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 간단한 확인 쿼리 (위의 DO 블록 대신 사용 가능)
-- =====================================================

-- public.users 확인
SELECT 
    'public.users' as table_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ 데이터 존재'
        ELSE '✅ 데이터 없음'
    END as status
FROM public.users
WHERE id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'; -- 여기에 사용자 ID 입력

-- auth.users 확인 (Supabase에서는 직접 조회가 제한될 수 있음)
-- 대신 Supabase 대시보드에서 확인하거나 다음 명령어 사용:
-- SELECT COUNT(*) FROM auth.users WHERE id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';


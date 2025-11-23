-- =====================================================
-- auth.users 삭제 문제 진단 스크립트
-- Description: auth.users 삭제를 방해하는 모든 제약 조건과 참조 확인
-- Usage: Supabase SQL Editor에서 실행하여 문제 진단
-- =====================================================

-- 1. public.users가 auth.users를 참조하는 외래 키 제약 조건 확인
SELECT 
    '1. public.users 외래 키 제약 조건' as check_type,
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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
  AND ccu.column_name = 'id';

-- 2. auth.users를 참조하는 모든 테이블 찾기 (public 스키마)
SELECT 
    '2. auth.users를 참조하는 모든 테이블' as check_type,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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
ORDER BY tc.table_schema, tc.table_name;

-- 3. 특정 사용자 ID로 참조하는 데이터 확인 (예: '6ea93c19-81ba-4f9f-a848-325c5418cbba')
-- 사용자 ID를 변경해서 실행하세요
DO $$
DECLARE
    v_user_id UUID := '6ea93c19-81ba-4f9f-a848-325c5418cbba'; -- 여기에 삭제하려는 사용자 ID 입력
    v_table_name TEXT;
    v_column_name TEXT;
    v_count INTEGER;
    v_result TEXT := '';
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '사용자 ID: %', v_user_id;
    RAISE NOTICE '========================================';
    
    -- public.users 확인
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE id = v_user_id;
    
    RAISE NOTICE 'public.users: % 행', v_count;
    
    -- auth.users 확인
    SELECT COUNT(*) INTO v_count
    FROM auth.users
    WHERE id = v_user_id;
    
    RAISE NOTICE 'auth.users: % 행', v_count;
    
    -- auth.users를 참조하는 모든 테이블에서 해당 사용자 데이터 확인
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
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE %I = $1', v_table_name, v_column_name)
            INTO v_count
            USING v_user_id;
            
            IF v_count > 0 THEN
                RAISE NOTICE '⚠️  public.%: % 행 (컬럼: %)', v_table_name, v_count, v_column_name;
                v_result := v_result || format('public.%s: %s 행, ', v_table_name, v_count);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ public.% 조회 실패: %', v_table_name, SQLERRM;
        END;
    END LOOP;
    
    IF v_result = '' THEN
        RAISE NOTICE '✅ auth.users를 참조하는 데이터가 없습니다.';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️  다음 테이블에 데이터가 남아있습니다:';
        RAISE NOTICE '%', v_result;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- 4. public.users 테이블의 외래 키 제약 조건 상태 확인
SELECT 
    '4. public.users 외래 키 제약 조건 상태' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND contype = 'f'
ORDER BY conname;

-- 5. auth.users를 참조하는 모든 제약 조건의 ON DELETE 동작 확인
SELECT 
    '5. 외래 키 제약 조건의 ON DELETE 동작' as check_type,
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN 'CASCADE (자동 삭제)'
        WHEN rc.delete_rule = 'SET NULL' THEN 'SET NULL (NULL로 설정)'
        WHEN rc.delete_rule = 'RESTRICT' THEN 'RESTRICT (삭제 방지)'
        WHEN rc.delete_rule = 'NO ACTION' THEN 'NO ACTION (삭제 방지)'
        ELSE rc.delete_rule
    END as delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
  AND ccu.column_name = 'id'
ORDER BY tc.table_schema, tc.table_name;

-- 6. 안전한 수동 삭제를 위한 체크리스트
SELECT 
    '6. 안전한 삭제 체크리스트' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.users WHERE id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
        ) THEN '❌ public.users에 데이터 존재'
        ELSE '✅ public.users에 데이터 없음'
    END as public_users_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
              AND table_name = 'users' 
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name IN (
                  SELECT constraint_name 
                  FROM information_schema.constraint_column_usage
                  WHERE table_schema = 'auth' AND table_name = 'users'
              )
        ) THEN '❌ 외래 키 제약 조건 존재'
        ELSE '✅ 외래 키 제약 조건 없음'
    END as fk_constraint_check;


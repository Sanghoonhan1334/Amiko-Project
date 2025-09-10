-- =====================================================
-- 업데이트 시간 자동 갱신 함수 (Update Functions)
-- Description: updated_at 필드 자동 갱신을 위한 함수들
-- Date: 2024-12-19
-- =====================================================

-- 1. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 생성 시간 자동 설정 함수 (필요시)
CREATE OR REPLACE FUNCTION set_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. 업데이트 시간 갱신 함수 (수동 호출용)
CREATE OR REPLACE FUNCTION update_table_updated_at(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    sql_query TEXT;
BEGIN
    -- 테이블명 검증 (보안을 위해 허용된 테이블만)
    IF table_name NOT IN (
        'users', 'consultants', 'bookings', 'payments', 
        'notifications', 'notification_settings', 'reviews', 
        'coupons', 'coupon_usage'
    ) THEN
        RAISE EXCEPTION '허용되지 않은 테이블입니다: %', table_name;
    END IF;
    
    -- 업데이트 쿼리 실행
    sql_query := format('UPDATE public.%I SET updated_at = NOW() WHERE updated_at IS NULL', table_name);
    EXECUTE sql_query;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 모든 테이블의 updated_at 일괄 갱신 함수
CREATE OR REPLACE FUNCTION update_all_updated_at_columns()
RETURNS TABLE (
    table_name TEXT,
    updated_rows INTEGER
) AS $$
DECLARE
    table_record RECORD;
    sql_query TEXT;
    row_count INTEGER;
BEGIN
    -- 모든 테이블에 대해 updated_at 갱신
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'consultants', 'bookings', 'payments', 
            'notifications', 'notification_settings', 'reviews', 
            'coupons', 'coupon_usage'
        )
    LOOP
        sql_query := format(
            'UPDATE public.%I SET updated_at = NOW() WHERE updated_at IS NULL',
            table_record.table_name
        );
        EXECUTE sql_query;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        
        table_name := table_record.table_name;
        updated_rows := row_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 테이블별 updated_at 컬럼 존재 여부 확인 함수
CREATE OR REPLACE FUNCTION check_updated_at_columns()
RETURNS TABLE (
    table_name TEXT,
    has_updated_at BOOLEAN,
    column_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        CASE WHEN c.column_name IS NOT NULL THEN true ELSE false END as has_updated_at,
        c.data_type::TEXT
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND c.column_name = 'updated_at'
        AND t.table_schema = 'public'
    WHERE t.table_schema = 'public'
        AND t.table_name IN (
            'users', 'consultants', 'bookings', 'payments', 
            'notifications', 'notification_settings', 'reviews', 
            'coupons', 'coupon_usage'
        )
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 트리거 생성 함수 (자동화)
CREATE OR REPLACE FUNCTION create_update_triggers_for_table(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    trigger_name TEXT;
    sql_query TEXT;
BEGIN
    -- 테이블명 검증
    IF table_name NOT IN (
        'users', 'consultants', 'bookings', 'payments', 
        'notifications', 'notification_settings', 'reviews', 
        'coupons', 'coupon_usage'
    ) THEN
        RAISE EXCEPTION '허용되지 않은 테이블입니다: %', table_name;
    END IF;
    
    -- 트리거명 생성
    trigger_name := 'update_' || table_name || '_updated_at';
    
    -- 트리거 생성 쿼리
    sql_query := format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        trigger_name, table_name
    );
    
    -- 트리거 생성
    EXECUTE sql_query;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 모든 테이블에 트리거 생성 함수
CREATE OR REPLACE FUNCTION create_all_update_triggers()
RETURNS TABLE (
    table_name TEXT,
    trigger_created BOOLEAN,
    trigger_name TEXT
) AS $$
DECLARE
    table_record RECORD;
    trigger_name TEXT;
    sql_query TEXT;
BEGIN
    -- 모든 테이블에 대해 트리거 생성
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'consultants', 'bookings', 'payments', 
            'notifications', 'notification_settings', 'reviews', 
            'coupons', 'coupon_usage'
        )
    LOOP
        trigger_name := 'update_' || table_record.table_name || '_updated_at';
        
        -- 트리거가 이미 존재하는지 확인
        IF EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = trigger_name 
            AND event_object_table = table_record.table_name
        ) THEN
            table_name := table_record.table_name;
            trigger_created := false;
            trigger_name := trigger_name;
            RETURN NEXT;
        ELSE
            -- 트리거 생성
            sql_query := format(
                'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                trigger_name, table_record.table_name
            );
            EXECUTE sql_query;
            
            table_name := table_record.table_name;
            trigger_created := true;
            trigger_name := trigger_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 트리거 상태 확인 함수
CREATE OR REPLACE FUNCTION check_update_triggers()
RETURNS TABLE (
    table_name TEXT,
    trigger_name TEXT,
    trigger_exists BOOLEAN,
    trigger_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        ('update_' || t.table_name || '_updated_at')::TEXT as trigger_name,
        CASE WHEN tr.trigger_name IS NOT NULL THEN true ELSE false END as trigger_exists,
        CASE WHEN tr.trigger_name IS NOT NULL THEN true ELSE false END as trigger_enabled
    FROM information_schema.tables t
    LEFT JOIN information_schema.triggers tr 
        ON t.table_name = tr.event_object_table 
        AND tr.trigger_name = 'update_' || t.table_name || '_updated_at'
    WHERE t.table_schema = 'public'
        AND t.table_name IN (
            'users', 'consultants', 'bookings', 'payments', 
            'notifications', 'notification_settings', 'reviews', 
            'coupons', 'coupon_usage'
        )
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 업데이트 통계 조회 함수
CREATE OR REPLACE FUNCTION get_update_statistics()
RETURNS TABLE (
    table_name TEXT,
    total_rows BIGINT,
    rows_with_updated_at BIGINT,
    rows_without_updated_at BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    table_record RECORD;
    sql_query TEXT;
    total_count BIGINT;
    updated_count BIGINT;
    last_update TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 모든 테이블에 대해 통계 조회
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'users', 'consultants', 'bookings', 'payments', 
            'notifications', 'notification_settings', 'reviews', 
            'coupons', 'coupon_usage'
        )
    LOOP
        -- 총 행 수 조회
        sql_query := format('SELECT COUNT(*) FROM public.%I', table_record.table_name);
        EXECUTE sql_query INTO total_count;
        
        -- updated_at이 있는 행 수 조회
        sql_query := format('SELECT COUNT(*) FROM public.%I WHERE updated_at IS NOT NULL', table_record.table_name);
        EXECUTE sql_query INTO updated_count;
        
        -- 마지막 업데이트 시간 조회
        sql_query := format('SELECT MAX(updated_at) FROM public.%I', table_record.table_name);
        EXECUTE sql_query INTO last_update;
        
        table_name := table_record.table_name;
        total_rows := total_count;
        rows_with_updated_at := updated_count;
        rows_without_updated_at := total_count - updated_count;
        last_updated := last_update;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 자동 트리거 생성 (모든 테이블에 적용)
-- 이미 각 테이블 파일에 포함되어 있지만 여기서도 확인
SELECT create_all_update_triggers();

-- =====================================================
-- 추가 설명
-- =====================================================

/*
업데이트 시간 자동 갱신 함수 설명:

1. update_updated_at_column():
   - 트리거에서 사용되는 핵심 함수
   - UPDATE 시 updated_at 필드를 현재 시간으로 설정

2. set_created_at_column():
   - INSERT 시 created_at 필드를 현재 시간으로 설정
   - 필요시 사용할 수 있는 함수

3. update_table_updated_at():
   - 특정 테이블의 updated_at 필드를 수동으로 갱신
   - 보안을 위해 허용된 테이블만 처리

4. update_all_updated_at_columns():
   - 모든 테이블의 updated_at 필드를 일괄 갱신
   - NULL 값인 경우에만 갱신

5. check_updated_at_columns():
   - 각 테이블의 updated_at 컬럼 존재 여부 확인
   - 컬럼 타입도 함께 조회

6. create_update_triggers_for_table():
   - 특정 테이블에 업데이트 트리거 생성
   - 자동화를 위한 함수

7. create_all_update_triggers():
   - 모든 테이블에 업데이트 트리거 생성
   - 이미 존재하는 트리거는 건너뜀

8. check_update_triggers():
   - 각 테이블의 트리거 상태 확인
   - 트리거 존재 여부와 활성화 상태 조회

9. get_update_statistics():
   - 각 테이블의 업데이트 통계 조회
   - 총 행 수, updated_at 필드 상태 등

사용 방법:
- 각 테이블 파일에서 이미 트리거가 설정되어 있음
- 필요시 수동으로 함수 호출 가능
- 통계 조회로 상태 모니터링 가능
*/

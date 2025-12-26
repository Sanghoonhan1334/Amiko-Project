-- verification_codes 테이블의 type 컬럼 check constraint 수정
-- 'wa' (WhatsApp) 타입 추가

-- 1. 기존 constraint 제거
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_codes_type_check'
    ) THEN
        ALTER TABLE verification_codes 
        DROP CONSTRAINT verification_codes_type_check;
        RAISE NOTICE '기존 verification_codes_type_check constraint 제거됨';
    ELSE
        RAISE NOTICE 'verification_codes_type_check constraint가 존재하지 않음';
    END IF;
END $$;

-- 2. 새로운 constraint 추가 (email, sms, wa 포함)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_codes_type_check'
    ) THEN
        ALTER TABLE verification_codes 
        ADD CONSTRAINT verification_codes_type_check 
        CHECK (type IN ('email', 'sms', 'wa'));
        RAISE NOTICE '새로운 verification_codes_type_check constraint 추가됨 (email, sms, wa)';
    ELSE
        RAISE NOTICE 'verification_codes_type_check constraint가 이미 존재함';
    END IF;
END $$;

-- 3. 결과 확인
SELECT 
    'verification_codes' as table_name,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'verification_codes' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'verification_codes_type_check';


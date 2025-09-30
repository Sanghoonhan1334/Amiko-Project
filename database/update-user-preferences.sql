-- user_preferences 테이블 업데이트
-- 기존 테이블이 있으므로 필요한 컬럼만 추가

-- 기존 테이블 구조 확인 후 필요한 컬럼 추가
DO $$ 
BEGIN
    -- notification_whatsapp 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'notification_whatsapp'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN notification_whatsapp BOOLEAN DEFAULT false;
    END IF;
    
    -- privacy_level 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'privacy_level'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN privacy_level VARCHAR(20) DEFAULT 'standard';
    END IF;
    
    -- updated_at 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

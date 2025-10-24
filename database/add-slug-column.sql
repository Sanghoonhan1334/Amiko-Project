-- 슬러그 컬럼 추가 (없는 경우에만)
DO $$
BEGIN
    -- slug 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN slug VARCHAR(255);
        
        -- 기존 데이터에 슬러그 설정
        UPDATE quizzes 
        SET slug = CASE 
            WHEN id = 'dea20361-fd46-409d-880f-f91869c1d184' THEN 'idol-position-old'
            WHEN id = '268caf0b-0031-4e58-9245-606e3421f1fd' THEN 'mbti-kpop'
            ELSE 'quiz-' || substring(id::text, 1, 8)
        END
        WHERE slug IS NULL;
        
        -- slug 컬럼에 NOT NULL 제약 조건 추가
        ALTER TABLE quizzes ALTER COLUMN slug SET NOT NULL;
        
        -- slug에 대한 유니크 인덱스 생성
        CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_slug_unique ON quizzes(slug);
        
        RAISE NOTICE 'SUCCESS: Added slug column and set existing data';
    ELSE
        RAISE NOTICE 'INFO: slug column already exists';
    END IF;
END $$;

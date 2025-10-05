-- gallery_posts 테이블에 category 컬럼 추가

-- 1. category 컬럼 추가 (이미 있으면 에러 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gallery_posts' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE gallery_posts ADD COLUMN category VARCHAR(50) DEFAULT '자유게시판';
        RAISE NOTICE 'category 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'category 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2. 기존 게시글들의 category를 기본값으로 설정
UPDATE gallery_posts SET category = '자유게시판' WHERE category IS NULL;

-- 3. category 컬럼을 NOT NULL로 변경
ALTER TABLE gallery_posts ALTER COLUMN category SET NOT NULL;

-- 4. category 컬럼에 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_gallery_posts_category ON gallery_posts(category);

-- 5. 현재 gallery_posts 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'gallery_posts' 
ORDER BY ordinal_position;

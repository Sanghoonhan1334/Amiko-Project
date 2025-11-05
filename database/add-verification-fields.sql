-- 사용자 인증 및 언어 수준 필드 추가
-- 인증 완료 후에도 "인증 필요" 알림이 표시되는 문제 해결

-- 1. 먼저 컬럼이 이미 존재하는지 확인
DO $$ 
BEGIN
  -- is_verified 컬럼 추가 (인증 완료 여부)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN users.is_verified IS '인증 완료 여부 (인증센터에서 설정)';
  END IF;

  -- verification_completed 컬럼 추가 (인증 프로세스 완료 플래그)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verification_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_completed BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN users.verification_completed IS '인증 프로세스 완료 플래그';
  END IF;

  -- korean_level 컬럼 추가 (한국어 수준)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'korean_level'
  ) THEN
    ALTER TABLE users ADD COLUMN korean_level VARCHAR(20);
    COMMENT ON COLUMN users.korean_level IS '한국어 수준 (beginner, intermediate, advanced, native)';
  END IF;

  -- spanish_level 컬럼 추가 (스페인어 수준)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'spanish_level'
  ) THEN
    ALTER TABLE users ADD COLUMN spanish_level VARCHAR(20);
    COMMENT ON COLUMN users.spanish_level IS '스페인어 수준 (beginner, intermediate, advanced, native)';
  END IF;

  -- english_level 컬럼 추가 (영어 수준)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'english_level'
  ) THEN
    ALTER TABLE users ADD COLUMN english_level VARCHAR(20) DEFAULT 'none';
    COMMENT ON COLUMN users.english_level IS '영어 수준 (none, beginner, intermediate, advanced, native)';
  END IF;
END $$;

-- 2. 기존 사용자 중 프로필이 완성된 사용자는 자동으로 인증 완료 처리
UPDATE users 
SET 
  is_verified = TRUE,
  verification_completed = TRUE
WHERE 
  is_verified IS NOT TRUE AND  -- 아직 인증되지 않은 사용자만
  (
    -- 한국인: korean_name과 nickname이 있으면 인증 완료로 간주
    (korean_name IS NOT NULL AND korean_name != '' AND nickname IS NOT NULL AND nickname != '') OR
    -- 현지인: spanish_name과 nickname이 있으면 인증 완료로 간주
    (spanish_name IS NOT NULL AND spanish_name != '' AND nickname IS NOT NULL AND nickname != '') OR
    -- 기타: full_name과 phone/university가 있으면 인증 완료로 간주
    (full_name IS NOT NULL AND full_name != '' AND (
      (phone IS NOT NULL AND phone != '') OR 
      (university IS NOT NULL AND university != '' AND major IS NOT NULL AND major != '')
    ))
  );

-- 3. 인증 관련 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_verification 
ON users(is_verified, verification_completed) 
WHERE is_verified = TRUE OR verification_completed = TRUE;

-- 4. 언어 수준 필드에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_language_levels 
ON users(korean_level, spanish_level, english_level);

-- 5. 확인 쿼리
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN (
    'is_verified', 
    'verification_completed', 
    'korean_level', 
    'spanish_level', 
    'english_level'
  )
ORDER BY column_name;

-- 6. 통계 확인
SELECT 
  COUNT(*) FILTER (WHERE is_verified = TRUE) AS verified_count,
  COUNT(*) FILTER (WHERE verification_completed = TRUE) AS completed_count,
  COUNT(*) FILTER (WHERE korean_level IS NOT NULL) AS with_korean_level,
  COUNT(*) FILTER (WHERE spanish_level IS NOT NULL) AS with_spanish_level,
  COUNT(*) AS total_users
FROM users;


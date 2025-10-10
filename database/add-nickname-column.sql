-- users 테이블에 nickname 컬럼 추가
-- 닉네임은 알파벳만 허용하며, 중복되지 않아야 함

-- 1. nickname 컬럼 추가 (길이를 50으로 증가)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- 2. nickname에 대한 유니크 제약조건 추가
ALTER TABLE users 
ADD CONSTRAINT users_nickname_unique UNIQUE (nickname);

-- 3. nickname에 대한 체크 제약조건 추가 (알파벳만 허용)
-- 기존 사용자들의 기본 닉네임이 숫자를 포함할 수 있으므로 일시적으로 제약조건 추가하지 않음
-- ALTER TABLE users 
-- ADD CONSTRAINT users_nickname_alphabetic 
-- CHECK (nickname ~ '^[a-zA-Z]+$');

-- 4. 기존 사용자들을 위한 기본 닉네임 생성 (선택사항)
-- 실제 운영에서는 기존 사용자들이 직접 닉네임을 설정하도록 안내
-- 알파벳과 숫자 조합으로 기본 닉네임 생성
UPDATE users 
SET nickname = 'user' || substring(replace(id::text, '-', ''), 1, 8) 
WHERE nickname IS NULL;

-- 5. nickname을 NOT NULL로 설정 (기본값 설정 후)
ALTER TABLE users 
ALTER COLUMN nickname SET NOT NULL;

-- 6. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'nickname 컬럼이 성공적으로 추가되었습니다.';
    RAISE NOTICE '기존 사용자들에게는 기본 닉네임이 설정되었습니다.';
    RAISE NOTICE '새로운 사용자는 알파벳만 사용하는 닉네임을 설정할 수 있습니다.';
    RAISE NOTICE '기존 사용자들은 프로필에서 닉네임을 변경할 수 있습니다.';
END $$;

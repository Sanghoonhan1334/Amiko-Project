-- 테스트 데이터 삭제 스크립트

-- 1. 인증코드 삭제
DELETE FROM verification_codes 
WHERE email IN ('hsanghoon133334@gmail.com', 'han-273@hanmail.net')
   OR phone_number IN ('+821056892434', '+8201056892434', '010-5689-2434');

-- 2. 사용자 데이터 삭제 (이메일로)
DELETE FROM users 
WHERE email IN ('hsanghoon133334@gmail.com', 'han-273@hanmail.net');

-- 3. 사용자 데이터 삭제 (전화번호로)
DELETE FROM users 
WHERE phone IN ('+821056892434', '+8201056892434', '010-5689-2434');

-- 4. 관련 테이블들 정리
DELETE FROM user_profiles 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN ('hsanghoon133334@gmail.com', 'han-273@hanmail.net')
     OR phone IN ('+821056892434', '+8201056892434', '010-5689-2434')
);

-- 결과 확인
SELECT 'verification_codes' as table_name, COUNT(*) as remaining_count FROM verification_codes
UNION ALL
SELECT 'users' as table_name, COUNT(*) as remaining_count FROM users
UNION ALL  
SELECT 'user_profiles' as table_name, COUNT(*) as remaining_count FROM user_profiles;

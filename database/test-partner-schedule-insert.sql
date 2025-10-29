-- 정기 스케줄 INSERT 테스트 쿼리
-- 이 쿼리는 RLS를 우회하고 직접 INSERT를 시도합니다
-- 주의: 실제 파트너 ID로 변경해야 합니다

-- 1. 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partner_recurring_schedules'
) as table_exists;

-- 2. RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'partner_recurring_schedules';

-- 3. 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'partner_recurring_schedules';

-- 4. 파트너 ID 확인 (실제 사용 중인 ID로 테스트)
SELECT 
  user_id,
  name,
  is_active
FROM conversation_partners
WHERE user_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';

-- 5. 직접 INSERT 시도 (RLS 우회 - 서비스 롤 키가 필요할 수 있음)
-- 주의: 이 쿼리는 Supabase 대시보드에서 실행하면 RLS가 적용되지 않을 수 있습니다
INSERT INTO partner_recurring_schedules (
  partner_id,
  day_of_week,
  start_time,
  end_time,
  is_active
) VALUES (
  '6ea93c19-81ba-4f9f-a848-325c5418cbba',
  1,  -- 월요일
  '09:00:00',
  '10:00:00',
  true
)
RETURNING *;

-- 6. 결과 확인
SELECT * FROM partner_recurring_schedules 
WHERE partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';

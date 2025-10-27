-- 테스트 데이터 삭제
-- 실제 사용자가 업로드한 게시물만 남기고 나머지 삭제

DELETE FROM idol_memes 
WHERE author_id IS NULL 
AND author_name IN ('KpopLover123', 'FanGirl99', 'BLink2024', '관리자');

-- 또는 특정 제목으로 삭제
DELETE FROM idol_memes 
WHERE title IN (
  'BTS 진이 너무 웃긴 순간 🤣',
  '🎵 NewJeans의 귀여운 리액션',
  'BLACKPINK 지수가 말하는 순간 😂',
  '필독: 게시판 사용 가이드'
);


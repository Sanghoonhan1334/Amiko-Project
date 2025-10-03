-- 뉴스 테이블에 게시 날짜 컬럼 추가
-- Add date column to korean_news table

ALTER TABLE korean_news ADD COLUMN date DATE;

-- 기존 데이터에 대해 현재 날짜를 기본값으로 설정
UPDATE korean_news SET date = CURRENT_DATE WHERE date IS NULL;

-- 변경사항 설명
-- 1. korean_news 테이블에 date 컬럼을 추가합니다.
-- 2. 기존 뉴스 데이터에는 현재 날짜를 기본값으로 설정합니다.
-- 3. 새로 작성되는 뉴스는 작성자가 선택한 날짜가 저장됩니다.

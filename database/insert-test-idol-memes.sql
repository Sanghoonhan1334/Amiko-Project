-- 테스트 데이터 추가 (테이블이 생성된 후 실행)
-- UUID를 사용하기 위해 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 테스트 게시물 추가
INSERT INTO idol_memes (id, title, content, media_type, author_name, views, likes_count, comments_count, category, tags, is_pinned, is_active) VALUES
(uuid_generate_v4(), 'BTS 진이 너무 웃긴 순간 🤣', '진의 표정이 너무 웃겨서 리액션 짤로 만들었어요ㅋㅋ', 'image', 'KpopLover123', 1523, 89, 12, 'BTS', ARRAY['BTS', '진', '웃김'], false, true),
(uuid_generate_v4(), '🎵 NewJeans의 귀여운 리액션', '뉴진스 멤버들의 귀여운 리액션 모음입니다!', 'image', 'FanGirl99', 3421, 234, 45, 'NewJeans', ARRAY['NewJeans', '귀여움'], true, true),
(uuid_generate_v4(), 'BLACKPINK 지수가 말하는 순간 😂', '지수의 어록 모음입니다. 웃긴 부분만 추렸어요!', 'image', 'BLink2024', 5678, 445, 78, 'BLACKPINK', ARRAY['BLACKPINK', '지수'], false, true),
(uuid_generate_v4(), '필독: 게시판 사용 가이드', '밈을 올릴 때 주의사항을 확인해주세요!', NULL, '관리자', 890, 45, 8, NULL, NULL, true, true);

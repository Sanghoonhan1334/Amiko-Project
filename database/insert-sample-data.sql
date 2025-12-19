-- ============================================
-- AMIKO 샘플 데이터 삽입 스크립트
-- Sample Data Insertion Script
-- ============================================
-- 주의: 이 파일의 모든 데이터는 샘플/테스트용입니다
-- WARNING: All data in this file is for SAMPLE/TESTING purposes only
-- 
-- 삭제 방법: database/delete-sample-data.sql 실행
-- To delete: Run database/delete-sample-data.sql
-- ============================================

-- 샘플 데이터 마커 시작
-- SAMPLE_DATA_START

-- 1. 샘플 사용자 프로필 (9명 - 기존 프로필 이미지 사용)
-- Sample User Profiles (9 users - using existing profile images)

INSERT INTO public.user_profiles (
    user_id,
    display_name,
    avatar_url,
    bio,
    is_korean,
    country,
    language_preference,
    total_points,
    level,
    experience_points,
    badges
) VALUES 
-- 한국 사용자 (Korean Users)
('SAMPLE-USER-001', '김민지', '/sample-images/profiles/samples (1).png', '한국 문화를 사랑하는 대학생입니다', true, 'KR', 'ko', 150, 3, 200, ARRAY['early_bird', 'helpful']),
('SAMPLE-USER-002', '박지영', '/sample-images/profiles/samples (2).png', '화장품 전문가입니다', true, 'KR', 'ko', 320, 4, 500, ARRAY['expert', 'beauty_guru']),
('SAMPLE-USER-003', '이수진', '/sample-images/profiles/samples (3).png', '여행을 좋아해요', true, 'KR', 'ko', 80, 2, 100, ARRAY['traveler']),

-- 글로벌 사용자 (Global Users)
('SAMPLE-USER-004', 'María González', '/sample-images/profiles/samples (4).png', 'Hola! Soy de México', false, 'MX', 'es', 200, 3, 250, ARRAY['friendly', 'language_expert']),
('SAMPLE-USER-005', 'Carlos Silva', '/sample-images/profiles/samples (5).png', 'Brasileiro apaixonado por K-pop!', false, 'BR', 'es', 180, 3, 220, ARRAY['kpop_fan', 'music_lover']),
('SAMPLE-USER-006', 'Sofía Rodríguez', '/sample-images/profiles/samples (6).png', 'Fashion enthusiast from Argentina', false, 'AR', 'es', 120, 2, 150, ARRAY['fashionista']),
('SAMPLE-USER-007', 'Ana Martínez', '/sample-images/profiles/samples (7).png', 'Colombiana estudiando coreano', false, 'CO', 'es', 90, 2, 120, ARRAY['student', 'language_learner']),
('SAMPLE-USER-008', 'Diego López', '/sample-images/profiles/samples (8).png', 'Peruano amante de la comida coreana', false, 'PE', 'es', 110, 2, 140, ARRAY['food_lover']),
('SAMPLE-USER-009', 'Isabella Torres', '/sample-images/profiles/samples (9).png', 'Chilena fanática de K-dramas', false, 'CL', 'es', 95, 2, 130, ARRAY['kdrama_fan'])
ON CONFLICT (user_id) DO NOTHING;

-- 2. 샘플 이벤트 (Sample Events)
INSERT INTO public.events (
    id,
    title,
    description,
    image_url,
    banner_mobile,
    banner_desktop,
    start_date,
    end_date,
    participant_count,
    is_active
) VALUES
('SAMPLE-EVENT-001', '한국어 모임', '2주에 한번씩 한국어 모임을 진행합니다!', '/sample-images/banners/korean-meetup.png', '/sample-images/banners/korean-meetup.png', '/sample-images/banners/korean-meetup.png', NOW(), NOW() + INTERVAL '30 days', 45, true),
('SAMPLE-EVENT-002', 'K-POP Concert Night', 'K-POP 콘서트 나이트에 참여하세요!', '/sample-images/banners/kpop-concert.png', '/sample-images/banners/kpop-concert.png', '/sample-images/banners/kpop-concert.png', NOW(), NOW() + INTERVAL '15 days', 120, true),
('SAMPLE-EVENT-003', 'K-Drama Watch Party', 'K-드라마 시청 파티', '/sample-images/banners/kdrama-party.png', '/sample-images/banners/kdrama-party.png', '/sample-images/banners/kdrama-party.png', NOW(), NOW() + INTERVAL '7 days', 78, true),
('SAMPLE-EVENT-004', 'Cultural Exchange', '한국-라틴 문화 교류', '/sample-images/banners/cultural-exchange.png', '/sample-images/banners/cultural-exchange.png', '/sample-images/banners/cultural-exchange.png', NOW(), NOW() + INTERVAL '20 days', 56, true),
('SAMPLE-EVENT-005', 'K-Beauty Workshop', 'K-뷰티 워크샵', '/sample-images/banners/beauty-workshop.png', '/sample-images/banners/beauty-workshop.png', '/sample-images/banners/beauty-workshop.png', NOW(), NOW() + INTERVAL '10 days', 92, true)
ON CONFLICT (id) DO NOTHING;

-- 3. 샘플 게시물 (Sample Posts)
INSERT INTO public.posts (
    id,
    user_id,
    type,
    title,
    content,
    category,
    tags,
    language,
    is_hot,
    is_notice,
    view_count,
    like_count,
    comment_count,
    created_at
) VALUES
-- 인기 게시물 (Hot Posts)
('SAMPLE-POST-001', 'SAMPLE-USER-004', 'question', '한국 화장품 브랜드 추천해주세요', '한국에 처음 와서 화장품을 사려고 하는데, 어떤 브랜드가 좋을까요? 피부가 민감해서 천연 성분이 들어간 제품을 찾고 있어요.', 'beauty', ARRAY['화장품', '민감성피부', '추천'], 'ko', true, false, 234, 45, 12, NOW() - INTERVAL '2 hours'),
('SAMPLE-POST-002', 'SAMPLE-USER-005', 'story', 'K-pop 콘서트 갔다온 후기', '드디어 꿈에 그리던 콘서트에 갔다왔어요! 정말 감동적이었고, 한국 팬들과 함께 응원하는 경험이 너무 좋았어요.', 'culture', ARRAY['K-pop', '콘서트', '팬'], 'ko', true, false, 456, 89, 23, NOW() - INTERVAL '5 hours'),
('SAMPLE-POST-003', 'SAMPLE-USER-001', 'freeboard', '서울 맛집 추천', '명동에서 먹은 비빔밥이 정말 맛있었어요! 다음에 또 가고 싶네요.', 'food', ARRAY['맛집', '비빔밥', '서울'], 'ko', true, false, 189, 34, 8, NOW() - INTERVAL '1 day'),
('SAMPLE-POST-004', 'SAMPLE-USER-006', 'question', '한국 패션 트렌드 2024', '올해 한국에서 유행하는 패션 아이템이나 스타일이 궁금해요.', 'fashion', ARRAY['패션', '트렌드', '2024'], 'ko', true, false, 312, 56, 15, NOW() - INTERVAL '3 hours'),
('SAMPLE-POST-005', 'SAMPLE-USER-002', 'story', '한국어 공부 방법 공유', '드라마를 보면서 공부하는 방법이 가장 효과적이었어요. 자막을 한국어로 바꿔서 보면 정말 도움이 많이 됩니다!', 'daily', ARRAY['한국어', '공부방법', '드라마'], 'ko', true, false, 278, 67, 19, NOW() - INTERVAL '6 hours'),

-- 공지사항 (Notices)
('SAMPLE-POST-NOTICE-001', 'SAMPLE-USER-001', 'news', '커뮤니티 이용 규칙 안내', '안녕하세요! Amiko 커뮤니티를 이용해주셔서 감사합니다. 더 나은 커뮤니티를 위해 몇 가지 규칙을 안내드립니다.', 'notice', ARRAY['공지사항', '이용규칙'], 'ko', false, true, 567, 45, 0, NOW() - INTERVAL '1 day'),
('SAMPLE-POST-NOTICE-002', 'SAMPLE-USER-002', 'news', '새로운 기능 업데이트 안내', '이번 업데이트에서 새로운 기능들이 추가되었습니다. 확인해보세요!', 'notice', ARRAY['업데이트', '새기능'], 'ko', false, true, 423, 32, 5, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 4. 샘플 갤러리 포스트 (Sample Gallery Posts - Fan Art)
INSERT INTO public.fan_art (
    id,
    user_id,
    title,
    description,
    image_url,
    likes_count,
    created_at
) VALUES
('SAMPLE-FANART-001', 'SAMPLE-USER-005', 'K-POP Fan Art', 'My favorite K-pop group illustration', '/sample-images/galleries/kpop-fanart-1.png', 156, NOW() - INTERVAL '1 day'),
('SAMPLE-FANART-002', 'SAMPLE-USER-006', 'Concert Vibes', 'Concert atmosphere artwork', '/sample-images/galleries/kpop-fanart-2.png', 203, NOW() - INTERVAL '2 days'),
('SAMPLE-FANART-003', 'SAMPLE-USER-009', 'K-Drama Scene', 'Romantic K-drama scene', '/sample-images/galleries/kdrama-scene.png', 178, NOW() - INTERVAL '3 days'),
('SAMPLE-FANART-004', 'SAMPLE-USER-001', 'Korean Culture', 'Traditional meets modern', '/sample-images/galleries/korean-culture.png', 145, NOW() - INTERVAL '4 days'),
('SAMPLE-FANART-005', 'SAMPLE-USER-002', 'K-Beauty', 'Korean beauty products', '/sample-images/galleries/fashion-beauty.png', 189, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 5. 샘플 아이돌 사진 (Sample Idol Photos)
INSERT INTO public.idol_memes (
    id,
    user_id,
    title,
    media_url,
    thumbnail_url,
    likes_count,
    created_at
) VALUES
('SAMPLE-IDOL-001', 'SAMPLE-USER-005', 'Delicious Bibimbap', '/sample-images/galleries/food-1.png', '/sample-images/galleries/food-1.png', 234, NOW() - INTERVAL '1 day'),
('SAMPLE-IDOL-002', 'SAMPLE-USER-008', 'Tteokbokki Love', '/sample-images/galleries/food-2.png', '/sample-images/galleries/food-2.png', 198, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 6. 샘플 채팅방 (Sample Chat Rooms)
INSERT INTO public.chat_rooms (
    id,
    name,
    description,
    type,
    thumbnail_url,
    participant_count,
    is_active,
    created_by,
    created_at,
    updated_at
) VALUES
('SAMPLE-CHAT-001', 'BTS 팬클럽', 'BTS를 사랑하는 팬들의 모임', 'fanclub', '/sample-images/galleries/kpop-fanart-1.png', 234, true, 'SAMPLE-USER-005', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 hour'),
('SAMPLE-CHAT-002', '한국어 공부방', '함께 한국어를 공부해요', 'study', '/sample-images/galleries/korean-culture.png', 156, true, 'SAMPLE-USER-007', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 hours'),
('SAMPLE-CHAT-003', 'K-Drama 토론방', '최신 K-드라마 이야기', 'fanclub', '/sample-images/galleries/kdrama-scene.png', 189, true, 'SAMPLE-USER-009', NOW() - INTERVAL '8 days', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- 7. 샘플 투표 (Sample Polls)
INSERT INTO public.polls (
    id,
    user_id,
    question,
    options,
    image_url,
    total_votes,
    end_date,
    is_active,
    created_at
) VALUES
('SAMPLE-POLL-001', 'SAMPLE-USER-001', '가장 좋아하는 K-POP 그룹은?', '["BTS", "BLACKPINK", "SEVENTEEN", "NewJeans"]', '/sample-images/galleries/kpop-fanart-1.png', 456, NOW() + INTERVAL '7 days', true, NOW() - INTERVAL '2 days'),
('SAMPLE-POLL-002', 'SAMPLE-USER-002', '어떤 K-드라마 장르를 좋아하세요?', '["로맨스", "액션", "코미디", "스릴러"]', '/sample-images/galleries/kdrama-scene.png', 312, NOW() + INTERVAL '5 days', true, NOW() - INTERVAL '1 day'),
('SAMPLE-POLL-003', 'SAMPLE-USER-003', '한국 음식 중 가장 좋아하는 것은?', '["비빔밥", "김치찌개", "불고기", "떡볶이"]', '/sample-images/galleries/food-1.png', 523, NOW() + INTERVAL '10 days', true, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 8. 샘플 뉴스 (Sample News)
INSERT INTO public.news (
    id,
    title,
    title_es,
    content,
    content_es,
    thumbnail_url,
    like_count,
    comment_count,
    view_count,
    created_at
) VALUES
('SAMPLE-NEWS-001', 'K-POP 최신 소식', 'Últimas noticias de K-POP', 'K-POP 업계의 최신 소식을 전해드립니다.', 'Las últimas noticias de la industria K-POP.', '/sample-images/news/kpop-news.png', 234, 45, 1234, NOW() - INTERVAL '2 hours'),
('SAMPLE-NEWS-002', 'K-드라마 신작 공개', 'Nuevo K-Drama revelado', '기대되는 K-드라마 신작이 공개되었습니다.', 'Se ha revelado un nuevo K-Drama muy esperado.', '/sample-images/news/kdrama-news.png', 189, 32, 987, NOW() - INTERVAL '5 hours'),
('SAMPLE-NEWS-003', '한국 문화 축제 개최', 'Festival de cultura coreana', '한국 문화 축제가 다음 주에 개최됩니다.', 'El festival de cultura coreana se llevará a cabo la próxima semana.', '/sample-images/news/culture-news.png', 156, 28, 756, NOW() - INTERVAL '1 day'),
('SAMPLE-NEWS-004', 'K-뷰티 트렌드 2024', 'Tendencias K-Beauty 2024', '2024년 K-뷰티 트렌드를 알아봅니다.', 'Descubre las tendencias K-Beauty de 2024.', '/sample-images/posts/beauty-1.png', 267, 51, 1456, NOW() - INTERVAL '3 hours'),
('SAMPLE-NEWS-005', '서울 여행 가이드', 'Guía de viaje a Seúl', '서울 여행을 위한 완벽한 가이드입니다.', 'La guía perfecta para viajar a Seúl.', '/sample-images/posts/travel-1.png', 298, 63, 1678, NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- 샘플 데이터 마커 종료
-- SAMPLE_DATA_END

-- ============================================
-- 샘플 데이터 삽입 완료
-- Sample Data Insertion Complete
-- ============================================

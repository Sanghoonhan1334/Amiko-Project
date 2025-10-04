-- 삭제된 뉴스 데이터 복구
-- Restore deleted news data

-- 연합뉴스 뉴스 복구
INSERT INTO korean_news (
    id,
    title, 
    content, 
    source, 
    category, 
    thumbnail, 
    author,
    published,
    view_count,
    comment_count,
    like_count,
    created_at
) VALUES (
    gen_random_uuid(),
    '"BTS 정국, 솔로 앨범으로 빌보드 1위 달성!" K-팝의 새로운 역사',
    'BTS 정국이 새 솔로 앨범으로 마침내 빌보드 차트 1위를 달성했습니다. 이는 K-팝 가수로서는 처음이자 역사적인 성과입니다. 정국의 새로운 음악이 한국 음악계에 또 다른 성과를 보여주고 있습니다.',
    '연합뉴스',
    'entertainment',
    'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=BTS+News',
    'info@helloamiko.com',
    true,
    1250,
    12,
    89,
    NOW() - INTERVAL '7 days'
), (
    gen_random_uuid(),
    '"한국 영화, 칸 영화제에서 대상 수상!" 세계 영화계 주목',
    '한국 감독의 작품이 칸 영화제 대상을 수상하며 세계 영화계의 주목을 받고 있습니다. 한국 영화의 감동적인 스토리텔링과 감독의 독창적인 영상미가 높은 평가를 받았습니다.',
    '동아일보',
    'culture',
    'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Cannes+Film',
    'info@helloamiko.com',
    true,
    980,
    23,
    64,
    NOW() - INTERVAL '5 days'
) ON CONFLICT DO NOTHING;

-- 현재 뉴스 데이터 확인
SELECT id, title, source, author, created_at 
FROM korean_news 
ORDER BY created_at DESC;

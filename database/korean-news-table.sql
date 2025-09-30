-- Korean News 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS korean_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    title_es VARCHAR(200), -- 스페인어 제목
    content TEXT NOT NULL,
    content_es TEXT, -- 스페인어 내용
    thumbnail VARCHAR(500), -- 썸네일 URL
    source VARCHAR(100) NOT NULL, -- 출처 (연합뉴스, 동아일보 등)
    category VARCHAR(50) NOT NULL DEFAULT 'entertainment', -- 카테고리
    view_count INTEGER DEFAULT 0, -- 조회수
    comment_count INTEGER DEFAULT 0, -- 댓글수
    like_count INTEGER DEFAULT 0, -- 좋아요수
    author VARCHAR(100) NOT NULL, -- 작성자 이메일
    published BOOLEAN DEFAULT true, -- 게시 여부
    pinned BOOLEAN DEFAULT false, -- 고정 여부
    featured BOOLEAN DEFAULT false, -- 추천 여부
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_korean_news_category ON korean_news(category);
CREATE INDEX IF NOT EXISTS idx_korean_news_created_at ON korean_news(created_at);
CREATE INDEX IF NOT EXISTS idx_korean_news_published ON korean_news(published);
CREATE INDEX IF NOT EXISTS idx_korean_news_pinned ON korean_news(pinned);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_korean_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_korean_news_updated_at
    BEFORE UPDATE ON korean_news
    FOR EACH ROW
    EXECUTE FUNCTION update_korean_news_updated_at();

-- RLS (Row Level Security) 정책
ALTER TABLE korean_news ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회할 수 있도록 (게시된 뉴스만)
CREATE POLICY "Published news are viewable by everyone" ON korean_news
    FOR SELECT USING (published = true);

-- 운영진만 인서트 가능 (임시로 모든 사용자 열람 허용)
CREATE POLICY "Anyone can insert news" ON korean_news
    FOR INSERT WITH CHECK (true);

-- 운영진만 업데이트 가능 (임시로 모든 편집 가능)
CREATE POLICY "Anyone can update news" ON korean_news
    FOR UPDATE USING (true);

-- 운영진만 삭제 가능 (임시로 모든 삭제 가능)
CREATE POLICY "Anyone can delete news" ON korean_news
    FOR DELETE USING (true);

-- 샘플 데이터 (한국어)
INSERT INTO korean_news (
    title, 
    content, 
    source, 
    category, 
    thumbnail, 
    author,
    published,
    view_count,
    comment_count,
    like_count
) VALUES (
    '"BTS 정국, 솔로 앨범으로 빌보드 1위 달성!" K-팝의 새로운 역사',
    'BTS 정국이 새 솔로 앨범으로 마침내 빌보드 차트 1위를 달성했습니다. 이는 K-팝 가수로서는 처음이자 역사적인 성과입니다. 정국의 새로운 음악이 한국 음악계에 또 다른 성과를 보여주고 있습니다.',
    '연합뉴스',
    'entertainment',
    'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=BTS+News',
    'info@helloamiko.com',
    true,
    1250,
    12,
    89
), (
    '"한국 영화, 칸 영화제에서 대상 수상!" 세계 영화계 주목',
    '한국 감독의 작품이 칸 영화제 대상을 수상하며 세계 영화계의 주목을 받고 있습니다. 한국 영화의 감동적인 스토리텔링과 감독의 독창적인 영상미가 높评分받았습니다.',
    '동아일보',
    'culture',
    'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Cannes+Film',
    'info@helloamiko.com',
    true,
    980,
    23,
    64
) ON CONFLICT DO NOTHING;

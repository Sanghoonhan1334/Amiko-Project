# 뉴스 시스템 데이터베이스 설정 가이드

## 실행할 SQL들

### 1단계: 뉴스 테이블 생성

Supabase 대시보드 → SQL Editor에서 다음 SQL을 실행하세요:

```sql
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
```

### 2단계: 인덱스 생성

```sql
-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_korean_news_category ON korean_news(category);
CREATE INDEX IF NOT EXISTS idx_korean_news_created_at ON korean_news(created_at);
CREATE INDEX IF NOT EXISTS idx_korean_news_published ON korean_news(published);
CREATE INDEX IF NOT EXISTS idx_korean_news_pinned ON korean_news(pinned);
```

### 3단계: 자동 업데이트 트리거

```sql
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
```

### 4단계: RLS 보안 정책 설정

```sql
-- RLS (Row Level Security) 정책
ALTER TABLE korean_news ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게시된 뉴스를 조회할 수 있도록
CREATE POLICY "Published news are viewable by everyone" ON korean_news
    FOR SELECT USING (published = true);

-- 운영진만 뉴스 작성 가능 (임시로 모든 사용자 허용)
CREATE POLICY "Anyone can insert news" ON korean_news
    FOR INSERT WITH CHECK (true);

-- 운영진만 뉴스 수정 가능 (임시로 모든 편집 허용)
CREATE POLICY "Anyone can update news" ON korean_news
    FOR UPDATE USING (true);

-- 운영진만 뉴스 삭제 가능 (임시로 모든 삭제 허용)
CREATE POLICY "Anyone can delete news" ON korean_news
    FOR DELETE USING (true);
```

### 5단계: 샘플 데이터 삽입 (선택사항)

```sql
-- 샘플 뉴스 데이터
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
```

## 전체 SQL을 한 번에 실행하려면:

```sql
-- 전체 korean_news 시스템 생성
CREATE TABLE IF NOT EXISTS korean_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    title_es VARCHAR(200),
    content TEXT NOT NULL,
    content_es TEXT,
    thumbnail VARCHAR(500),
    source VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'entertainment',
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    author VARCHAR(100) NOT NULL,
    published BOOLEAN DEFAULT true,
    pinned BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_korean_news_category ON korean_news(category);
CREATE INDEX IF NOT EXISTS idx_korean_news_created_at ON korean_news(created_at);
CREATE INDEX IF NOT EXISTS idx_korean_news_published ON korean_news(published);
CREATE INDEX IF NOT EXISTS idx_korean_news_pinned ON korean_news(pinned);

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

ALTER TABLE korean_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news are viewable by everyone" ON korean_news
    FOR SELECT USING (published = true);

CREATE POLICY "Anyone can insert news" ON korean_news
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update news" ON korean_news
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete news" ON korean_news
    FOR DELETE USING (true);

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
    '한국 감독의 작품이 칸 영화제 대상을 수상하며 세계 영화계의 주목을 받고 있습니다. 한국 영화의 감동적인 스토리텔링과 감독의 독창적인 영상미가 높이 평가받았습니다.',                                                   
    '동아일보',
    'culture',
    'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Cannes+Film',
    'info@helloamiko.com',
    true,
    980,
    23,
    64
) ON CONFLICT DO NOTHING;
```

## 실행 후 확인

SQL 실행 후 다음이 정상 작동해야 합니다:
- ✅ 뉴스 조회 API (`/api/news`) 정상 응답
- ✅ 비어있으면 "뉴스를 찾을 수 없습니다" 표시
- ✅ 운영자가 뉴스 작성 버튼으로 새 뉴스 생성 가능
- ✅ 작성한 뉴스가 데이터베이스에 저장됨
- ✅ 뉴스 편집/삭제 기능 동작

## 문제 해결

만약 SQL 실행 중 오류가 발생하면:
1. 하나씩 단계별로 실행해보세요
2. 기존 테이블이 있다면 DROP TABLE korean_news CASCADE; 후 다시 실행
3. 권한 문제가 있다면 Supabase 대시보드에서 테이블 권한 확인

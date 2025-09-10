-- =====================================================
-- 상담사 테이블 (Consultants Table)
-- Description: 상담사 정보를 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 상담사 테이블 (Consultants Table)
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL, -- 시간당 요금 (AKO 단위)
    is_active BOOLEAN DEFAULT TRUE,
    languages TEXT[], -- 가능한 언어 (예: ['ko', 'es'])
    availability JSONB, -- 상담 가능 시간 (예: {"monday": [9, 10, 11], "tuesday": [14, 15, 16]})
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_specialty ON public.consultants(specialty);
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);
CREATE INDEX IF NOT EXISTS idx_consultants_hourly_rate ON public.consultants(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_consultants_languages ON public.consultants USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_consultants_availability ON public.consultants USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_consultants_created_at ON public.consultants(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 모든 사용자는 활성화된 상담사 정보를 볼 수 있음
CREATE POLICY "Anyone can view active consultants" ON public.consultants
    FOR SELECT USING (is_active = true);

-- 상담사는 자신의 정보를 볼 수 있음 (비활성화 상태 포함)
CREATE POLICY "Consultants can view own profile" ON public.consultants
    FOR SELECT USING (auth.uid() = user_id);

-- 상담사는 자신의 정보를 업데이트할 수 있음
CREATE POLICY "Consultants can update own profile" ON public.consultants
    FOR UPDATE USING (auth.uid() = user_id);

-- 상담사는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can create consultant profile" ON public.consultants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 상담사 정보를 관리할 수 있음
CREATE POLICY "Admins can manage all consultants" ON public.consultants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_consultants_updated_at 
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 상담사 통계를 위한 함수 생성
CREATE OR REPLACE FUNCTION get_consultant_stats(consultant_uuid UUID)
RETURNS TABLE (
    total_bookings BIGINT,
    total_earnings NUMERIC,
    avg_rating NUMERIC,
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.price_cents), 0) as total_earnings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as total_reviews
    FROM public.consultants c
    LEFT JOIN public.bookings b ON c.id = b.consultant_id
    LEFT JOIN public.reviews r ON c.id = r.consultant_id
    WHERE c.id = consultant_uuid
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 상담사 검색을 위한 함수 생성
CREATE OR REPLACE FUNCTION search_consultants(
    search_specialty TEXT DEFAULT NULL,
    search_language TEXT DEFAULT NULL,
    max_rate NUMERIC DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    specialty TEXT,
    description TEXT,
    hourly_rate NUMERIC,
    languages TEXT[],
    profile_image_url TEXT,
    avg_rating NUMERIC,
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.specialty,
        c.description,
        c.hourly_rate,
        c.languages,
        c.profile_image_url,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as total_reviews
    FROM public.consultants c
    LEFT JOIN public.reviews r ON c.id = r.consultant_id
    WHERE c.is_active = true
        AND (search_specialty IS NULL OR c.specialty ILIKE '%' || search_specialty || '%')
        AND (search_language IS NULL OR search_language = ANY(c.languages))
        AND (max_rate IS NULL OR c.hourly_rate <= max_rate)
    GROUP BY c.id, c.name, c.specialty, c.description, c.hourly_rate, c.languages, c.profile_image_url
    ORDER BY avg_rating DESC, total_reviews DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 샘플 데이터 (테스트용)
-- INSERT INTO public.consultants (
--     user_id, 
--     name, 
--     specialty, 
--     description, 
--     hourly_rate, 
--     languages, 
--     availability
-- ) VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001',
--     '김한국',
--     '한국어 교육',
--     '10년 경력의 한국어 교육 전문가입니다.',
--     2.00,
--     ARRAY['ko', 'es'],
--     '{"monday": [9, 10, 11, 14, 15, 16], "tuesday": [9, 10, 11, 14, 15, 16], "wednesday": [9, 10, 11, 14, 15, 16], "thursday": [9, 10, 11, 14, 15, 16], "friday": [9, 10, 11, 14, 15, 16]}'::jsonb
-- ),
-- (
--     '00000000-0000-0000-0000-000000000002',
--     'Maria Garcia',
--     '스페인어 교육',
--     '멕시코 출신의 스페인어 교육 전문가입니다.',
--     1.50,
--     ARRAY['es', 'ko'],
--     '{"monday": [8, 9, 10, 15, 16, 17], "tuesday": [8, 9, 10, 15, 16, 17], "wednesday": [8, 9, 10, 15, 16, 17], "thursday": [8, 9, 10, 15, 16, 17], "friday": [8, 9, 10, 15, 16, 17]}'::jsonb
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
상담사 테이블 필드 설명:

1. id: 상담사 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. name: 상담사 이름
4. specialty: 전문 분야 (한국어 교육, 스페인어 교육 등)
5. description: 상담사 소개
6. hourly_rate: 시간당 요금 (AKO 단위, NUMERIC 타입)
7. is_active: 활성화 상태 (기본값: true)
8. languages: 가능한 언어 배열 (예: ['ko', 'es'])
9. availability: 상담 가능 시간 (JSONB 형태)
10. profile_image_url: 프로필 이미지 URL
11. created_at: 생성 시간
12. updated_at: 수정 시간

RLS 정책:
- 모든 사용자는 활성화된 상담사 정보 조회 가능
- 상담사는 자신의 정보 조회/수정 가능
- 관리자는 모든 상담사 정보 관리 가능

함수:
- get_consultant_stats(): 상담사 통계 조회
- search_consultants(): 상담사 검색 (전문분야, 언어, 요금 기준)

JSONB availability 예시:
{
  "monday": [9, 10, 11, 14, 15, 16],
  "tuesday": [9, 10, 11, 14, 15, 16],
  "wednesday": [9, 10, 11, 14, 15, 16],
  "thursday": [9, 10, 11, 14, 15, 16],
  "friday": [9, 10, 11, 14, 15, 16],
  "saturday": [10, 11, 12],
  "sunday": []
}
*/

-- 설문조사 시스템을 위한 데이터베이스 스키마
-- Database schema for survey system

-- 1. 설문조사 테이블
-- Survey table
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_multiple_choice BOOLEAN DEFAULT FALSE, -- 다중 선택 가능 여부
    is_anonymous BOOLEAN DEFAULT TRUE, -- 익명 투표 여부
    end_date TIMESTAMP WITH TIME ZONE, -- 설문 종료일
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 설문조사 선택지 테이블
-- Survey options table
CREATE TABLE IF NOT EXISTS public.survey_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    option_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 설문조사 투표 테이블
-- Survey votes table
CREATE TABLE IF NOT EXISTS public.survey_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.survey_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address INET, -- 익명 투표를 위한 IP 주소
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id, user_id, option_id) -- 한 사용자가 같은 선택지에 중복 투표 방지
);

-- 인덱스 생성
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_surveys_post_id ON public.surveys(post_id);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON public.surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_end_date ON public.surveys(end_date);

CREATE INDEX IF NOT EXISTS idx_survey_options_survey_id ON public.survey_options(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_options_order ON public.survey_options(survey_id, option_order);

CREATE INDEX IF NOT EXISTS idx_survey_votes_survey_id ON public.survey_votes(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_option_id ON public.survey_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_user_id ON public.survey_votes(user_id);

-- RLS 정책 설정
-- Enable Row Level Security
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- Create RLS policies
DO $$ 
BEGIN
    -- surveys 정책
    -- surveys policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Anyone can view active surveys') THEN
        CREATE POLICY "Anyone can view active surveys" ON public.surveys
            FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Users can insert own surveys') THEN
        CREATE POLICY "Users can insert own surveys" ON public.surveys
            FOR INSERT WITH CHECK (auth.uid() IN (
                SELECT author_id FROM public.posts WHERE id = post_id
            ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Users can update own surveys') THEN
        CREATE POLICY "Users can update own surveys" ON public.surveys
            FOR UPDATE USING (auth.uid() IN (
                SELECT author_id FROM public.posts WHERE id = post_id
            ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Users can delete own surveys') THEN
        CREATE POLICY "Users can delete own surveys" ON public.surveys
            FOR DELETE USING (auth.uid() IN (
                SELECT author_id FROM public.posts WHERE id = post_id
            ));
    END IF;
    
    -- survey_options 정책
    -- survey_options policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_options' AND policyname = 'Anyone can view survey options') THEN
        CREATE POLICY "Anyone can view survey options" ON public.survey_options
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_options' AND policyname = 'Users can manage survey options') THEN
        CREATE POLICY "Users can manage survey options" ON public.survey_options
            FOR ALL USING (auth.uid() IN (
                SELECT author_id FROM public.posts p 
                JOIN public.surveys s ON p.id = s.post_id 
                WHERE s.id = survey_id
            ));
    END IF;
    
    -- survey_votes 정책
    -- survey_votes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_votes' AND policyname = 'Anyone can view survey votes') THEN
        CREATE POLICY "Anyone can view survey votes" ON public.survey_votes
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_votes' AND policyname = 'Users can insert own votes') THEN
        CREATE POLICY "Users can insert own votes" ON public.survey_votes
            FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_votes' AND policyname = 'Users can update own votes') THEN
        CREATE POLICY "Users can update own votes" ON public.survey_votes
            FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'survey_votes' AND policyname = 'Users can delete own votes') THEN
        CREATE POLICY "Users can delete own votes" ON public.survey_votes
            FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

-- 설문조사 결과 조회 함수
-- Survey results function
CREATE OR REPLACE FUNCTION get_survey_results(survey_uuid UUID)
RETURNS TABLE (
    option_id UUID,
    option_text TEXT,
    vote_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.id,
        so.option_text,
        COUNT(sv.id) as vote_count,
        CASE 
            WHEN SUM(COUNT(sv.id)) OVER() = 0 THEN 0
            ELSE ROUND((COUNT(sv.id)::NUMERIC / SUM(COUNT(sv.id)) OVER() * 100), 1)
        END as percentage
    FROM public.survey_options so
    LEFT JOIN public.survey_votes sv ON so.id = sv.option_id
    WHERE so.survey_id = survey_uuid
    GROUP BY so.id, so.option_text, so.option_order
    ORDER BY so.option_order;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
-- Completion message
SELECT 'Survey system schema created successfully' as status,
       (SELECT COUNT(*) FROM public.surveys) as total_surveys,
       (SELECT COUNT(*) FROM public.survey_options) as total_options,
       (SELECT COUNT(*) FROM public.survey_votes) as total_votes;

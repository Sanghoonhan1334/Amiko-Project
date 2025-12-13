-- =====================================================
-- 강의 테이블 (Lectures Table)
-- Description: 온라인 강의를 관리하는 테이블
-- Date: 2025-12-12
-- =====================================================

-- 1. 강의 테이블 (Lectures Table)
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_krw NUMERIC(10, 2),
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    schedule_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 강의 등록 테이블 (Lecture Enrollments Table)
CREATE TABLE IF NOT EXISTS public.lecture_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled'))
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lectures_instructor_id ON public.lectures(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lectures_status ON public.lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_schedule_date ON public.lectures(schedule_date);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON public.lectures(created_at DESC);

-- 강의 등록 인덱스
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_lecture_id ON public.lecture_enrollments(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_user_id ON public.lecture_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_purchase_id ON public.lecture_enrollments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_status ON public.lecture_enrollments(status);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_lectures_status_schedule ON public.lectures(status, schedule_date);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_lecture_user ON public.lecture_enrollments(lecture_id, user_id);

-- 4. RLS 활성화
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_enrollments ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 강의: 모든 사용자가 볼 수 있음 (읽기)
CREATE POLICY "Anyone can view lectures" ON public.lectures
    FOR SELECT USING (true);

-- 강의 등록: 사용자는 자신의 등록만 볼 수 있음
CREATE POLICY "Users can view own enrollments" ON public.lecture_enrollments
    FOR SELECT USING (auth.uid() = user_id);

-- 강의 등록: 사용자는 자신의 등록만 생성/수정할 수 있음
CREATE POLICY "Users can manage own enrollments" ON public.lecture_enrollments
    FOR ALL USING (auth.uid() = user_id);

-- 6. 트리거 생성 (참가자 수 자동 업데이트)
CREATE OR REPLACE FUNCTION update_lecture_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
        UPDATE public.lectures
        SET current_participants = current_participants + 1
        WHERE id = NEW.lecture_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
        UPDATE public.lectures
        SET current_participants = current_participants - 1
        WHERE id = OLD.lecture_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 상태가 enrolled에서 다른 상태로 변경되는 경우
        IF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
            UPDATE public.lectures
            SET current_participants = current_participants - 1
            WHERE id = NEW.lecture_id;
        -- 상태가 다른 상태에서 enrolled로 변경되는 경우
        ELSIF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
            UPDATE public.lectures
            SET current_participants = current_participants + 1
            WHERE id = NEW.lecture_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER trigger_update_lecture_participants
    AFTER INSERT OR UPDATE OR DELETE ON public.lecture_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_lecture_participants();

-- 7. 기본 강의 데이터 삽입 (첫 번째 강의)
INSERT INTO public.lectures (
    title,
    description,
    price_usd,
    price_krw,
    max_participants,
    instructor_id,
    schedule_date,
    status
) VALUES (
    '한국 문화 기초 강의',
    '한국 문화와 언어의 기초를 배우는 종합 강의입니다. K-Pop, K-Drama, 전통 문화 등을 다룹니다.',
    55.00,
    80000.00,
    10,
    NULL, -- instructor_id는 나중에 설정
    '2026-01-15 10:00:00+00',
    'upcoming'
) ON CONFLICT DO NOTHING;

-- 8. 기본 강의 데이터 삽입 (두 번째 강의)
INSERT INTO public.lectures (
    title,
    description,
    price_usd,
    price_krw,
    max_participants,
    instructor_id,
    schedule_date,
    status
) VALUES (
    '고급 한국어 실력 향상',
    '한국어 실력을 한 단계 높이고 싶은 분들을 위한 고급 강의입니다.',
    75.00,
    110000.00,
    8,
    NULL,
    '2026-02-01 14:00:00+00',
    'upcoming'
) ON CONFLICT DO NOTHING;

-- 9. 기본 강의 데이터 삽입 (세 번째 강의)
INSERT INTO public.lectures (
    title,
    description,
    price_usd,
    price_krw,
    max_participants,
    instructor_id,
    schedule_date,
    status
) VALUES (
    'K-Pop & 엔터테인먼트 문화',
    'K-Pop 산업과 한국 엔터테인먼트 문화를 깊이 있게 탐구하는 강의입니다.',
    65.00,
    95000.00,
    12,
    NULL,
    '2026-02-15 16:00:00+00',
    'upcoming'
) ON CONFLICT DO NOTHING;

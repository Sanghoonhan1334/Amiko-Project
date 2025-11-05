-- quiz_fun, quiz_accurate 테이블 생성
-- 퀴즈 피드백 (재미있음, 정확함) 기능을 위한 테이블

-- 1. quiz_fun 테이블 생성 (재미있음 피드백)
CREATE TABLE IF NOT EXISTS public.quiz_fun (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quiz_id, user_id)
);

-- 2. quiz_accurate 테이블 생성 (정확함 피드백)
CREATE TABLE IF NOT EXISTS public.quiz_accurate (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quiz_id, user_id)
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_quiz_fun_quiz_id ON public.quiz_fun(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_fun_user_id ON public.quiz_fun(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_accurate_quiz_id ON public.quiz_accurate(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_accurate_user_id ON public.quiz_accurate(user_id);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE public.quiz_fun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_accurate ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- quiz_fun: 누구나 읽기 가능, 본인만 삽입/삭제
CREATE POLICY "quiz_fun_select_policy" ON public.quiz_fun
    FOR SELECT USING (true);

CREATE POLICY "quiz_fun_insert_policy" ON public.quiz_fun
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_fun_delete_policy" ON public.quiz_fun
    FOR DELETE USING (auth.uid() = user_id);

-- quiz_accurate: 누구나 읽기 가능, 본인만 삽입/삭제
CREATE POLICY "quiz_accurate_select_policy" ON public.quiz_accurate
    FOR SELECT USING (true);

CREATE POLICY "quiz_accurate_insert_policy" ON public.quiz_accurate
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_accurate_delete_policy" ON public.quiz_accurate
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 테이블 생성 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('quiz_fun', 'quiz_accurate')
ORDER BY table_name, ordinal_position;

-- 완료 메시지
SELECT '✅ quiz_fun, quiz_accurate 테이블 생성 완료!' as status,
       '이제 Divertido, Preciso 버튼이 정상 작동합니다!' as message;


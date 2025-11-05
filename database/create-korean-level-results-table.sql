-- ============================================
-- 한국어 레벨 테스트 결과 테이블 생성
-- Korean Level Test Results Table
-- ============================================

-- 사용자 한국어 레벨 테스트 결과 테이블
CREATE TABLE IF NOT EXISTS public.user_korean_level_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,  -- '2c9a43d4-0958-4d00-8bd1-522971617e62'
  score INTEGER NOT NULL,  -- 총 점수 (0-100)
  level TEXT NOT NULL,  -- 'Básico', 'Intermedio', 'Avanzado'
  level_ko TEXT NOT NULL,  -- '기초', '중급', '고급'
  correct_count INTEGER NOT NULL,  -- 정답 개수
  total_questions INTEGER NOT NULL,  -- 총 질문 수
  answers JSONB,  -- 답변 배열 저장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_korean_level_results_user_id 
  ON public.user_korean_level_results(user_id);

CREATE INDEX IF NOT EXISTS idx_korean_level_results_quiz_id 
  ON public.user_korean_level_results(quiz_id);

CREATE INDEX IF NOT EXISTS idx_korean_level_results_created_at 
  ON public.user_korean_level_results(created_at DESC);

-- RLS 정책
ALTER TABLE public.user_korean_level_results ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 결과를 볼 수 있음 (공유 링크용)
CREATE POLICY "Anyone can view Korean level test results"
  ON public.user_korean_level_results
  FOR SELECT
  USING (true);

-- 로그인한 사용자는 자신의 결과를 저장할 수 있음
CREATE POLICY "Users can insert their own Korean level test results"
  ON public.user_korean_level_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 사용자는 자신의 결과를 삭제할 수 있음
CREATE POLICY "Users can delete their own Korean level test results"
  ON public.user_korean_level_results
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

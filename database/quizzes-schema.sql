-- ============================================
-- 테스트/퀴즈 시스템 스키마
-- Tests/Quizzes System Schema
-- ============================================

-- 1. 퀴즈 테이블 (Quizzes Table)
-- 관리자가 만드는 테스트/퀴즈 목록
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ko TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_ko TEXT,
  description_es TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50), -- 'personality', 'celebrity', 'learning_style', 'culture' 등
  total_questions INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 퀴즈 질문 테이블 (Quiz Questions Table)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text_ko TEXT NOT NULL,
  question_text_es TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  question_type VARCHAR(20) DEFAULT 'single_choice', -- 'single_choice', 'multiple_choice'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 퀴즈 선택지 테이블 (Quiz Options Table)
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text_ko TEXT NOT NULL,
  option_text_es TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  score_value INTEGER DEFAULT 0, -- 점수 방식용
  result_type VARCHAR(50), -- 결과 타입 매핑용 (예: 'ENFP', '아이유')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 퀴즈 결과 유형 테이블 (Quiz Result Types Table)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  result_type VARCHAR(50) NOT NULL, -- 'ENFP', '아이유', 'Type A' 등
  title_ko TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_ko TEXT,
  description_es TEXT,
  image_url TEXT,
  min_score INTEGER, -- 점수 방식용
  max_score INTEGER, -- 점수 방식용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사용자 퀴즈 응답 테이블 (User Quiz Responses Table)
CREATE TABLE IF NOT EXISTS public.user_quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- { "question_id": "selected_option_id", ... }
  result_id UUID REFERENCES public.quiz_results(id) ON DELETE SET NULL,
  total_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id, completed_at) -- 같은 테스트 여러 번 가능, 시간별로 구분
);

-- ============================================
-- 인덱스 (Indexes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_active ON public.quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(quiz_id, question_order);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_order ON public.quiz_options(question_id, option_order);

CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_type ON public.quiz_results(quiz_id, result_type);

CREATE INDEX IF NOT EXISTS idx_user_quiz_responses_user ON public.user_quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_responses_quiz ON public.user_quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_responses_completed ON public.user_quiz_responses(completed_at DESC);

-- ============================================
-- RLS 정책 (Row Level Security)
-- ============================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_responses ENABLE ROW LEVEL SECURITY;

-- 퀴즈: 활성화된 것은 모두가 볼 수 있음
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

-- 관리자만 퀴즈 생성/수정/삭제
CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 질문: 활성화된 퀴즈의 질문은 모두가 볼 수 있음
CREATE POLICY "Anyone can view questions of active quizzes" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = quiz_id AND is_active = true
    )
  );

-- 관리자만 질문 관리
CREATE POLICY "Admins can manage questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 선택지: 활성화된 퀴즈의 선택지는 모두가 볼 수 있음
CREATE POLICY "Anyone can view options of active quizzes" ON public.quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quizzes qz ON q.quiz_id = qz.id
      WHERE q.id = question_id AND qz.is_active = true
    )
  );

-- 관리자만 선택지 관리
CREATE POLICY "Admins can manage options" ON public.quiz_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 결과: 활성화된 퀴즈의 결과는 모두가 볼 수 있음
CREATE POLICY "Anyone can view results of active quizzes" ON public.quiz_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = quiz_id AND is_active = true
    )
  );

-- 관리자만 결과 관리
CREATE POLICY "Admins can manage results" ON public.quiz_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자 응답: 자신의 응답은 볼 수 있음
CREATE POLICY "Users can view their own responses" ON public.user_quiz_responses
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자 응답: 자신의 응답만 생성 가능
CREATE POLICY "Users can create their own responses" ON public.user_quiz_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 응답 조회 가능 (통계용)
CREATE POLICY "Admins can view all responses" ON public.user_quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 함수 (Functions)
-- ============================================

-- 퀴즈 참여자 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_quiz_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.quizzes
  SET total_participants = (
    SELECT COUNT(DISTINCT user_id)
    FROM public.user_quiz_responses
    WHERE quiz_id = NEW.quiz_id
  )
  WHERE id = NEW.quiz_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 사용자가 퀴즈 완료 시 참여자 수 업데이트
CREATE TRIGGER update_quiz_participants_trigger
  AFTER INSERT ON public.user_quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_participants();

-- 퀴즈 질문 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_quiz_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.quizzes
    SET total_questions = (
      SELECT COUNT(*) FROM public.quiz_questions WHERE quiz_id = OLD.quiz_id
    )
    WHERE id = OLD.quiz_id;
    RETURN OLD;
  ELSE
    UPDATE public.quizzes
    SET total_questions = (
      SELECT COUNT(*) FROM public.quiz_questions WHERE quiz_id = NEW.quiz_id
    )
    WHERE id = NEW.quiz_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 질문 추가/삭제 시 질문 수 업데이트
CREATE TRIGGER update_quiz_question_count_trigger
  AFTER INSERT OR DELETE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_question_count();

-- ============================================
-- 샘플 데이터 (Sample Data)
-- ============================================

-- 샘플 퀴즈: "당신과 닮은 K-POP 스타는?"
INSERT INTO public.quizzes (title_ko, title_es, description_ko, description_es, category, is_active)
VALUES (
  '당신과 닮은 K-POP 스타는?',
  '¿Qué estrella de K-POP se parece a ti?',
  '간단한 질문으로 당신과 닮은 K-POP 스타를 찾아보세요!',
  '¡Descubre qué estrella de K-POP se parece a ti con preguntas simples!',
  'celebrity',
  false -- 관리자가 질문 추가 후 활성화
);

-- 참고: 실제 질문과 선택지는 관리자 페이지에서 추가


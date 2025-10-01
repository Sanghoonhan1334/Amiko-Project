-- ============================================
-- 테스트/퀴즈 시스템 스키마
-- Tests/Quizzes System Schema
-- ============================================

-- 1. 퀴즈 테이블 (Quizzes Table)
-- 관리자가 만드는 테스트/퀴즈 목록
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50), -- 'personality', 'celebrity', 'knowledge', 'fun' 등
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
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  question_type VARCHAR(20) DEFAULT 'single_choice', -- 'single_choice', 'multiple_choice'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 퀴즈 선택지 테이블 (Quiz Options Table)
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  score_value INTEGER DEFAULT 0, -- 점수 방식용
  result_type VARCHAR(50), -- 결과 타입 매핑용 (예: 'ENFP', 'IU')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 퀴즈 결과 유형 테이블 (Quiz Result Types Table)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  result_type VARCHAR(50) NOT NULL UNIQUE, -- 결과 타입 (예: 'IU', 'BTS')
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  characteristic TEXT, -- 특징 설명
  recommendation TEXT, -- 추천 사항
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사용자 퀴즈 응답 테이블 (User Quiz Responses Table)
CREATE TABLE IF NOT EXISTS public.user_quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.quiz_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 (Indexes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON public.quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_responses_user_id ON public.user_quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_responses_quiz_id ON public.user_quiz_responses(quiz_id);

-- ============================================
-- RLS 정책 (Row Level Security Policies)
-- ============================================

-- quizzes 테이블
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈는 모두가 볼 수 있습니다"
  ON public.quizzes FOR SELECT
  USING (is_active = true);

CREATE POLICY "관리자만 퀴즈를 생성할 수 있습니다"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "관리자만 퀴즈를 수정할 수 있습니다"
  ON public.quizzes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "관리자만 퀴즈를 삭제할 수 있습니다"
  ON public.quizzes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- quiz_questions 테이블
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 질문은 모두가 볼 수 있습니다"
  ON public.quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "관리자만 퀴즈 질문을 관리할 수 있습니다"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- quiz_options 테이블
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 선택지는 모두가 볼 수 있습니다"
  ON public.quiz_options FOR SELECT
  USING (true);

CREATE POLICY "관리자만 퀴즈 선택지를 관리할 수 있습니다"
  ON public.quiz_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- quiz_results 테이블
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "퀴즈 결과는 모두가 볼 수 있습니다"
  ON public.quiz_results FOR SELECT
  USING (true);

CREATE POLICY "관리자만 퀴즈 결과를 관리할 수 있습니다"
  ON public.quiz_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- user_quiz_responses 테이블
ALTER TABLE public.user_quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 응답을 볼 수 있습니다"
  ON public.user_quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "로그인한 사용자는 응답을 제출할 수 있습니다"
  ON public.user_quiz_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 샘플 데이터 (Sample Data)
-- K-POP Star 테스트
-- ============================================

-- 퀴즈 생성
INSERT INTO public.quizzes (
  id,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '당신과 닮은 K-POP 스타는?',
  '10가지 질문으로 알아보는 나와 닮은 K-POP 스타',
  'celebrity',
  NULL,
  10,
  true
) ON CONFLICT (id) DO NOTHING;

-- 질문 1
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '친구들과 약속이 있을 때 당신은?', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000001', '약속 시간 30분 전에 도착해서 기다린다', 'IU', 1),
('q0000000-0000-0000-0000-000000000001', '딱 맞춰 도착한다', 'BTS', 2),
('q0000000-0000-0000-0000-000000000001', '조금 늦게 도착하는 편이다', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000001', '시간 개념이 없다', 'NEWJEANS', 4);

-- 질문 2
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '스트레스를 풀 때 주로?', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000002', '혼자 조용히 쉰다', 'IU', 1),
('q0000000-0000-0000-0000-000000000002', '운동을 한다', 'BTS', 2),
('q0000000-0000-0000-0000-000000000002', '친구들과 만나 수다를 떤다', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000002', '음악을 듣거나 춤을 춘다', 'NEWJEANS', 4);

-- 질문 3
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '좋아하는 음악 스타일은?', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000003', '감성적인 발라드', 'IU', 1),
('q0000000-0000-0000-0000-000000000003', '파워풀한 힙합', 'BTS', 2),
('q0000000-0000-0000-0000-000000000003', '강렬한 EDM', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000003', '트렌디한 팝', 'NEWJEANS', 4);

-- 질문 4
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '패션 스타일은?', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000004', '심플하고 깔끔한 스타일', 'IU', 1),
('q0000000-0000-0000-0000-000000000004', '힙하고 스트릿한 스타일', 'BTS', 2),
('q0000000-0000-0000-0000-000000000004', '화려하고 럭셔리한 스타일', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000004', 'Y2K 레트로 스타일', 'NEWJEANS', 4);

-- 질문 5
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '주말에 주로 무엇을 하나요?', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000005', '집에서 휴식', 'IU', 1),
('q0000000-0000-0000-0000-000000000005', '운동이나 취미 활동', 'BTS', 2),
('q0000000-0000-0000-0000-000000000005', '친구들과 외출', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000005', 'SNS하거나 쇼핑', 'NEWJEANS', 4);

-- 질문 6
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '처음 보는 사람들과의 모임에서 당신은?', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000006', '조용히 듣기만 한다', 'IU', 1),
('q0000000-0000-0000-0000-000000000006', '필요할 때만 이야기한다', 'BTS', 2),
('q0000000-0000-0000-0000-000000000006', '적극적으로 대화를 이끈다', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000006', '장난치며 분위기를 띄운다', 'NEWJEANS', 4);

-- 질문 7
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '당신의 장점은?', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000007', '섬세하고 감성적이다', 'IU', 1),
('q0000000-0000-0000-0000-000000000007', '리더십이 있고 책임감이 강하다', 'BTS', 2),
('q0000000-0000-0000-0000-000000000007', '자신감 넘치고 카리스마가 있다', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000007', '밝고 긍정적이다', 'NEWJEANS', 4);

-- 질문 8
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'SNS는 얼마나 자주 하나요?', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000008', '거의 안 한다', 'IU', 1),
('q0000000-0000-0000-0000-000000000008', '가끔 한다', 'BTS', 2),
('q0000000-0000-0000-0000-000000000008', '자주 한다', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000008', '하루종일 한다', 'NEWJEANS', 4);

-- 질문 9
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '좋아하는 색깔은?', 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000009', '파스텔 톤', 'IU', 1),
('q0000000-0000-0000-0000-000000000009', '어두운 톤', 'BTS', 2),
('q0000000-0000-0000-0000-000000000009', '비비드한 원색', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000009', '트렌디한 색상', 'NEWJEANS', 4);

-- 질문 10
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', '당신의 매력 포인트는?', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
('q0000000-0000-0000-0000-000000000010', '귀여운 외모', 'IU', 1),
('q0000000-0000-0000-0000-000000000010', '멋진 실력', 'BTS', 2),
('q0000000-0000-0000-0000-000000000010', '강한 인상', 'BLACKPINK', 3),
('q0000000-0000-0000-0000-000000000010', '상큼한 분위기', 'NEWJEANS', 4);

-- 결과 타입들
INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'IU',
  'IU (아이유)',
  '당신은 아이유와 닮았습니다! 섬세하고 감성적이며, 차분한 매력을 가진 당신입니다.',
  '• 섬세한 감성의 소유자\n• 조용하지만 깊이 있는 매력\n• 예술적인 감각이 뛰어남\n• 신중하고 성실한 성격',
  '당신에게 어울리는 것들:\n• 조용한 카페에서 책 읽기\n• 감성적인 음악 감상\n• 혼자만의 시간 갖기'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'BTS',
  'BTS (방탄소년단)',
  '당신은 BTS와 닮았습니다! 리더십이 있고 책임감이 강하며, 목표를 향해 노력하는 당신입니다.',
  '• 강한 리더십과 책임감\n• 노력파이자 완벽주의자\n• 팀워크를 중시함\n• 글로벌한 마인드',
  '당신에게 어울리는 것들:\n• 운동이나 댄스\n• 팀 프로젝트나 스터디\n• 자기계발 활동'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'BLACKPINK',
  'BLACKPINK (블랙핑크)',
  '당신은 BLACKPINK와 닮았습니다! 자신감 넘치고 카리스마가 있으며, 패셔니스타인 당신입니다.',
  '• 강한 자신감과 카리스마\n• 패션 센스가 뛰어남\n• 사교적이고 적극적\n• 럭셔리한 취향',
  '당신에게 어울리는 것들:\n• 쇼핑과 패션\n• 파티나 모임\n• 사진 찍기와 SNS'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'NEWJEANS',
  'NewJeans (뉴진스)',
  '당신은 NewJeans와 닮았습니다! 밝고 긍정적이며, 트렌디한 감각을 가진 당신입니다.',
  '• 밝고 긍정적인 에너지\n• 트렌드에 민감함\n• 친근하고 사교적\n• Y2K 감성',
  '당신에게 어울리는 것들:\n• SNS 활동\n• 친구들과의 외출\n• 새로운 트렌드 탐방'
);

-- 완료!

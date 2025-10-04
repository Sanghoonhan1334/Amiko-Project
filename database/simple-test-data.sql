-- ============================================
-- 간단한 샘플 테스트 데이터
-- Simple Sample Test Data
-- ============================================

-- 테스트 퀴즈들 추가 (기존에 없는 경우만)
INSERT INTO public.quizzes (
  id,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active
) VALUES (
  'test-001-personality',
  'MBTI 간단 테스트',
  '당신의 MBTI 성격 유형을 간단히 알아보세요',
  'personality',
  NULL,
  8,
  true
), (
  'test-002-love',
  '사랑 스타일 테스트',
  '당신의 사랑 방식을 알아보세요',
  'fun',
  NULL,
  6,
  true
), (
  'test-003-music',
  '음악 취향 테스트',
  '어떤 음악을 좋아하시나요?',
  'fun',
  NULL,
  5,
  true
) ON CONFLICT (id) DO NOTHING;

-- MBTI 간단 테스트 질문들
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
-- 질문 1
('q-simple-001', 'test-001-personality', '친구들과 모임에서 당신은?', 1),
('q-simple-002', 'test-001-personality', '새로운 환경에서는?', 2),
('q-simple-003', 'test-001-personality', '문제 해결 방식은?', 3),
('q-simple-004', 'test-001-personality', '중요한 결정을 내릴 때는?', 4),
('q-simple-005', 'test-001-personality', '일 처리 방식은?', 5),
('q-simple-006', 'test-001-personality', '스트레스를 받을 때는?', 6),
('q-simple-007', 'test-001-personality', '휴식을 취할 때는?', 7),
('q-simple-008', 'test-001-personality', '정보를 받을 때는?', 8);

-- MBTI 간단 테스트 선택지들
INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
-- 질문 1: 친구들과 모임에서
('q-simple-001', '적극적으로 대화에 참여한다', 'E', 1),
('q-simple-001', '조용히 듣고 있을 때가 많다', 'I', 2),

-- 질문 2: 새로운 환경에서는
('q-simple-002', '빨리 다른 사람들과 어울린다', 'E', 1),
('q-simple-002', '시간이 걸리며 신중하다', 'I', 2),

-- 질문 3: 문제 해결 방식은
('q-simple-003', '단계별로 차근차근 해결한다', 'S', 1),
('q-simple-003', '전체적인 그림을 먼저 파악한다', 'N', 2),

-- 질문 4: 중요한 결정을 내릴 때는
('q-simple-004', '논리적이고 객관적으로 판단한다', 'T', 1),
('q-simple-004', '감정과 가치관을 고려한다', 'F', 2),

-- 질문 5: 일 처리 방식은
('q-simple-005', '계획을 세우고 순서대로 진행한다', 'J', 1),
('q-simple-005', '유연하게 상황에 맞춰 진행한다', 'P', 2),

-- 질문 6: 스트레스를 받을 때는
('q-simple-006', '다른 사람들과 활동하기를 좋아한다', 'E', 1),
('q-simple-006', '혼자만의 시간이 필요하다', 'I', 2),

-- 질문 7: 휴식을 취할 때는
('q-simple-007', '활동적인 휴식을 선호한다', 'E', 1),
('q-simple-007', '조용한 휴식을 선호한다', 'I', 2),

-- 질문 8: 정보를 받을 때는
('q-simple-008', '구체적이고 실제적인 것에 관심이 많다', 'S', 1),
('q-simple-008', '추상적이고 가능성에 관심이 많다', 'N', 2);

-- MBTI 결과 데이터
INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation) VALUES
-- INTJ
('test-001-personality', 'INTJ', 'INTJ - 건축가', '전략적이고 독립적인 생각의 소유자입니다.', 
'독립적이고 목표 지향적이며 논리적이고 체계적으로 사고합니다.', 
'독서와 자기계발, 전략적 계획 수립을 추천합니다.'),

-- ENFP  
('test-001-personality', 'ENFP', 'ENFP - 운동가', '열정적이고 창의적인 영감을 주는 사람입니다.',
'열정적이고 창의적이며 사교적이고 진정성 있습니다.',
'창의적 프로젝트와 새로운 사람들과의 만남을 추천합니다.'),

-- ISTJ
('test-001-personality', 'ISTJ', 'ISTJ - 관리자', '실용적이고 사실적인 논리주의자입니다.',
'실용적이고 사실적이며 책임감이 강하고 조직적입니다.',
'구체적인 과제 수행과 체계적인 일 처리를 추천합니다.'),

-- ESFP
('test-001-personality', 'ESFP', 'ESFP - 연예인', '자유롭고 활기찬 연예인입니다.',
'자유롭고 열정적이며 사교적이고 친근합니다.',
'사회적 활동과 예술적 표현을 추천합니다.');

-- 사랑 스타일 테스트 질문들
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q-love-001', 'test-002-love', '좋아하는 사람과 함께 있을 때 무엇이 가장 중요해요?', 1),
('q-love-002', 'test-002-love', '사랑을 표현하는 방법은?', 2),
('q-love-003', 'test-002-love', '특별한 날에 무엇을 받고 싶어요?', 3),
('q-love-004', 'test-002-love', '스트레스를 받을 때 무엇이 도움이 돼요?', 4),
('q-love-005', 'test-002-love', '사랑하는 사람에게 무엇을 해주고 싶어요?', 5),
('q-love-006', 'test-002-love', '갈등 상황에서는 어떻게 해결하고 싶어요?', 6);

-- 사랑 스타일 테스트 선택지들
INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
-- 질문 1
('q-love-001', '함께 할 일이 많아요', 'Quality_Time', 1),
('q-love-001', '깜짝 선물이나 메시지', 'Gifts', 2),
('q-love-001', '서로 도와주고 돌봐요', 'Acts_of_Service', 3),
('q-love-001', '포옹이나 키스 같은 스킨십', 'Physical_Touch', 4),
('q-love-001', '사랑한다는 말이나 격려', 'Words_of_Affirmation', 5),

-- 질문 2
('q-love-002', '말보다는 행동으로 표현', 'Acts_of_Service', 1),
('q-love-002', '"사랑해" 같은 말을 자주 해요', 'Words_of_Affirmation', 2),
('q-love-002', '함께 시간을 보내요', 'Quality_Time', 3),
('q-love-002', '스킨십으로 표현해요', 'Physical_Touch', 4),

-- 나머지 질문들도 유사하게 추가
('q-love-003', '의미 있는 선물', 'Gifts', 1),
('q-love-003', '진심이 담긴 말', 'Words_of_Affirmation', 2),
('q-love-004', '돌봐주는 행동', 'Acts_of_Service', 3),
('q-love-004', '포옹과 같은 스킨십', 'Physical_Touch', 4),
('q-love-005', '자주 만나서 많은 시간 보내기', 'Quality_Time', 1),
('q-love-005', '작은 깜짝 선물', 'Gifts', 2),
('q-love-006', '대화로 해결하기', 'Words_of_Affirmation', 1),
('q-love-006', '함께 활동하며 해결하기', 'Quality_Time', 2);

-- 사랑 스타일 결과
INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation) VALUES
('test-002-love', 'Quality_Time', '품질 시간형', '함께 보내는 시간의 질이 가장 중요합니다.',
'깊좇 대화와 목중을 선호하며 공동 활동을 즐깁니다.',
'깊좇 있는 대화와 함께 하는 활동을 추천합니다.'),

('test-002-love', 'Words_of_Affirmation', '인정의 말씀형', '사랑한다는 말과 격려가 가장 중요합니다.',
'말로 표현받는 것을 중요하게 여기고 인정과 격려가 필요합니다.',
'자주 사랑 표현과 긍정적 피드백을 추천합니다.'),

('test-002-love', 'Acts_of_Service', '봉사의 행동형', '배려하는 행동으로 느끼는 사랑이 가장 중요합니다.',
'도움과 봉사로 사려를 느끼며 실질적 도움을 선호합니다.',
'실질적 도움과 책임감 있는 행동을 추천합니다.'),

('test-002-love', 'Physical_Touch', '신체적 접촉형', '포옹, 키스, 스킨십이 가장 중요합니다.',
'스킨십으로 소통하며 안전감과 연결감을 추구합니다.',
'포옹과 스킨십으로 안전한 공간을 만들어주세요.'),

('test-002-love', 'Gifts', '선물형', '고민하고 선택한 선물이 가장 큰 사랑의 표현입니다.',
'의미 있는 선물과 기억에 남는 것을 선호합니다.',
'의미 있는 선물과 깜짝 서프라이즈를 추천합니다.');

-- 음악 취향 테스트 질문들 (간단하게)
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q-music-001', 'test-003-music', '좋아하는 음악 스타일은?', 1),
('q-music-002', 'test-003-music', '음악을 들을 때 느끼는 감정은?', 2),
('q-music-003', 'test-003-music', '어떤 상황에서 음악을 듣나요?', 3),
('q-music-004', 'test-003-music', '음악과 춤, 어떤 것을 더 좋아하나요?', 4),
('q-music-005', 'test-003-music', '좋아하는 리듬감은?', 5);

INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
-- 질문 1
('q-music-001', '감성적인 발라드', 'Ballad', 1),
('q-music-001', '비트가 강한 힙합', 'HipHop', 2),
('q-music-001', '신나는 팝송', 'Pop', 3),
('q-music-001', '에너지 넘치는 EDM', 'EDM', 4),

-- 질문 2
('q-music-002', '평온하고 차분해집니다', 'Calm', 1),
('q-music-002', '에너지가 넘쳐오릅니다', 'Energetic', 2),
('q-music-002', '감성에 젖어들어요', 'Emotional', 3),
('q-music-002', '춤추고 싶어집니다', 'Dance', 4);

INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation) VALUES
('test-003-music', 'Ballad', '발라드러버', '감성적인 음악을 좋아하는 당신입니다.',
'깊좇 예술적 감성을 가지고 있으며 감성에 젖어들기를 좋아합니다.',
'카페에서 감성적인 음악 감상과 바이올린 연주회 관람을 추천합니다.'),

('test-003-music', 'EDM', '파티애니멀', '에너지 넘치는 음악을 좋아하는 당신입니다.',
'활발하고 리듬감이 있으며 춤과 파티를 좋아합니다.',
'클럽에서 파티하고 페스티벌에 참여하는 것을 추천합니다.');

-- 완료!

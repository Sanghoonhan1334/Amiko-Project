-- ============================================
-- MBTI 기반 K-POP 스타 매칭 퀴즈 데이터
-- ============================================

-- 1. MBTI 퀴즈 생성
INSERT INTO quizzes (title, description, category, total_questions, is_active)
VALUES (
  'K-POP 스타와 나의 MBTI 매칭 테스트',
  '20개의 질문으로 당신의 MBTI를 알아보고, 같은 MBTI를 가진 K-POP 스타를 찾아보세요!',
  'celebrity',
  20,
  true
);

-- 퀴즈 ID 가져오기 (실제 실행 시에는 생성된 ID를 사용)
-- 여기서는 변수로 처리
DO $$
DECLARE
    quiz_uuid UUID;
BEGIN
    -- 퀴즈 ID 가져오기
    SELECT id INTO quiz_uuid FROM quizzes WHERE title = 'K-POP 스타와 나의 MBTI 매칭 테스트' LIMIT 1;
    
    -- 2. MBTI 질문들 추가
    INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
    (quiz_uuid, '새로운 사람들과 만나는 파티에서 당신은?', 1),
    (quiz_uuid, '주말에 시간이 생겼을 때 당신은?', 2),
    (quiz_uuid, '중요한 결정을 내릴 때 당신은?', 3),
    (quiz_uuid, '친구가 고민을 털어놓을 때 당신은?', 4),
    (quiz_uuid, '새로운 프로젝트를 시작할 때 당신은?', 5),
    (quiz_uuid, '스트레스를 받을 때 당신은?', 6),
    (quiz_uuid, '여행을 계획할 때 당신은?', 7),
    (quiz_uuid, '회의에서 당신의 스타일은?', 8),
    (quiz_uuid, '문제를 해결할 때 당신은?', 9),
    (quiz_uuid, '새로운 아이디어를 들었을 때 당신은?', 10),
    (quiz_uuid, '일정이 갑자기 바뀌었을 때 당신은?', 11),
    (quiz_uuid, '친구들과의 모임에서 당신은?', 12),
    (quiz_uuid, '새로운 기술을 배울 때 당신은?', 13),
    (quiz_uuid, '갈등 상황에서 당신은?', 14),
    (quiz_uuid, '목표를 달성하기 위해 당신은?', 15),
    (quiz_uuid, '새로운 환경에 적응할 때 당신은?', 16),
    (quiz_uuid, '정보를 처리할 때 당신은?', 17),
    (quiz_uuid, '의사결정을 할 때 당신은?', 18),
    (quiz_uuid, '새로운 사람을 평가할 때 당신은?', 19),
    (quiz_uuid, '미래를 계획할 때 당신은?', 20);

    -- 3. 질문별 선택지 추가 (MBTI 축별 가중치 포함)
    
    -- 질문 1: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '많은 사람들과 대화하며 에너지를 얻는다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 1;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '소수의 친한 사람들과 깊은 대화를 나눈다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 1;

    -- 질문 2: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '친구들과 함께 외출하거나 활동한다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 2;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '집에서 혼자만의 시간을 즐긴다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 2;

    -- 질문 3: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '구체적인 사실과 데이터를 바탕으로 결정한다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 3;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '직감과 가능성을 바탕으로 결정한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 3;

    -- 질문 4: 사고(T) vs 감정(F)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '논리적이고 객관적인 조언을 해준다', 1, 'T', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 4;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '공감하고 감정적으로 지지해준다', 2, 'F', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 4;

    -- 질문 5: 판단(J) vs 인식(P)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '계획을 세우고 체계적으로 진행한다', 1, 'J', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 5;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '유연하게 진행하며 필요에 따라 조정한다', 2, 'P', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 5;

    -- 질문 6: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '친구들과 만나서 이야기하며 푼다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 6;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '혼자만의 시간을 가지며 푼다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 6;

    -- 질문 7: 판단(J) vs 인식(P)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '미리 세부 계획을 모두 짜놓는다', 1, 'J', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 7;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '대략적인 계획만 세우고 즉흥적으로 즐긴다', 2, 'P', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 7;

    -- 질문 8: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '적극적으로 발언하고 의견을 제시한다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 8;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '신중하게 듣고 필요할 때만 발언한다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 8;

    -- 질문 9: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '단계별로 차근차근 해결한다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 9;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '전체적인 그림을 보고 창의적으로 해결한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 9;

    -- 질문 10: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '실현 가능성과 구체적인 방법을 생각한다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 10;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '새로운 가능성과 잠재력을 생각한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 10;

    -- 질문 11: 판단(J) vs 인식(P)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '계획을 다시 세우고 정리한다', 1, 'J', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 11;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '유연하게 적응하며 새로운 기회로 본다', 2, 'P', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 11;

    -- 질문 12: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '분위기를 이끌고 활발하게 참여한다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 12;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '조용히 참여하며 깊이 있는 대화를 나눈다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 12;

    -- 질문 13: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '기본부터 차근차근 배운다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 13;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '전체적인 개념을 먼저 파악한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 13;

    -- 질문 14: 사고(T) vs 감정(F)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '논리적으로 문제를 분석하고 해결한다', 1, 'T', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 14;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '상대방의 감정을 고려하며 조화를 추구한다', 2, 'F', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 14;

    -- 질문 15: 판단(J) vs 인식(P)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '계획을 세우고 꾸준히 실행한다', 1, 'J', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 15;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '유연하게 접근하며 기회를 포착한다', 2, 'P', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 15;

    -- 질문 16: 외향성(E) vs 내향성(I)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '새로운 사람들과 쉽게 친해진다', 1, 'E', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 16;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '시간을 두고 천천히 친해진다', 2, 'I', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 16;

    -- 질문 17: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '구체적이고 실제적인 정보를 선호한다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 17;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '이론적이고 추상적인 개념을 선호한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 17;

    -- 질문 18: 사고(T) vs 감정(F)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '객관적 기준과 논리를 우선시한다', 1, 'T', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 18;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '사람들의 감정과 가치를 우선시한다', 2, 'F', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 18;

    -- 질문 19: 감각(S) vs 직관(N)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '행동과 결과를 바탕으로 평가한다', 1, 'S', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 19;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '잠재력과 가능성을 바탕으로 평가한다', 2, 'N', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 19;

    -- 질문 20: 판단(J) vs 인식(P)
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '명확한 목표와 계획을 세운다', 1, 'J', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 20;
    
    INSERT INTO quiz_options (question_id, option_text, option_order, mbti_axis, axis_weight) 
    SELECT q.id, '열린 마음으로 다양한 가능성을 고려한다', 2, 'P', 2
    FROM quiz_questions q WHERE q.quiz_id = quiz_uuid AND q.question_order = 20;

END $$;

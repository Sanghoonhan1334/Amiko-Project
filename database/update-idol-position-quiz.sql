-- 🎯 Idol Position Quiz Update Script
-- 기존 idol-position 퀴즈만 업데이트 (새로 생성하지 않음)

-- 1. 먼저 idol-position 퀴즈가 존재하는지 확인
DO $$
DECLARE
    quiz_exists INTEGER;
    quiz_id UUID;
BEGIN
    -- 퀴즈 존재 확인
    SELECT COUNT(*) INTO quiz_exists FROM quizzes WHERE slug = 'idol-position';
    
    IF quiz_exists = 0 THEN
        RAISE EXCEPTION 'Quiz idol-position not found. Do NOT create new one.';
    END IF;
    
    -- 퀴즈 ID 가져오기
    SELECT id INTO quiz_id FROM quizzes WHERE slug = 'idol-position' LIMIT 1;
    
    RAISE NOTICE 'Found quiz idol-position with ID: %', quiz_id;
    
    -- 트랜잭션 시작
    BEGIN
        -- 2. 퀴즈 기본 정보 업데이트
        UPDATE quizzes SET
            title = '¿Qué posición de idol me quedaría mejor?',
            lang = 'es',
            description = 'Descubre tu posición ideal en un grupo de K-pop respondiendo 12 preguntas.',
            updated_at = NOW()
        WHERE slug = 'idol-position';
        
        -- 3. 기존 질문, 선택지, 결과 삭제
        DELETE FROM quiz_options WHERE question_id IN (
            SELECT id FROM quiz_questions WHERE quiz_id = quiz_id
        );
        DELETE FROM quiz_questions WHERE quiz_id = quiz_id;
        DELETE FROM quiz_results WHERE quiz_id = quiz_id;
        
        -- 4. 새로운 질문들 삽입
        INSERT INTO quiz_questions (id, quiz_id, "order", text) VALUES
        (gen_random_uuid(), quiz_id, 1, '¿Sueles imaginar que debutas como idol o influencer?'),
        (gen_random_uuid(), quiz_id, 2, 'Cuando el estrés llega al máximo, ¿qué haces?'),
        (gen_random_uuid(), quiz_id, 3, 'El director te propone ser el centro en el próximo comeback. Tú respondes…'),
        (gen_random_uuid(), quiz_id, 4, 'Una integrante llora por un horario muy duro. ¿Cómo la consuelas?'),
        (gen_random_uuid(), quiz_id, 5, 'Hay un conflicto dentro del equipo. ¿Cómo lo gestionas?'),
        (gen_random_uuid(), quiz_id, 6, '¡Fiesta sorpresa de cumpleaños para ti! Tu primera reacción es…'),
        (gen_random_uuid(), quiz_id, 7, 'En un fansign, conoces a una fan muy nerviosa. Tú…'),
        (gen_random_uuid(), quiz_id, 8, 'Durante la práctica, una integrante se equivoca y se culpa. Tú…'),
        (gen_random_uuid(), quiz_id, 9, '¡Ganaron el premio a la novata del año! En el discurso dices…'),
        (gen_random_uuid(), quiz_id, 10, 'Te ofrecen ir sola a un programa de variedades.'),
        (gen_random_uuid(), quiz_id, 11, 'Están armando el tracklist del nuevo álbum. Tu opinión:'),
        (gen_random_uuid(), quiz_id, 12, 'Al ganar el Daesang (gran premio), ¿qué piensas?');
        
        -- 5. 새로운 선택지들 삽입 (각 질문당 2개씩)
        -- 질문 1
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 1), 1, 
         'Sí, a menudo lo imagino.', '{"centro": 2, "vocalista-principal": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 1), 2, 
         'Casi nunca o no lo pienso.', '{"productora": 2, "cantautora": 2}');
        
        -- 질문 2
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 2), 1, 
         'Quedo con amistades y lo suelto hablando.', '{"centro": 2, "lider": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 2), 2, 
         'Me quedo en casa y busco calmarme.', '{"cantautora": 2, "productora": 2}');
        
        -- 질문 3
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 3), 1, 
         '¡Me encanta! Me pone nerviosa, pero me emociona.', '{"centro": 2, "bailarina-principal": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 3), 2, 
         '¿Puedo con eso…? Me da inseguridad.', '{"productora": 2, "maknae": 2}');
        
        -- 질문 4
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 4), 1, 
         'Empatizo y la abrazo: "debió ser muy difícil".', '{"vocalista-principal": 2, "maknae": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 4), 2, 
         'Le doy ánimo con foco en la meta: "ya casi termina, puedes con esto".', '{"lider": 2, "productora": 2}');
        
        -- 질문 5
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 5), 1, 
         'Escucho a ambas partes y analizo objetivamente.', '{"lider": 2, "productora": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 5), 2, 
         'Ayudo a que se entiendan emocionalmente y se reconcilien.', '{"cantautora": 2, "maknae": 2}');
        
        -- 질문 6
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 6), 1, 
         'Agradecida y tranquila: "¡gracias! comamos juntos".', '{"lider": 2, "productora": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 6), 2, 
         'Casi lloro de emoción y lo recuerdo para siempre.', '{"maknae": 2, "vocalista-principal": 2}');
        
        -- 질문 7
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 7), 1, 
         'Rompo el hielo hablando primero para que se relaje.', '{"centro": 2, "lider": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 7), 2, 
         'Le doy tiempo: "tranquila, habla despacito".', '{"vocalista-principal": 2, "cantautora": 2}');
        
        -- 질문 8
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 8), 1, 
         'La abrazo y la consuelo primero.', '{"maknae": 2, "cantautora": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 8), 2, 
         'Le doy feedback claro y concreto para mejorar.', '{"lider": 2, "productora": 2}');
        
        -- 질문 9
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 9), 1, 
         'Gracias, seguiré trabajando duro.', '{"lider": 2, "productora": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 9), 2, 
         'Esto es un sueño… Gracias fans y miembros, los amo.', '{"vocalista-principal": 2, "maknae": 2}');
        
        -- 질문 10
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 10), 1, 
         '¡Qué divertido! Me intriga qué programa es.', '{"centro": 2, "bailarina-principal": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 10), 2, 
         'Ir sola me carga… es un poco pesado.', '{"productora": 2, "cantautora": 2}');
        
        -- 질문 11
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 11), 1, 
         'Ir por temas más populares y pegadizos.', '{"centro": 2, "vocalista-principal": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 11), 2, 
         'Probar un sonido distinto y experimental.', '{"cantautora": 2, "rapera-principal": 2}');
        
        -- 질문 12
        INSERT INTO quiz_options (id, question_id, "order", text, weights) VALUES
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 12), 1, 
         'Que este momento sea eterno.', '{"vocalista-principal": 2, "centro": 2}'),
        ((SELECT gen_random_uuid()), (SELECT id FROM quiz_questions WHERE quiz_id = quiz_id AND "order" = 12), 2, 
         'Quiero que haya más momentos como este.', '{"productora": 2, "lider": 2}');
        
        -- 6. 새로운 결과들 삽입 (8개)
        INSERT INTO quiz_results (id, quiz_id, slug, title, summary, caution, compatible, incompatible, image) VALUES
        (gen_random_uuid(), quiz_id, 'vocalista-principal', 'Vocalista principal', 
         'Tienes una voz poderosa y emocional que atrapa al público. Brillas en directo y transmites sentimientos con naturalidad, ganando atención sin forzarlo.',
         'Tu perfeccionismo puede presionarte demasiado.',
         'lider', 'rapera-principal', '/quizzes/idol-roles/vocalista.png'),
         
        (gen_random_uuid(), quiz_id, 'bailarina-principal', 'Bailarina principal',
         'Te adaptas a cualquier situación y tu energía en el escenario es magnética; serías candidata top en un survival de baile.',
         'Cuidado con el sobreentrenamiento y las lesiones.',
         'centro', 'productora', '/quizzes/idol-roles/bailarina.png'),
         
        (gen_random_uuid(), quiz_id, 'centro', 'Centro',
         'Amas la libertad y conectas con la audiencia al instante. Tu cariño y expresión convierten cada actuación en un momento memorable.',
         'Sin estructura, puedes dispersarte con facilidad.',
         'bailarina-principal', 'cantautora', '/quizzes/idol-roles/centro.png'),
         
        (gen_random_uuid(), quiz_id, 'cantautora', 'Cantautora',
         'Eres sincera y valiente; en entrevistas y programas destacas por tu franqueza y visión creativa.',
         'A veces puedes sonar demasiado directa.',
         'productora', 'maknae', '/quizzes/idol-roles/cantautora.png'),
         
        (gen_random_uuid(), quiz_id, 'rapera-principal', 'Rapera principal',
         'No siempre muestras tus emociones, pero tienes un mundo interior intenso que explota en el rap con precisión y carisma.',
         'Puedes aislarte cuando te sobrecargas.',
         'cantautora', 'vocalista-principal', '/quizzes/idol-roles/rapera.png'),
         
        (gen_random_uuid(), quiz_id, 'maknae', 'La menor (maknae)',
         'Eres el alma adorable y sociable del grupo. Tu carisma y red de amistades hacen que siempre seas tema de conversación.',
         'Tu espontaneidad puede chocarte con reglas del equipo.',
         'vocalista-principal', 'cantautora', '/quizzes/idol-roles/maknae.png'),
         
        (gen_random_uuid(), quiz_id, 'lider', 'Líder',
         'Te comunicas muy bien con fans y miembros; organizas, contienes y haces que el equipo avance. Eres el centro de la coordinación.',
         'Tiendes a cargar con demasiado peso tú sola.',
         'vocalista-principal', 'rapera-principal', '/quizzes/idol-roles/lider.png'),
         
        (gen_random_uuid(), quiz_id, 'productora', 'Productora',
         'Das consejos realistas y útiles; eres el ''centro de asesoría'' del grupo y cuidas el resultado global del proyecto.',
         'Puedes parecer fría por priorizar lo racional.',
         'cantautora', 'bailarina-principal', '/quizzes/idol-roles/productora.png');
        
        RAISE NOTICE 'Successfully updated idol-position quiz with 12 questions and 8 results';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error updating quiz: %', SQLERRM;
    END;
    
END $$;

-- 검증 쿼리들
SELECT 'Quiz updated successfully!' as status;
SELECT COUNT(*) as question_count FROM quiz_questions WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position');
SELECT COUNT(*) as option_count FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position'));
SELECT COUNT(*) as result_count FROM quiz_results WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position');
SELECT slug, title FROM quiz_results WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position') ORDER BY slug;

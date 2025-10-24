import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. 먼저 idol-position 퀴즈가 존재하는지 확인 (ID로 직접 찾기)
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
      .single()
    
    if (quizError || !existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz idol-position not found. Do NOT create new one.' },
        { status: 404 }
      )
    }
    
    console.log('Found quiz idol-position with ID:', existingQuiz.id)
    
    // 2. 퀴즈 기본 정보 업데이트
    const { error: updateError } = await supabase
      .from('quizzes')
      .update({
        title: '¿Qué posición de idol me quedaría mejor?',
        description: 'Descubre tu posición ideal en un grupo de K-pop respondiendo 12 preguntas.',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
    
    if (updateError) {
      throw updateError
    }
    
    // 3. 기존 질문, 선택지, 결과 삭제
    const { error: deleteOptionsError } = await supabase
      .from('quiz_options')
      .delete()
      .in('question_id', 
        supabase.from('quiz_questions')
          .select('id')
          .eq('quiz_id', existingQuiz.id)
      )
    
    const { error: deleteQuestionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', existingQuiz.id)
    
    const { error: deleteResultsError } = await supabase
      .from('quiz_results')
      .delete()
      .eq('quiz_id', existingQuiz.id)
    
    if (deleteOptionsError || deleteQuestionsError || deleteResultsError) {
      throw new Error('Failed to delete existing data')
    }
    
    // 4. 새로운 질문들 삽입
    const questions = [
      { question_order: 1, question_text: '¿Sueles imaginar que debutas como idol o influencer?' },
      { question_order: 2, question_text: 'Cuando el estrés llega al máximo, ¿qué haces?' },
      { question_order: 3, question_text: 'El director te propone ser el centro en el próximo comeback. Tú respondes…' },
      { question_order: 4, question_text: 'Una integrante llora por un horario muy duro. ¿Cómo la consuelas?' },
      { question_order: 5, question_text: 'Hay un conflicto dentro del equipo. ¿Cómo lo gestionas?' },
      { question_order: 6, question_text: '¡Fiesta sorpresa de cumpleaños para ti! Tu primera reacción es…' },
      { question_order: 7, question_text: 'En un fansign, conoces a una fan muy nerviosa. Tú…' },
      { question_order: 8, question_text: 'Durante la práctica, una integrante se equivoca y se culpa. Tú…' },
      { question_order: 9, question_text: '¡Ganaron el premio a la novata del año! En el discurso dices…' },
      { question_order: 10, question_text: 'Te ofrecen ir sola a un programa de variedades.' },
      { question_order: 11, question_text: 'Están armando el tracklist del nuevo álbum. Tu opinión:' },
      { question_order: 12, question_text: 'Al ganar el Daesang (gran premio), ¿qué piensas?' }
    ]
    
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questions.map(q => ({ ...q, quiz_id: existingQuiz.id, question_type: 'single_choice' })))
      .select('id, question_order')
    
    if (questionsError || !insertedQuestions) {
      throw new Error('Failed to insert questions')
    }
    
    // 5. 새로운 선택지들 삽입
    const options = [
      // 질문 1
      { question_order: 1, option_order: 1, option_text: 'Sí, a menudo lo imagino.', result_type: 'centro', score_value: 2 },
      { question_order: 1, option_order: 2, option_text: 'Casi nunca o no lo pienso.', result_type: 'productora', score_value: 2 },
      // 질문 2
      { question_order: 2, option_order: 1, option_text: 'Quedo con amistades y lo suelto hablando.', result_type: 'centro', score_value: 2 },
      { question_order: 2, option_order: 2, option_text: 'Me quedo en casa y busco calmarme.', result_type: 'cantautora', score_value: 2 },
      // 질문 3
      { question_order: 3, option_order: 1, option_text: '¡Me encanta! Me pone nerviosa, pero me emociona.', result_type: 'centro', score_value: 2 },
      { question_order: 3, option_order: 2, option_text: '¿Puedo con eso…? Me da inseguridad.', result_type: 'productora', score_value: 2 },
      // 질문 4
      { question_order: 4, option_order: 1, option_text: 'Empatizo y la abrazo: "debió ser muy difícil".', result_type: 'vocalista', score_value: 2 },
      { question_order: 4, option_order: 2, option_text: 'Le doy ánimo con foco en la meta: "ya casi termina, puedes con esto".', result_type: 'lider', score_value: 2 },
      // 질문 5
      { question_order: 5, option_order: 1, option_text: 'Escucho a ambas partes y analizo objetivamente.', result_type: 'lider', score_value: 2 },
      { question_order: 5, option_order: 2, option_text: 'Ayudo a que se entiendan emocionalmente y se reconcilien.', result_type: 'cantautora', score_value: 2 },
      // 질문 6
      { question_order: 6, option_order: 1, option_text: 'Agradecida y tranquila: "¡gracias! comamos juntos".', result_type: 'lider', score_value: 2 },
      { question_order: 6, option_order: 2, option_text: 'Casi lloro de emoción y lo recuerdo para siempre.', result_type: 'maknae', score_value: 2 },
      // 질문 7
      { question_order: 7, option_order: 1, option_text: 'Rompo el hielo hablando primero para que se relaje.', result_type: 'centro', score_value: 2 },
      { question_order: 7, option_order: 2, option_text: 'Le doy tiempo: "tranquila, habla despacito".', result_type: 'vocalista', score_value: 2 },
      // 질문 8
      { question_order: 8, option_order: 1, option_text: 'La abrazo y la consuelo primero.', result_type: 'maknae', score_value: 2 },
      { question_order: 8, option_order: 2, option_text: 'Le doy feedback claro y concreto para mejorar.', result_type: 'lider', score_value: 2 },
      // 질문 9
      { question_order: 9, option_order: 1, option_text: 'Gracias, seguiré trabajando duro.', result_type: 'lider', score_value: 2 },
      { question_order: 9, option_order: 2, option_text: 'Esto es un sueño… Gracias fans y miembros, los amo.', result_type: 'vocalista', score_value: 2 },
      // 질문 10
      { question_order: 10, option_order: 1, option_text: '¡Qué divertido! Me intriga qué programa es.', result_type: 'centro', score_value: 2 },
      { question_order: 10, option_order: 2, option_text: 'Ir sola me carga… es un poco pesado.', result_type: 'productora', score_value: 2 },
      // 질문 11
      { question_order: 11, option_order: 1, option_text: 'Ir por temas más populares y pegadizos.', result_type: 'centro', score_value: 2 },
      { question_order: 11, option_order: 2, option_text: 'Probar un sonido distinto y experimental.', result_type: 'cantautora', score_value: 2 },
      // 질문 12
      { question_order: 12, option_order: 1, option_text: 'Que este momento sea eterno.', result_type: 'vocalista', score_value: 2 },
      { question_order: 12, option_order: 2, option_text: 'Quiero que haya más momentos como este.', result_type: 'lider', score_value: 2 }
    ]
    
    // 각 선택지를 해당 질문에 연결
    const optionsToInsert = options.map(option => {
      const question = insertedQuestions.find(q => q.question_order === option.question_order)
      return {
        question_id: question?.id,
        option_order: option.option_order,
        option_text: option.option_text,
        result_type: option.result_type,
        score_value: option.score_value,
        mbti_axis: null,
        axis_weight: 0
      }
    }).filter(option => option.question_id)
    
    const { error: optionsError } = await supabase
      .from('quiz_options')
      .insert(optionsToInsert)
    
    if (optionsError) {
      throw new Error('Failed to insert options')
    }
    
    // 6. 새로운 결과들 삽입
    const results = [
      {
        result_type: 'vocalista',
        title: 'Vocalista principal',
        description: 'Tienes una voz poderosa y emocional que atrapa al público. Brillas en directo y transmites sentimientos con naturalidad, ganando atención sin forzarlo.',
        image_url: '/quizzes/idol-roles/vocalista.png'
      },
      {
        result_type: 'bailarina',
        title: 'Bailarina principal',
        description: 'Te adaptas a cualquier situación y tu energía en el escenario es magnética; serías candidata top en un survival de baile.',
        image_url: '/quizzes/idol-roles/bailarina.png'
      },
      {
        result_type: 'centro',
        title: 'Centro',
        description: 'Amas la libertad y conectas con la audiencia al instante. Tu cariño y expresión convierten cada actuación en un momento memorable.',
        image_url: '/quizzes/idol-roles/centro.png'
      },
      {
        result_type: 'cantautora',
        title: 'Cantautora',
        description: 'Eres sincera y valiente; en entrevistas y programas destacas por tu franqueza y visión creativa.',
        image_url: '/quizzes/idol-roles/cantautora.png'
      },
      {
        result_type: 'rapera',
        title: 'Rapera principal',
        description: 'No siempre muestras tus emociones, pero tienes un mundo interior intenso que explota en el rap con precisión y carisma.',
        image_url: '/quizzes/idol-roles/rapera.png'
      },
      {
        result_type: 'maknae',
        title: 'La menor (maknae)',
        description: 'Eres el alma adorable y sociable del grupo. Tu carisma y red de amistades hacen que siempre seas tema de conversación.',
        image_url: '/quizzes/idol-roles/maknae.png'
      },
      {
        result_type: 'lider',
        title: 'Líder',
        description: 'Te comunicas muy bien con fans y miembros; organizas, contienes y haces que el equipo avance. Eres el centro de la coordinación.',
        image_url: '/quizzes/idol-roles/lider.png'
      },
      {
        result_type: 'productora',
        title: 'Productora',
        description: 'Das consejos realistas y útiles; eres el "centro de asesoría" del grupo y cuidas el resultado global del proyecto.',
        image_url: '/quizzes/idol-roles/productora.png'
      }
    ]
    
    const { error: resultsError } = await supabase
      .from('quiz_results')
      .insert(results.map(result => ({ ...result, quiz_id: existingQuiz.id })))
    
    if (resultsError) {
      throw new Error('Failed to insert results')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully updated idol-position quiz with 12 questions and 8 results',
      quiz_id: existingQuiz.id
    })
    
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz', details: error.message },
      { status: 500 }
    )
  }
}

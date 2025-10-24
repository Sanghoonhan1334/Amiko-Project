import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const quizId = 'dea20361-fd46-409d-880f-f91869c1d184'
    
    // 제공받은 정확한 데이터
    const questions = [
      { order: 1, text: '¿Sueles imaginar que debutas como idol o influencer?' },
      { order: 2, text: 'Cuando el estrés llega al máximo, ¿qué haces?' },
      { order: 3, text: 'El director te propone ser el centro en el próximo comeback. Tú respondes…' },
      { order: 4, text: 'Una integrante llora por un horario muy duro. ¿Cómo la consuelas?' },
      { order: 5, text: 'Hay un conflicto dentro del equipo. ¿Cómo lo gestionas?' },
      { order: 6, text: '¡Fiesta sorpresa de cumpleaños para ti! Tu primera reacción es…' },
      { order: 7, text: 'En un fansign, conoces a una fan muy nerviosa. Tú…' },
      { order: 8, text: 'Durante la práctica, una integrante se equivoca y se culpa. Tú…' },
      { order: 9, text: '¡Ganaron el premio a la novata del año! En el discurso dices…' },
      { order: 10, text: 'Te ofrecen ir sola a un programa de variedades.' },
      { order: 11, text: 'Están armando el tracklist del nuevo álbum. Tu opinión:' },
      { order: 12, text: 'Al ganar el Daesang (gran premio), ¿qué piensas?' }
    ]
    
    const options = [
      // 질문 1
      { question_order: 1, option_order: 1, text: 'Sí, a menudo lo imagino.', result_type: 'centro', score: 2 },
      { question_order: 1, option_order: 2, text: 'Casi nunca o no lo pienso.', result_type: 'productora', score: 2 },
      // 질문 2
      { question_order: 2, option_order: 1, text: 'Quedo con amistades y lo suelto hablando.', result_type: 'centro', score: 2 },
      { question_order: 2, option_order: 2, text: 'Me quedo en casa y busco calmarme.', result_type: 'cantautora', score: 2 },
      // 질문 3
      { question_order: 3, option_order: 1, text: '¡Me encanta! Me pone nerviosa, pero me emociona.', result_type: 'centro', score: 2 },
      { question_order: 3, option_order: 2, text: '¿Puedo con eso…? Me da inseguridad.', result_type: 'productora', score: 2 },
      // 질문 4
      { question_order: 4, option_order: 1, text: 'Empatizo y la abrazo: "debió ser muy difícil".', result_type: 'vocalista', score: 2 },
      { question_order: 4, option_order: 2, text: 'Le doy ánimo con foco en la meta: "ya casi termina, puedes con esto".', result_type: 'lider', score: 2 },
      // 질문 5
      { question_order: 5, option_order: 1, text: 'Escucho a ambas partes y analizo objetivamente.', result_type: 'lider', score: 2 },
      { question_order: 5, option_order: 2, text: 'Ayudo a que se entiendan emocionalmente y se reconcilien.', result_type: 'cantautora', score: 2 },
      // 질문 6
      { question_order: 6, option_order: 1, text: 'Agradecida y tranquila: "¡gracias! comamos juntos".', result_type: 'lider', score: 2 },
      { question_order: 6, option_order: 2, text: 'Casi lloro de emoción y lo recuerdo para siempre.', result_type: 'maknae', score: 2 },
      // 질문 7
      { question_order: 7, option_order: 1, text: 'Rompo el hielo hablando primero para que se relaje.', result_type: 'centro', score: 2 },
      { question_order: 7, option_order: 2, text: 'Le doy tiempo: "tranquila, habla despacito".', result_type: 'vocalista', score: 2 },
      // 질문 8
      { question_order: 8, option_order: 1, text: 'La abrazo y la consuelo primero.', result_type: 'maknae', score: 2 },
      { question_order: 8, option_order: 2, text: 'Le doy feedback claro y concreto para mejorar.', result_type: 'lider', score: 2 },
      // 질문 9
      { question_order: 9, option_order: 1, text: 'Gracias, seguiré trabajando duro.', result_type: 'lider', score: 2 },
      { question_order: 9, option_order: 2, text: 'Esto es un sueño… Gracias fans y miembros, los amo.', result_type: 'vocalista', score: 2 },
      // 질문 10
      { question_order: 10, option_order: 1, text: '¡Qué divertido! Me intriga qué programa es.', result_type: 'centro', score: 2 },
      { question_order: 10, option_order: 2, text: 'Ir sola me carga… es un poco pesado.', result_type: 'productora', score: 2 },
      // 질문 11
      { question_order: 11, option_order: 1, text: 'Ir por temas más populares y pegadizos.', result_type: 'centro', score: 2 },
      { question_order: 11, option_order: 2, text: 'Probar un sonido distinto y experimental.', result_type: 'cantautora', score: 2 },
      // 질문 12
      { question_order: 12, option_order: 1, text: 'Que este momento sea eterno.', result_type: 'vocalista', score: 2 },
      { question_order: 12, option_order: 2, text: 'Quiero que haya más momentos como este.', result_type: 'lider', score: 2 }
    ]
    
    // 1. 모든 질문 업데이트
    for (const question of questions) {
      const { error: updateQuestionError } = await supabase
        .from('quiz_questions')
        .update({
          question_text: question.text
        })
        .eq('quiz_id', quizId)
        .eq('question_order', question.order)
      
      if (updateQuestionError) {
        throw new Error(`Failed to update question ${question.order}: ${updateQuestionError.message}`)
      }
    }
    
    // 2. 모든 선택지 업데이트
    for (const option of options) {
      // 먼저 질문 ID를 가져오기
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('question_order', option.question_order)
        .single()
      
      if (questionError || !question) {
        throw new Error(`Question ${option.question_order} not found`)
      }
      
      // 선택지 업데이트
      const { error: updateOptionError } = await supabase
        .from('quiz_options')
        .update({
          option_text: option.text,
          result_type: option.result_type,
          score_value: option.score
        })
        .eq('question_id', question.id)
        .eq('option_order', option.option_order)
      
      if (updateOptionError) {
        throw new Error(`Failed to update option for question ${option.question_order}: ${updateOptionError.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully updated all questions and options',
      quiz_id: quizId
    })
    
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz', details: error.message },
      { status: 500 }
    )
  }
}

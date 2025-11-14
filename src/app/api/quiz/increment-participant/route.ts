import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 퀴즈 참여자 수 증가 API
export async function POST(request: NextRequest) {
  try {
    const { quizId } = await request.json()

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // fortune-test-2024는 slug로 직접 처리 (SQL 함수 의존성 제거)
    if (quizId === 'fortune-test-2024') {
      console.log('[INCREMENT_PARTICIPANT] 운세 테스트 참여자 수 증가 (slug=fortune)')
      
      // 먼저 퀴즈 조회
      const { data: quiz, error: fetchError } = await supabaseServer
        .from('quizzes')
        .select('id, slug, total_participants')
        .eq('slug', 'fortune')
        .maybeSingle()

      if (!quiz) {
        // 퀴즈가 없으면 생성
        console.log('[INCREMENT_PARTICIPANT] 퀴즈 없음, 생성 중...')
        const { data: newQuiz, error: createError } = await supabaseServer
          .from('quizzes')
          .insert({
            slug: 'fortune',
            title: 'Test de Fortuna Personalizada',
            description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
            category: 'fortune',
            thumbnail_url: '/quizzes/fortune/cover/cover.png',
            total_questions: 9,
            total_participants: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, slug, total_participants')
          .single()

        if (createError) {
          console.error('[INCREMENT_PARTICIPANT] 퀴즈 생성 실패:', createError)
          // 중복 키 에러면 조회 후 증가
          if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
            console.log('[INCREMENT_PARTICIPANT] 중복 키 에러, 기존 퀴즈 조회 후 증가...')
            const { data: existingQuiz, error: retryError } = await supabaseServer
              .from('quizzes')
              .select('id, slug, total_participants')
              .eq('slug', 'fortune')
              .maybeSingle()
            
            if (retryError || !existingQuiz) {
              console.error('[INCREMENT_PARTICIPANT] 기존 퀴즈 조회 실패:', retryError)
              return NextResponse.json(
                { error: 'Failed to fetch existing quiz', details: retryError?.message },
                { status: 500 }
              )
            }
            
            const newCount = (existingQuiz.total_participants || 0) + 1
            const { error: updateError } = await supabaseServer
              .from('quizzes')
              .update({ total_participants: newCount, updated_at: new Date().toISOString() })
              .eq('slug', 'fortune')
            
            if (updateError) {
              console.error('[INCREMENT_PARTICIPANT] 참여자 수 증가 실패:', updateError)
              return NextResponse.json(
                { error: 'Failed to increment participant count', details: updateError.message },
                { status: 500 }
              )
            }
            
            console.log('[INCREMENT_PARTICIPANT] 참여자 수 증가 완료:', newCount)
            return NextResponse.json({
              success: true,
              participantCount: newCount
            })
          }
          
          return NextResponse.json(
            { error: 'Failed to create quiz', details: createError.message },
            { status: 500 }
          )
        }

        console.log('[INCREMENT_PARTICIPANT] 퀴즈 생성 완료:', newQuiz.id)
        return NextResponse.json({
          success: true,
          participantCount: newQuiz.total_participants || 1
        })
      }

      // 참여자 수 증가
      const newCount = (quiz.total_participants || 0) + 1
      const { error: updateError } = await supabaseServer
        .from('quizzes')
        .update({ total_participants: newCount, updated_at: new Date().toISOString() })
        .eq('slug', 'fortune')

      if (updateError) {
        console.error('[INCREMENT_PARTICIPANT] 참여자 수 증가 실패:', updateError)
        return NextResponse.json(
          { error: 'Failed to increment participant count', details: updateError.message },
          { status: 500 }
        )
      }

      console.log('[INCREMENT_PARTICIPANT] 참여자 수 증가 완료:', newCount)
      return NextResponse.json({
        success: true,
        participantCount: newCount
      })
    }

    // 일반 퀴즈는 id로 조회 (UUID 형식)
    const { data: quiz, error: fetchError } = await supabaseServer
      .from('quizzes')
      .select('id, total_participants')
      .eq('id', quizId)
      .maybeSingle()

    if (!quiz) {
      console.error('[INCREMENT_PARTICIPANT] 퀴즈를 찾을 수 없음:', quizId)
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // 참여자 수 증가
    const newCount = (quiz.total_participants || 0) + 1
    const { error: updateError } = await supabaseServer
      .from('quizzes')
      .update({ total_participants: newCount })
      .eq('id', quizId)

    if (updateError) {
      console.error('[INCREMENT_PARTICIPANT] 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: 'Failed to increment participant count' },
        { status: 500 }
      )
    }

    console.log('[INCREMENT_PARTICIPANT] 참여자 수 증가:', quizId, newCount)

    return NextResponse.json({
      success: true,
      participantCount: newCount
    })

  } catch (error: any) {
    console.error('[INCREMENT_PARTICIPANT] 에러:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


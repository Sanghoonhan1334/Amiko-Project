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

    // 현재 참가자 수 조회
    const { data: quiz, error: fetchError } = await supabaseServer
      .from('quizzes')
      .select('id, total_participants')
      .eq('id', quizId)
      .single()

    if (fetchError || !quiz) {
      console.error('[INCREMENT_PARTICIPANT] 퀴즈 조회 실패:', fetchError)
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


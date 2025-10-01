import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 퀴즈 상세 조회 (질문 및 선택지 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = await params

    console.log('[QUIZ_DETAIL_API] 퀴즈 상세 조회:', id)

    // 퀴즈 기본 정보 조회
    const { data: quiz, error: quizError } = await supabaseServer
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        category,
        thumbnail_url,
        total_questions,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (quizError || !quiz) {
      console.error('[QUIZ_DETAIL_API] 퀴즈 조회 실패:', quizError)
      return NextResponse.json(
        { error: '퀴즈를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 질문 및 선택지 조회
    const { data: questions, error: questionsError } = await supabaseServer
      .from('quiz_questions')
      .select(`
        id,
        question_text,
        question_order,
        quiz_options (
          id,
          option_text,
          result_type,
          option_order
        )
      `)
      .eq('quiz_id', id)
      .order('question_order', { ascending: true })

    if (questionsError) {
      console.error('[QUIZ_DETAIL_API] 질문 조회 실패:', questionsError)
      return NextResponse.json(
        { error: '질문 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 선택지 정렬
    const sortedQuestions = questions?.map(q => ({
      ...q,
      quiz_options: q.quiz_options?.sort((a: any, b: any) => a.option_order - b.option_order) || []
    }))

    console.log('[QUIZ_DETAIL_API] 퀴즈 상세 조회 성공:', { 
      quizId: quiz.id, 
      questionsCount: sortedQuestions?.length || 0 
    })

    return NextResponse.json({
      success: true,
      quiz: {
        ...quiz,
        questions: sortedQuestions || []
      }
    })

  } catch (error) {
    console.error('[QUIZ_DETAIL_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 수정 (관리자 전용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = await params

    // 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { title, description, category, thumbnail_url, is_active } = await request.json()

    // 퀴즈 수정
    const { data: quiz, error: updateError } = await supabaseServer
      .from('quizzes')
      .update({
        title,
        description,
        category,
        thumbnail_url,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !quiz) {
      console.error('[QUIZ_UPDATE_API] 퀴즈 수정 실패:', updateError)
      return NextResponse.json(
        { error: '퀴즈 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[QUIZ_UPDATE_API] 퀴즈 수정 성공:', quiz.id)

    return NextResponse.json({
      success: true,
      quiz,
      message: '퀴즈가 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('[QUIZ_UPDATE_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = await params

    // 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 퀴즈 비활성화 (soft delete)
    const { error: deleteError } = await supabaseServer
      .from('quizzes')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('[QUIZ_DELETE_API] 퀴즈 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '퀴즈 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[QUIZ_DELETE_API] 퀴즈 삭제 성공:', id)

    return NextResponse.json({
      success: true,
      message: '퀴즈가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[QUIZ_DELETE_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


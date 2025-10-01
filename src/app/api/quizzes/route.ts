import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 퀴즈 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 카테고리 필터
    const isActive = searchParams.get('isActive') !== 'false' // 기본값 true

    console.log('[QUIZZES_API] 퀴즈 목록 조회:', { category, isActive })

    // 퀴즈 목록 쿼리
    let query = supabaseServer
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
      .order('created_at', { ascending: false })

    // 활성 퀴즈만 조회
    if (isActive) {
      query = query.eq('is_active', true)
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }

    const { data: quizzes, error } = await query

    if (error) {
      console.error('[QUIZZES_API] 퀴즈 목록 조회 실패:', error)
      return NextResponse.json(
        { error: '퀴즈 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[QUIZZES_API] 퀴즈 목록 조회 성공:', quizzes?.length || 0)

    return NextResponse.json({
      success: true,
      quizzes: quizzes || [],
      total: quizzes?.length || 0
    })

  } catch (error) {
    console.error('[QUIZZES_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

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

    const { title, description, category, thumbnail_url, questions } = await request.json()

    if (!title || !description || !category || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 퀴즈 생성
    const { data: quiz, error: quizError } = await supabaseServer
      .from('quizzes')
      .insert({
        title,
        description,
        category,
        thumbnail_url,
        total_questions: questions.length,
        created_by: user.id
      })
      .select()
      .single()

    if (quizError || !quiz) {
      console.error('[QUIZZES_API] 퀴즈 생성 실패:', quizError)
      return NextResponse.json(
        { error: '퀴즈 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 질문 및 선택지 생성
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      // 질문 생성
      const { data: question, error: questionError } = await supabaseServer
        .from('quiz_questions')
        .insert({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_order: i + 1
        })
        .select()
        .single()

      if (questionError || !question) {
        console.error('[QUIZZES_API] 질문 생성 실패:', questionError)
        continue
      }

      // 선택지 생성
      if (q.options && q.options.length > 0) {
        const optionsToInsert = q.options.map((opt: any, idx: number) => ({
          question_id: question.id,
          option_text: opt.option_text,
          result_type: opt.result_type,
          option_order: idx + 1
        }))

        const { error: optionsError } = await supabaseServer
          .from('quiz_options')
          .insert(optionsToInsert)

        if (optionsError) {
          console.error('[QUIZZES_API] 선택지 생성 실패:', optionsError)
        }
      }
    }

    console.log('[QUIZZES_API] 퀴즈 생성 성공:', quiz.id)

    return NextResponse.json({
      success: true,
      quiz,
      message: '퀴즈가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('[QUIZZES_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


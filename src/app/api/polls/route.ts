import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 투표 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = createClient()

    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          option_image_url,
          vote_count
        ),
        poll_comments (
          id,
          content,
          created_at,
          user_id,
          users (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: polls, error, count } = await query

    if (error) {
      console.error('투표 목록 조회 실패:', error)
      return NextResponse.json(
        { error: '투표 목록을 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: polls,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: count ? offset + limit < count : false
      }
    })

  } catch (error) {
    console.error('투표 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 투표 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, options, expires_at, allow_multiple } = body

    if (!title || !options || options.length < 2) {
      return NextResponse.json(
        { error: '제목과 최소 2개의 선택지가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 투표 생성
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        category: category || 'general',
        author_id: user.id,
        expires_at: expires_at ? new Date(expires_at) : null,
        allow_multiple: allow_multiple || false
      })
      .select()
      .single()

    if (pollError) {
      console.error('투표 생성 실패:', pollError)
      return NextResponse.json(
        { error: '투표 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 투표 선택지 생성
    const pollOptions = options.map((option: any) => ({
      poll_id: poll.id,
      option_text: option.text,
      option_image_url: option.image_url || null
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)

    if (optionsError) {
      console.error('투표 선택지 생성 실패:', optionsError)
      // 투표 삭제
      await supabase.from('polls').delete().eq('id', poll.id)
      return NextResponse.json(
        { error: '투표 선택지 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: poll,
      message: '투표가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('투표 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 게시물 조회 (조회수 증가 포함)
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

    // 게시물 조회
    const { data: post, error } = await supabaseServer
      .from('posts')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[POSTS API] 게시물 조회 실패:', error)
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가
    const { error: viewError } = await supabaseServer.rpc('increment_post_view_count', {
      post_id: id
    })

    if (viewError) {
      console.error('[POSTS API] 조회수 증가 실패:', viewError)
      // 조회수 증가 실패해도 게시물은 반환
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('[POSTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 수정
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
    const { title, content, category, tags } = await request.json()

    // 인증 확인
    const authHeader = request.headers.get('authorization')
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
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 게시물 수정
    const { data: post, error } = await supabaseServer
      .from('posts')
      .update({
        title,
        content,
        category,
        tags: tags || []
      })
      .eq('id', id)
      .eq('user_id', user.id) // 작성자만 수정 가능
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .single()

    if (error) {
      console.error('[POSTS API] 수정 실패:', error)
      return NextResponse.json(
        { error: '게시물 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('[POSTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 삭제
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
    const authHeader = request.headers.get('authorization')
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
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 게시물 삭제
    const { error } = await supabaseServer
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // 작성자만 삭제 가능

    if (error) {
      console.error('[POSTS API] 삭제 실패:', error)
      return NextResponse.json(
        { error: '게시물 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '게시물이 삭제되었습니다.' })

  } catch (error) {
    console.error('[POSTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

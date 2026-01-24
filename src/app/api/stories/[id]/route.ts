import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 스토리 개별 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = params

    const { data: story, error } = await supabaseServer
      .from('stories')
      .select(`
        id,
        image_url,
        text_content,
        is_public,
        is_expired,
        expires_at,
        created_at,
        user_id
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[STORY_GET] 스토리 조회 실패:', error)
      return NextResponse.json(
        { error: '스토리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ story })

  } catch (error) {
    console.error('[STORY_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스토리 업데이트 (가시성 변경 등)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { isPublic } = body

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 토큰에서 사용자 정보 추출
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    console.log('[STORY_UPDATE] 스토리 업데이트 시작:', { id, userId: authUser.id, isPublic })

    // 스토리 소유자 확인
    const { data: existingStory, error: fetchError } = await supabaseServer
      .from('stories')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingStory) {
      console.error('[STORY_UPDATE] 스토리 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '스토리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 소유자 확인
    if (existingStory.user_id !== authUser.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 스토리 업데이트
    const { data: updatedStory, error: updateError } = await supabaseServer
      .from('stories')
      .update({
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        image_url,
        text_content,
        is_public,
        is_expired,
        expires_at,
        created_at,
        user_id
      `)
      .single()

    if (updateError) {
      console.error('[STORY_UPDATE] 스토리 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '스토리 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[STORY_UPDATE] 스토리 업데이트 성공:', updatedStory.id)

    return NextResponse.json({
      success: true,
      story: updatedStory
    })

  } catch (error) {
    console.error('[STORY_UPDATE] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스토리 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id } = params

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 토큰에서 사용자 정보 추출
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    console.log('[STORY_DELETE] 스토리 삭제 시작:', { id, userId: authUser.id })

    // 스토리 소유자 확인
    const { data: existingStory, error: fetchError } = await supabaseServer
      .from('stories')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingStory) {
      console.error('[STORY_DELETE] 스토리 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '스토리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 운영자 권한 확인
    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', authUser.id)
      .eq('is_active', true)
      .single()

    const isOperator = !!adminData

    // 소유자 또는 운영자만 삭제 가능
    if (existingStory.user_id !== authUser.id && !isOperator) {
      console.log('[STORY_DELETE] 권한 없음:', { storyUserId: existingStory.user_id, userId: authUser.id, isOperator })
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 스토리 삭제
    const { error: deleteError } = await supabaseServer
      .from('stories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[STORY_DELETE] 스토리 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '스토리 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[STORY_DELETE] 스토리 삭제 성공:', id)

    return NextResponse.json({
      success: true,
      message: '스토리가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[STORY_DELETE] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

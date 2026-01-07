import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// 댓글 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('test_id')
    
    if (!testId) {
      return NextResponse.json({ error: 'test_id is required' }, { status: 400 })
    }

    const supabase = createClient()
    
    const { data: comments, error } = await supabase
      .from('test_comments')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 댓글 작성 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_id, comment } = body
    
    if (!test_id || !comment) {
      return NextResponse.json({ error: 'test_id and comment are required' }, { status: 400 })
    }

    if (!supabaseServer) {
      console.error('[TEST_COMMENTS_POST] Supabase 연결 실패')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출 (우선)
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userError = null

    if (authHeader) {
      // Authorization 헤더가 있으면 토큰으로 인증
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error: authErr } = await supabaseServer.auth.getUser(token)
      user = authUser
      userError = authErr
    } else {
      // Authorization 헤더가 없으면 쿠키에서 세션 읽기
      const supabase = createClient()
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
      user = authUser
      userError = authErr
    }
    
    if (userError || !user) {
      console.error('[TEST_COMMENTS_POST] 인증 실패:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single()

    // 사용자 이름 가져오기 (우선순위 개선)
    let userName = 'Usuario'
    let avatarUrl = null
    
    if (profile?.name) {
      userName = profile.name
      avatarUrl = profile.avatar_url
    } else {
      // profiles에 없으면 users 테이블 조회
      const { data: userData } = await supabaseServer
        .from('users')
        .select('nickname, korean_name, spanish_name, full_name, profile_image, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        userName = userData.nickname || userData.korean_name || userData.spanish_name || userData.full_name || 'Usuario'
        avatarUrl = userData.profile_image || userData.avatar_url
      }
    }

    const { data: newComment, error } = await supabaseServer
      .from('test_comments')
      .insert({
        test_id,
        user_id: user.id,
        user_name: userName,
        user_avatar_url: avatarUrl,
        comment
      })
      .select()
      .single()

    if (error) {
      console.error('[TEST_COMMENTS_POST] Error creating comment:', error)
      console.error('[TEST_COMMENTS_POST] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: error.message || 'Failed to create comment',
        details: error.details,
        code: error.code
      }, { status: 500 })
    }

    // 포인트 지급 (심리테스트 댓글 - 75점 체계)
    let pointsAwarded = 0
    if (supabaseServer) {
      try {
        const { data: pointResult, error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
          p_user_id: user.id,
          p_type: 'comment_post',
          p_amount: 1,
          p_description: '심리테스트 댓글 작성',
          p_related_id: newComment.id,
          p_related_type: 'comment'
        })

        if (pointError) {
          console.error('[TEST_COMMENTS] 포인트 적립 실패:', pointError)
        } else if (pointResult) {
          console.log('[TEST_COMMENTS] 포인트 적립 성공: +1점')
          pointsAwarded = 1
        }
      } catch (pointError) {
        console.error('[TEST_COMMENTS] 포인트 적립 예외:', pointError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      comment: newComment,
      pointsAwarded: pointsAwarded
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

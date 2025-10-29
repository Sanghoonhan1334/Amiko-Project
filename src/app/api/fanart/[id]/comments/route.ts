import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

// 댓글 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    const { data: comments, error } = await supabase
      .from('fan_art_comments')
      .select(`
        *,
        user_profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Error in GET /api/fanart/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('fan_art_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('[FAN_ART_COMMENTS] 댓글 작성 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // user_profiles 정보 별도로 가져오기
    let userProfile = null
    try {
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single()
      
      userProfile = profile
    } catch (err) {
      console.log('[FAN_ART_COMMENTS] 프로필 조회 실패:', err)
    }

    return NextResponse.json({
      ...data,
      user_profiles: userProfile
    })
  } catch (error) {
    console.error('[FAN_ART_COMMENTS] 전체 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


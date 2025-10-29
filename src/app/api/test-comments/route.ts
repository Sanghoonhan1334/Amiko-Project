import { createClient } from '@/lib/supabase/server'
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

    const supabase = createClient()
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single()

    const { data: newComment, error } = await supabase
      .from('test_comments')
      .insert({
        test_id,
        user_id: user.id,
        user_name: profile?.name || 'Anonymous',
        user_avatar_url: profile?.avatar_url || null,
        comment
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: newComment })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const sort = searchParams.get('sort') || 'popular'
    const category = searchParams.get('category') || 'all'
    
    let query = supabase
      .from('idol_memes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (sort === 'popular') {
      query = query.order('likes_count', { ascending: false })
    }

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[IDOL_MEMES] 인증 실패:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, media_url, media_type, category, tags } = body

    // user_profiles에서 닉네임 가져오기
    let authorName = user.email?.split('@')[0] || 'Usuario'
    try {
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single()
      
      if (profile?.display_name) {
        // # 이후 부분 제거
        authorName = profile.display_name.split('#')[0]
      }
    } catch (error) {
      console.log('프로필 조회 실패, 기본값 사용')
    }

    const { data, error } = await supabaseServer
      .from('idol_memes')
      .insert({
        title,
        content,
        media_url,
        media_type,
        author_id: user.id,
        author_name: authorName,
        category,
        tags,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const sort = searchParams.get('sort') || 'popular'
    const category = searchParams.get('category') || 'All'
    
    // Check if user is authenticated
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader && supabaseServer) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseServer.auth.getUser(token)
        userId = user?.id || null
      } catch (error) {
        // User not authenticated, continue without user data
      }
    }
    
    let query = supabase
      .from('fan_art')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (sort === 'popular') {
      query = query.order('likes_count', { ascending: false })
    }

    if (category !== 'All') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If user is authenticated, check likes
    if (userId && supabaseServer && data) {
      const postIds = data.map((post: any) => post.id)
      const { data: likes } = await supabaseServer
        .from('fan_art_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
      
      const likedPostIds = new Set(likes?.map((like: any) => like.post_id) || [])
      
      const dataWithLikes = data.map((post: any) => ({
        ...post,
        is_liked: likedPostIds.has(post.id)
      }))
      
      return NextResponse.json(dataWithLikes || [])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fan art' }, { status: 500 })
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
      console.error('[FAN_ART] 인증 실패:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, image_url, category, tags } = body

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
      .from('fan_art')
      .insert({
        title,
        content,
        image_url,
        author_id: user.id,
        author_name: authorName,
        category,
        tags,
      })
      .select()
      .single()

    if (error) {
      console.error('[FAN_ART] 데이터베이스 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[FAN_ART] 전체 오류:', error)
    return NextResponse.json({ error: 'Failed to create fan art' }, { status: 500 })
  }
}


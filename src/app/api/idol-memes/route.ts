import { createClient } from '@/lib/supabase/server'
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, media_url, media_type, category, tags } = body

    const { data, error } = await supabase
      .from('idol_memes')
      .insert({
        title,
        content,
        media_url,
        media_type,
        author_id: user.id,
        author_name: user.user_metadata?.name || user.email?.split('@')[0],
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

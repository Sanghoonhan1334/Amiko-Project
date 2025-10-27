import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: post, error } = await supabase
      .from('idol_memes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch post:', error)
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Update views count using supabaseServer (권한 필요)
    if (supabaseServer) {
      await supabaseServer
        .from('idol_memes')
        .update({ views: post.views + 1 })
        .eq('id', id)
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in GET /api/idol-memes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

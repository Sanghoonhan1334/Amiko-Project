import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

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

    const { data: post, error } = await supabase
      .from('fan_art')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch fan art:', error)
      return NextResponse.json({ error: 'Failed to fetch fan art' }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Fan art not found' }, { status: 404 })
    }

    // Update views count using supabaseServer (권한 필요)
    if (supabaseServer) {
      await supabaseServer
        .from('fan_art')
        .update({ views: post.views + 1 })
        .eq('id', id)
    }

    // Check if user liked this post
    let isLiked = false
    if (userId && supabaseServer) {
      const { data: like } = await supabaseServer
        .from('fan_art_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', userId)
        .single()
      
      isLiked = !!like
    }

    return NextResponse.json({ ...post, is_liked: isLiked })
  } catch (error) {
    console.error('Error in GET /api/fanart/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication and admin status
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !supabaseServer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: '관리자만 게시물을 삭제할 수 있습니다.' }, { status: 403 })
    }

    // Delete the post
    const { error: deleteError } = await supabaseServer
      .from('fan_art')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete fan art:', deleteError)
      return NextResponse.json({ error: 'Failed to delete fan art' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '게시물이 삭제되었습니다.' })
  } catch (error) {
    console.error('Error in DELETE /api/fanart/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

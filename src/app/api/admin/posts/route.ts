import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'

// ──────────────────────────────────────────────
// GET /api/admin/posts
// Admin — list all posts with pagination and search
// Query: ?page=1&limit=20&search=<text>&category=<cat>
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category') || ''
    const offset = (page - 1) * limit

    let query = supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        category,
        view_count,
        like_count,
        comment_count,
        is_pinned,
        is_hot,
        is_notice,
        is_deleted,
        created_at,
        user_id
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: posts, error, count } = await query

    if (error) {
      console.error('[ADMIN_POSTS_GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch author info for each post (batch by unique user_ids)
    const userIds = [...new Set((posts || []).map((p) => p.user_id).filter(Boolean))]
    let authorMap: Record<string, { display_name: string; avatar_url?: string }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseServer
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      if (profiles) {
        for (const p of profiles) {
          authorMap[p.user_id] = {
            display_name: p.display_name?.split('#')[0] || 'Anónimo',
            avatar_url: p.avatar_url,
          }
        }
      }

      // Fill gaps from users table
      const missingIds = userIds.filter((id) => !authorMap[id])
      if (missingIds.length > 0) {
        const { data: users } = await supabaseServer
          .from('users')
          .select('id, full_name, spanish_name, korean_name, email')
          .in('id', missingIds)

        if (users) {
          for (const u of users) {
            authorMap[u.id] = {
              display_name:
                u.korean_name ||
                u.spanish_name ||
                u.full_name ||
                u.email?.split('@')[0] ||
                'Anónimo',
            }
          }
        }
      }
    }

    const enriched = (posts || []).map((post) => ({
      ...post,
      author_name: authorMap[post.user_id]?.display_name || 'Anónimo',
      author_avatar: authorMap[post.user_id]?.avatar_url || null,
    }))

    return NextResponse.json({
      success: true,
      posts: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (err) {
    console.error('[ADMIN_POSTS_GET] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/deletion-history
// Admin — list deleted content history
// Query: ?type=post|news&limit=50&page=1
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const offset = (page - 1) * limit

    let query = supabaseServer
      .from('content_deletion_history')
      .select('*', { count: 'exact' })
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && (type === 'post' || type === 'news')) {
      query = query.eq('content_type', type)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[DELETION_HISTORY_GET] Error:', error)
      // Table may not exist yet — return empty
      return NextResponse.json({ success: true, history: [], total: 0 })
    }

    return NextResponse.json({
      success: true,
      history: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    console.error('[DELETION_HISTORY_GET] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.authenticated) return auth.response

    if (!supabaseServer) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get total user count
    const { count: totalUsers, error: countError } = await supabaseServer
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('[ADMIN STATS USERS] Count error:', countError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user stats' },
        { status: 500 }
      )
    }

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: recentUsers } = await supabaseServer
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get active users (logged in within 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count: activeUsers } = await supabaseServer
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('last_login_at', thirtyDaysAgo.toISOString())

    // Get admin count
    const { count: adminCount } = await supabaseServer
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        recentUsers: recentUsers || 0,
        activeUsers: activeUsers || 0,
        adminCount: adminCount || 0,
      },
    })

  } catch (error) {
    console.error('[ADMIN STATS USERS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}

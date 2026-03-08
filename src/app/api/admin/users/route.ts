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

    // Query users table for real data
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('id, email, full_name, nickname, avatar_url, created_at, last_login_at, is_admin')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[ADMIN USERS] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || [],
    })

  } catch (error) {
    console.error('[ADMIN USERS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

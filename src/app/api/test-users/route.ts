import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service Role Key가 설정되지 않음'
      })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({
        success: false,
        error: '사용자 목록 조회 실패',
        details: listError.message
      })
    }

    return NextResponse.json({
      success: true,
      totalUsers: authUsers.users.length,
      users: authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        emailConfirmed: user.email_confirmed_at ? true : false
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: '서버 오류',
      details: error.message
    })
  }
}

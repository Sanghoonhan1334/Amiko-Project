import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({
        success: true,
        isAdmin: false,
        adminInfo: null,
        message: '일반 사용자입니다.'
      })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      // 에러 대신 기본값 반환
      return NextResponse.json({
        success: true,
        isAdmin: false,
        adminInfo: null,
        message: '일반 사용자입니다.'
      })
    }

    // 운영진 여부 확인
    let query = supabaseServer
      .from('admin_users')
      .select('id, user_id, email, role, permissions, is_active')
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('email', email.toLowerCase())
    }

    const { data, error } = await query.single()

    if (error && !['PGRST116', '42P01', 'PGRST204', 'PGRST205'].includes(error.code || '')) {
      console.error('[ADMIN_CHECK] Supabase 오류:', error)
      return NextResponse.json(
        { error: '운영진 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (error && ['42P01', 'PGRST204', 'PGRST205'].includes(error.code || '')) {
      return NextResponse.json({
        success: true,
        isAdmin: false,
        adminInfo: null,
        message: '일반 사용자입니다.'
      })
    }

    const isAdmin = !!data

    console.log(`[ADMIN_CHECK] ${userId || email}: ${isAdmin ? '운영진' : '일반 사용자'}`)

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      adminInfo: isAdmin ? {
        id: data.id,
        role: data.role,
        permissions: data.permissions
      } : null,
      message: isAdmin ? '운영진 사용자입니다.' : '일반 사용자입니다.'
    })

  } catch (error) {
    console.error('[ADMIN_CHECK] 오류:', error)
    return NextResponse.json(
      { error: '운영진 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 운영진 추가 (서비스 계정에서만 사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, email, role = 'admin', permissions = {} } = body

    if (!user_id || !email) {
      return NextResponse.json(
        { error: '사용자 ID와 이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 운영진 추가
    const { data, error } = await supabaseServer
      .from('admin_users')
      .insert({
        user_id,
        email: email.toLowerCase(),
        role,
        permissions
      })
      .select()
      .single()

    if (error) {
      console.error('[ADMIN_ADD] Supabase 오류:', error)
      return NextResponse.json(
        { error: '운영진 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log(`[ADMIN_ADD] 운영진 추가 완료: ${email}`)

    return NextResponse.json({
      success: true,
      message: '운영진이 성공적으로 추가되었습니다.',
      adminInfo: data
    })

  } catch (error) {
    console.error('[ADMIN_ADD] 오류:', error)
    return NextResponse.json(
      { error: '운영진 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 운영진 권한 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { admin_id, role, permissions, is_active } = body

    if (!admin_id) {
      return NextResponse.json(
        { error: '운영진 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabaseServer
      .from('admin_users')
      .update(updateData)
      .eq('id', admin_id)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN_UPDATE] Supabase 오류:', error)
      return NextResponse.json(
        { error: '운영진 정보 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log(`[ADMIN_UPDATE] 운영진 정보 수정 완료: ${data.email}`)

    return NextResponse.json({
      success: true,
      message: '운영진 정보가 성공적으로 수정되었습니다.',
      adminInfo: data
    })

  } catch (error) {
    console.error('[ADMIN_UPDATE] 오류:', error)
    return NextResponse.json(
      { error: '운영진 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

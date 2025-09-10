import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 프로필 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 기본 정보 조회
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[PROFILE] 사용자 조회 실패:', userError)
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[PROFILE] 프로필 조회 실패:', profileError)
      return NextResponse.json(
        { error: '프로필 정보를 가져올 수 없습니다.' },
        { status: 500 }
      )
    }

    // 포인트 정보 조회
    const { data: points, error: pointsError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('[PROFILE] 포인트 조회 실패:', pointsError)
    }

    return NextResponse.json({
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        phone: (user as any).phone,
        created_at: (user as any).created_at
      },
      profile: profile || {
        user_id: userId,
        display_name: (user as any).name,
        bio: '',
        avatar_url: null,
        country: 'KR',
        native_language: 'ko',
        is_korean: true,
        kakao_linked_at: null,
        wa_verified_at: null,
        sms_verified_at: null,
        email_verified_at: null
      },
      points: points || {
        total_points: 0,
        daily_points: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('[PROFILE] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { userId, profileData } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 필드만 추출
    const allowedFields = [
      'display_name', 'bio', 'avatar_url', 'country', 
      'native_language', 'is_korean'
    ]
    
    const updateData = Object.keys(profileData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = profileData[key]
        return obj
      }, {} as any)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 프로필 업데이트
    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (updateError) {
      console.error('[PROFILE] 프로필 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('[PROFILE] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 모든 사용자 조회 (전화번호로 필터링하기 위해)
    const { data: allUsers, error: activityError } = await supabaseServer
      .from('users')
      .select('id, full_name, avatar_url, phone, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(50)  // 먼저 많이 가져온 후 필터링
    
    if (activityError) {
      console.error('[ONLINE_USERS] users 조회 오류:', activityError)
      return NextResponse.json({ users: [] })
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('[ONLINE_USERS] 온라인 사용자 없음')
      return NextResponse.json({ users: [] })
    }

    // 전화번호로 한국인만 필터링 (+82만 한국인으로 인정)
    const users = allUsers.filter((user: any) => {
      const userPhone = user.phone || ''
      const phoneCountryDigits = userPhone.replace(/\D/g, '')
      // +82로 시작하는 번호는 모두 한국 (821도 포함)
      return phoneCountryDigits.startsWith('82')
    }).slice(0, 10)  // 최대 10명만
    
    console.log('[ONLINE_USERS] 쿼리 결과:', {
      userCount: users?.length || 0,
      users: users?.map(u => ({
        id: u.id,
        full_name: u.full_name,
        phone: u.phone,
        updated_at: u.updated_at
      }))
    })

    if (users.length === 0) {
      console.log('[ONLINE_USERS] 온라인 한국인 사용자 없음')
      return NextResponse.json({ users: [] })
    }

    const userIds = users.map(u => u.id)

    // user_profiles에서 추가 정보 가져오기 (선택사항)
    const profileUserIds = users.map(u => u.id)
    const { data: profiles } = await supabaseServer
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', profileUserIds)

    const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]))

    // 사용자 데이터 처리
    const usersWithPublicUrls = await Promise.all(
      users.map(async (user: any) => {
        let avatarUrl = null
        let userName = user.full_name

        // user_profiles에서 display_name 확인
        const profile = profilesMap.get(user.id)
        if (profile && profile.display_name) {
          userName = profile.display_name
        }

        // user_profiles의 avatar_url 확인
        if (!avatarUrl && profile && profile.avatar_url && profile.avatar_url.trim() !== '') {
          if (!profile.avatar_url.startsWith('http')) {
            const { data: { publicUrl } } = supabaseServer.storage
              .from('profile-images')
              .getPublicUrl(profile.avatar_url)
            avatarUrl = publicUrl
          } else {
            avatarUrl = profile.avatar_url
          }
        }

        // users의 avatar_url 확인
        if (!avatarUrl && user.avatar_url && user.avatar_url.trim() !== '') {
          if (!user.avatar_url.startsWith('http')) {
            const { data: { publicUrl } } = supabaseServer.storage
              .from('profile-images')
              .getPublicUrl(user.avatar_url)
            avatarUrl = publicUrl
          } else {
            avatarUrl = user.avatar_url
          }
        }

        return {
          id: user.id,
          name: userName || '사용자',
          profileImage: avatarUrl || null,
          isOnline: true
        }
      })
    )

    return NextResponse.json({ users: usersWithPublicUrls })

  } catch (error) {
    console.error('[ONLINE_USERS] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


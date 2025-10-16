import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, avatarUrl } = await request.json()
    
    console.log('[UPDATE_PROFILE] 프로필 업데이트 시작:', { userId, fullName, avatarUrl })

    // 현재 사용자의 프로필 업데이트
    const { data, error } = await supabaseServer
      .from('users')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('[UPDATE_PROFILE] 프로필 업데이트 실패:', error)
      return NextResponse.json({ error: '프로필 업데이트 실패', details: error.message }, { status: 500 })
    }

    console.log('[UPDATE_PROFILE] 프로필 업데이트 완료:', data)
    
    return NextResponse.json({
      message: '프로필 업데이트 완료',
      user: data?.[0]
    })

  } catch (error) {
    console.error('[UPDATE_PROFILE] 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

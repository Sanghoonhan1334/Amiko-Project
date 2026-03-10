import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión activa — el userId siempre se extrae del token, nunca del body
    const supabaseClient = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const authenticatedUserId = session.user.id

    const { fullName, avatarUrl } = await request.json()

    console.log('[UPDATE_PROFILE] 프로필 업데이트 시작:', { userId: authenticatedUserId, fullName, avatarUrl })

    // 현재 사용자의 프로필 업데이트 (인증된 사용자 ID만 사용)
    const { data, error } = await supabaseServer
      .from('users')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl
      })
      .eq('id', authenticatedUserId)
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

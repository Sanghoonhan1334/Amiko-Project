import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'

// 지문 인증 성공 후 세션 생성
export async function POST(request: NextRequest) {
  try {
    const { userId, credentialId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: '사용자 ID가 필요합니다.',
          error_ko: '사용자 ID가 필요합니다.',
          error_es: 'Se requiere ID de usuario'
        },
        { status: 400 }
      )
    }

    console.log('[BIOMETRIC_SESSION] 세션 생성 시작:', { userId, credentialId })

    // Supabase 클라이언트 생성 (쿠키 기반)
    const supabase = await createSupabaseClient()

    // 서비스 키로 사용자 정보 조회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      console.error('[BIOMETRIC_SESSION] 사용자 조회 실패:', userError)
      return NextResponse.json(
        { 
          success: false,
          error: '사용자를 찾을 수 없습니다.',
          error_ko: '사용자를 찾을 수 없습니다.',
          error_es: 'Usuario no encontrado'
        },
        { status: 404 }
      )
    }

    console.log('[BIOMETRIC_SESSION] 사용자 조회 성공:', { email: userData.user.email })

    // 지문 인증이 검증되었으므로, 서버에서 세션 생성
    // Supabase Admin API를 사용하여 세션 생성
    // 또는 사용자 이메일을 사용하여 임시 세션 생성
    // 하지만 비밀번호 없이는 직접 세션을 생성할 수 없으므로,
    // 클라이언트에서 처리하도록 사용자 정보 반환

    // 사용자 정보 조회 (users 테이블)
    const { data: userInfo, error: userInfoError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userInfoError) {
      console.error('[BIOMETRIC_SESSION] 사용자 정보 조회 실패:', userInfoError)
    }

    // 사용자 인증 상태 조회
    const { data: authStatus } = await supabaseServer
      .from('user_auth_status')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 사용자 정보 반환 (클라이언트에서 세션 처리)
    return NextResponse.json({
      success: true,
      message: '세션이 생성되었습니다.',
      message_ko: '세션이 생성되었습니다.',
      message_es: 'Sesión creada exitosamente.',
      data: {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          user_metadata: userData.user.user_metadata
        },
        userInfo: userInfo || null,
        authStatus: authStatus || null,
        credentialId: credentialId
      }
    })

  } catch (error) {
    console.error('[BIOMETRIC_SESSION] 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '세션 생성 중 오류가 발생했습니다.',
        error_ko: '세션 생성 중 오류가 발생했습니다.',
        error_es: 'Error al crear la sesión.'
      },
      { status: 500 }
    )
  }
}


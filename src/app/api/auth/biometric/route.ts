import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createSupabaseClient } from '@/lib/supabase'

// 지문 인증 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // 세션 확인: 인증된 사용자인지 검사
    const supabaseClient = await createSupabaseClient()
    const { data: { session } } = await supabaseClient.auth.getSession()
    const isAuthenticated = !!session && session.user?.id === userId

    console.log('[BIOMETRIC_LIST] 지문 인증 목록 조회 시작:', { userId, isAuthenticated })

    // 데이터베이스에서 등록된 인증기 조회
    const { data: credentials, error: fetchError } = await supabaseServer
      .from('biometric_credentials')
      .select('id, credential_id, device_name, device_type, last_used_at, created_at, counter')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[BIOMETRIC_LIST] DB 조회 실패:', fetchError)
      
      // 테이블이 없는 경우 빈 배열 반환
      if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
        console.log('[BIOMETRIC_LIST] 테이블이 없음, 빈 배열 반환')
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: '지문 인증 목록 조회 중 오류가 발생했습니다.',
          error_ko: '지문 인증 목록 조회 중 오류가 발생했습니다.',
          error_es: 'Error al consultar la lista de autenticación de huella digital.'
        },
        { status: 500 }
      )
    }

    // 데이터 형식 변환
    // 인증되지 않은 요청(로그인 전 생체인증 버튼 표시용)은 기기 정보를 노출하지 않음
    const formattedCredentials = (credentials || []).map(cred => {
      if (!isAuthenticated) {
        // 비인증 요청: 최소 정보만 반환 (존재 여부 확인용)
        return { id: cred.credential_id }
      }
      return {
        id: cred.credential_id,
        credentialId: cred.credential_id,
        deviceName: cred.device_name || 'Unknown Device',
        deviceType: cred.device_type || 'fingerprint',
        lastUsedAt: cred.last_used_at || cred.created_at,
        createdAt: cred.created_at,
        counter: cred.counter || 0
      }
    })

    console.log('[BIOMETRIC_LIST] 조회 성공:', { 
      userId, 
      count: formattedCredentials.length 
    })

    return NextResponse.json({
      success: true,
      data: formattedCredentials
    })

  } catch (error) {
    console.error('[BIOMETRIC_LIST] 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '지문 인증 목록 조회 중 오류가 발생했습니다.',
        error_ko: '지문 인증 목록 조회 중 오류가 발생했습니다.',
        error_es: 'Error al consultar la lista de autenticación de huella digital.'
      },
      { status: 500 }
    )
  }
}

// 지문 인증 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const credentialId = searchParams.get('credentialId')

    if (!userId || !credentialId) {
      return NextResponse.json(
        { 
          success: false,
          error: '사용자 ID와 인증 ID가 필요합니다.',
          error_ko: '사용자 ID와 인증 ID가 필요합니다.',
          error_es: 'Se requiere ID de usuario e ID de credencial.'
        },
        { status: 400 }
      )
    }

    // 인증 확인: 세션이 있어야 하며 본인의 자격증명만 삭제 가능
    const supabaseClient = await createSupabaseClient()
    const { data: { session } } = await supabaseClient.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.', error_es: 'Se requiere autenticaci\u00f3n.' },
        { status: 401 }
      )
    }

    if (session.user?.id !== userId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.', error_es: 'No autorizado.' },
        { status: 403 }
      )
    }

    console.log('[BIOMETRIC_DELETE] 지문 인증 삭제 시작:', { userId, credentialId })

    // 데이터베이스에서 인증기 삭제 (soft delete: is_active = false)
    const { error: deleteError } = await supabaseServer
      .from('biometric_credentials')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('credential_id', credentialId)

    if (deleteError) {
      console.error('[BIOMETRIC_DELETE] 삭제 실패:', deleteError)
      return NextResponse.json(
        { 
          success: false,
          error: '지문 인증 삭제 중 오류가 발생했습니다.',
          error_ko: '지문 인증 삭제 중 오류가 발생했습니다.',
          error_es: 'Error al eliminar la autenticación de huella digital.'
        },
        { status: 500 }
      )
    }

    console.log('[BIOMETRIC_DELETE] 삭제 성공:', { userId, credentialId })

    return NextResponse.json({
      success: true,
      message: '지문 인증이 삭제되었습니다.',
      message_ko: '지문 인증이 삭제되었습니다.',
      message_es: 'Autenticación de huella digital eliminada.',
      data: {
        credentialId: credentialId
      }
    })

  } catch (error) {
    console.error('[BIOMETRIC_DELETE] 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '지문 인증 삭제 중 오류가 발생했습니다.',
        error_ko: '지문 인증 삭제 중 오류가 발생했습니다.',
        error_es: 'Error al eliminar la autenticación de huella digital.'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateUserAuthenticationOptions } from '@/lib/webauthn'

// 지문 인증 옵션 생성
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        error_ko: '사용자 ID가 필요합니다.',
        error_es: 'Se requiere ID de usuario'
      }, { status: 400 })
    }

    const result = await generateUserAuthenticationOptions(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        error_ko: result.error === '등록된 인증기가 없습니다.' 
          ? '등록된 인증기가 없습니다.' 
          : '인증 옵션 생성에 실패했습니다.',
        error_es: result.error === '등록된 인증기가 없습니다.'
          ? 'No hay autenticadores registrados.'
          : 'Error al generar opciones de autenticación.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('[WEBAUTHN_AUTHENTICATE] 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      error_ko: '지문 인증 옵션 생성 중 오류가 발생했습니다.',
      error_es: 'Error al generar opciones de autenticación de huella digital.'
    }, { status: 500 })
  }
}

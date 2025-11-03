import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[PROFILE_DELETE] API 호출 시작')
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        error_ko: '인증이 필요합니다',
        error_es: 'Se requiere autenticación'
      }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 확인
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token',
        error_ko: '유효하지 않은 토큰입니다',
        error_es: 'Token inválido'
      }, { status: 401 })
    }
    
    const userId = user.id
    console.log('[PROFILE_DELETE] 사용자 ID:', userId)
    
    if (!supabaseServer) {
      console.error('[PROFILE_DELETE] Supabase 서버 클라이언트가 초기화되지 않음')
      return NextResponse.json({ 
        error: 'Server error',
        error_ko: 'Supabase 서버 클라이언트가 초기화되지 않았습니다',
        error_es: 'Error del servidor'
      }, { status: 500 })
    }
    
    console.log('[PROFILE_DELETE] Supabase 서버 클라이언트 확인됨')

    // 사용자 테이블에서 현재 프로필 이미지 URL 조회
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[PROFILE_DELETE] 사용자 정보 조회 실패:', userError)
      return NextResponse.json({ 
        error: 'User not found',
        error_ko: '사용자 정보를 조회할 수 없습니다',
        error_es: 'No se puede encontrar la información del usuario'
      }, { status: 500 })
    }

    if (!userData?.avatar_url) {
      console.log('[PROFILE_DELETE] 삭제할 프로필 이미지가 없음')
      return NextResponse.json({ 
        message: 'No profile image to delete',
        message_ko: '삭제할 프로필 이미지가 없습니다',
        message_es: 'No hay foto de perfil para eliminar'
      }, { status: 200 })
    }

    console.log('[PROFILE_DELETE] 삭제할 이미지 URL:', userData.avatar_url)

    // Supabase Storage에서 파일 삭제
    try {
      // URL에서 파일 경로 추출 (예: https://xxx.supabase.co/storage/v1/object/public/profile-images/userId/filename.jpg)
      const urlParts = userData.avatar_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${userId}/${fileName}`
      
      console.log('[PROFILE_DELETE] 파일 경로:', filePath)

      const { error: deleteError } = await supabaseServer.storage
        .from('profile-images')
        .remove([filePath])

      if (deleteError) {
        console.error('[PROFILE_DELETE] 파일 삭제 실패:', deleteError)
        // 파일 삭제 실패해도 DB 업데이트는 진행 (이미지가 없을 수도 있음)
      } else {
        console.log('[PROFILE_DELETE] 파일 삭제 성공:', filePath)
      }
    } catch (storageError) {
      console.error('[PROFILE_DELETE] Storage 삭제 중 오류:', storageError)
      // Storage 오류는 무시하고 DB 업데이트는 진행
    }

    // 사용자 테이블의 avatar_url을 null로 업데이트
    console.log('[PROFILE_DELETE] 사용자 테이블 업데이트 시작')
    const { data: updateData, error: updateError } = await supabaseServer
      .from('users')
      .update({ avatar_url: null })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('[PROFILE_DELETE] 프로필 업데이트 실패:', updateError)
      return NextResponse.json({ 
        error: 'Update failed',
        error_ko: '프로필 업데이트에 실패했습니다',
        error_es: 'Error al actualizar el perfil'
      }, { status: 500 })
    }
    
    console.log('[PROFILE_DELETE] 프로필 업데이트 성공:', updateData)

    console.log('[PROFILE_DELETE] 프로필 이미지 삭제 완료:', {
      userId,
      updateData
    })

    return NextResponse.json({
      message: '프로필 이미지 삭제 성공',
      user: updateData?.[0]
    })

  } catch (error) {
    console.error('[PROFILE_DELETE] 프로필 이미지 삭제 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

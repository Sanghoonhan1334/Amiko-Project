import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[PROFILE_DELETE] API 호출 시작')
    
    // 임시로 하드코딩된 사용자 ID 사용 (테스트용)
    const userId = '5f83ab21-fd61-4666-94b5-087d73477476'
    console.log('[PROFILE_DELETE] 사용자 ID:', userId)
    
    if (!supabaseServer) {
      console.error('[PROFILE_DELETE] Supabase 서버 클라이언트가 초기화되지 않음')
      return NextResponse.json({ error: 'Supabase 서버 클라이언트가 초기화되지 않았습니다' }, { status: 500 })
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
      return NextResponse.json({ error: '사용자 정보를 조회할 수 없습니다' }, { status: 500 })
    }

    if (!userData?.avatar_url) {
      console.log('[PROFILE_DELETE] 삭제할 프로필 이미지가 없음')
      return NextResponse.json({ message: '삭제할 프로필 이미지가 없습니다' }, { status: 200 })
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
      return NextResponse.json({ error: '프로필 업데이트에 실패했습니다' }, { status: 500 })
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

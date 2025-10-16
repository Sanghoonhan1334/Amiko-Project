import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[PROFILE_DELETE_BY_INDEX] API 호출 시작')
    
    // 요청 본문에서 인덱스 추출
    const { index } = await request.json()
    console.log('[PROFILE_DELETE_BY_INDEX] 삭제할 인덱스:', index)
    
    // 임시로 하드코딩된 사용자 ID 사용 (테스트용)
    const userId = '5f83ab21-fd61-4666-94b5-087d73477476'
    console.log('[PROFILE_DELETE_BY_INDEX] 사용자 ID:', userId)
    
    if (!supabaseServer) {
      console.error('[PROFILE_DELETE_BY_INDEX] Supabase 서버 클라이언트가 초기화되지 않음')
      return NextResponse.json({ error: 'Supabase 서버 클라이언트가 초기화되지 않았습니다' }, { status: 500 })
    }
    
    console.log('[PROFILE_DELETE_BY_INDEX] Supabase 서버 클라이언트 확인됨')

    // 사용자 테이블에서 현재 프로필 이미지들 조회
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('profile_images')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[PROFILE_DELETE_BY_INDEX] 사용자 정보 조회 실패:', userError)
      return NextResponse.json({ error: '사용자 정보를 조회할 수 없습니다' }, { status: 500 })
    }

    if (!userData?.profile_images || !Array.isArray(userData.profile_images) || userData.profile_images.length === 0) {
      console.log('[PROFILE_DELETE_BY_INDEX] 삭제할 프로필 이미지가 없음')
      return NextResponse.json({ message: '삭제할 프로필 이미지가 없습니다' }, { status: 200 })
    }

    if (index < 0 || index >= userData.profile_images.length) {
      console.error('[PROFILE_DELETE_BY_INDEX] 잘못된 인덱스:', index)
      return NextResponse.json({ error: '잘못된 인덱스입니다' }, { status: 400 })
    }

    const imageUrlToDelete = userData.profile_images[index]
    console.log('[PROFILE_DELETE_BY_INDEX] 삭제할 이미지 URL:', imageUrlToDelete)

    // Supabase Storage에서 파일 삭제
    try {
      // URL에서 파일 경로 추출
      const urlParts = imageUrlToDelete.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${userId}/${fileName}`
      
      console.log('[PROFILE_DELETE_BY_INDEX] 파일 경로:', filePath)

      const { error: deleteError } = await supabaseServer.storage
        .from('profile-images')
        .remove([filePath])

      if (deleteError) {
        console.error('[PROFILE_DELETE_BY_INDEX] 파일 삭제 실패:', deleteError)
        // 파일 삭제 실패해도 DB 업데이트는 진행
      } else {
        console.log('[PROFILE_DELETE_BY_INDEX] 파일 삭제 성공:', filePath)
      }
    } catch (storageError) {
      console.error('[PROFILE_DELETE_BY_INDEX] Storage 삭제 중 오류:', storageError)
      // Storage 오류는 무시하고 DB 업데이트는 진행
    }

    // 배열에서 해당 인덱스의 이미지 제거
    const updatedProfileImages = userData.profile_images.filter((_, i) => i !== index)
    console.log('[PROFILE_DELETE_BY_INDEX] 업데이트된 이미지 배열:', updatedProfileImages)

    // 사용자 테이블의 profile_images 업데이트
    console.log('[PROFILE_DELETE_BY_INDEX] 사용자 테이블 업데이트 시작')
    const { data: updateData, error: updateError } = await supabaseServer
      .from('users')
      .update({ profile_images: updatedProfileImages })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('[PROFILE_DELETE_BY_INDEX] 프로필 업데이트 실패:', updateError)
      return NextResponse.json({ error: '프로필 업데이트에 실패했습니다' }, { status: 500 })
    }
    
    console.log('[PROFILE_DELETE_BY_INDEX] 프로필 업데이트 성공:', updateData)

    console.log('[PROFILE_DELETE_BY_INDEX] 프로필 이미지 삭제 완료:', {
      userId,
      deletedIndex: index,
      remainingImages: updatedProfileImages.length,
      updateData
    })

    return NextResponse.json({
      message: `프로필 이미지 ${index + 1} 삭제 성공`,
      remainingImages: updatedProfileImages.length,
      user: updateData?.[0]
    })

  } catch (error) {
    console.error('[PROFILE_DELETE_BY_INDEX] 프로필 이미지 삭제 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

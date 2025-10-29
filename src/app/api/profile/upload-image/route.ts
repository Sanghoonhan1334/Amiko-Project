import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[PROFILE_UPLOAD] API 호출 시작')
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[PROFILE_UPLOAD] Authorization 헤더가 없음')
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('[PROFILE_UPLOAD] 토큰 확인됨')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      console.error('[PROFILE_UPLOAD] 토큰 검증 실패:', authError)
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }
    
    const userId = user.id
    console.log('[PROFILE_UPLOAD] 사용자 ID:', userId)
    
    if (!supabaseServer) {
      console.error('[PROFILE_UPLOAD] Supabase 서버 클라이언트가 초기화되지 않음')
      return NextResponse.json({ error: 'Supabase 서버 클라이언트가 초기화되지 않았습니다' }, { status: 500 })
    }
    
    console.log('[PROFILE_UPLOAD] Supabase 서버 클라이언트 확인됨')

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('[PROFILE_UPLOAD] 파일 정보:', { 
      name: file?.name, 
      type: file?.type, 
      size: file?.size 
    })
    
    if (!file) {
      console.error('[PROFILE_UPLOAD] 파일이 없음')
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 })
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      console.error('[PROFILE_UPLOAD] 이미지 파일이 아님:', file.type)
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다' }, { status: 400 })
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[PROFILE_UPLOAD] 파일 크기 초과:', file.size)
      return NextResponse.json({ error: '파일 크기는 5MB를 초과할 수 없습니다' }, { status: 400 })
    }

    // 파일명 생성 (사용자ID_타임스탬프.확장자)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`
    
    console.log('[PROFILE_UPLOAD] 파일 경로:', filePath)

    // Supabase Storage에 파일 업로드
    console.log('[PROFILE_UPLOAD] Supabase Storage 업로드 시작')
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[PROFILE_UPLOAD] 파일 업로드 실패:', uploadError)
      return NextResponse.json({ error: '파일 업로드에 실패했습니다' }, { status: 500 })
    }
    
    console.log('[PROFILE_UPLOAD] 파일 업로드 성공:', uploadData)

    // 업로드된 파일의 공개 URL 생성
    const { data: { publicUrl } } = supabaseServer.storage
      .from('profile-images')
      .getPublicUrl(filePath)
    
    console.log('[PROFILE_UPLOAD] 공개 URL 생성:', publicUrl)

    // 기존 profile_images 배열 가져오기
    const { data: currentUser } = await supabaseServer
      .from('users')
      .select('profile_images')
      .eq('id', userId)
      .single()
    
    const existingImages = currentUser?.profile_images || []
    // 새 이미지를 배열 맨 앞에 추가 (가장 최근 이미지가 첫 번째)
    const updatedImages = [publicUrl, ...existingImages]
    
    // 사용자 테이블의 avatar_url과 profile_images 업데이트
    console.log('[PROFILE_UPLOAD] 사용자 테이블 업데이트 시작')
    const { data: updateData, error: updateError } = await supabaseServer
      .from('users')
      .update({ 
        avatar_url: publicUrl,
        profile_images: updatedImages
      })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('[PROFILE_UPLOAD] 프로필 업데이트 실패:', updateError)
      return NextResponse.json({ error: '프로필 업데이트에 실패했습니다' }, { status: 500 })
    }
    
    console.log('[PROFILE_UPLOAD] 프로필 업데이트 성공:', updateData)

    console.log('[PROFILE_UPLOAD] 프로필 이미지 업로드 성공:', {
      userId,
      fileName,
      publicUrl,
      updateData
    })

    return NextResponse.json({
      message: '프로필 이미지 업로드 성공',
      avatarUrl: publicUrl,
      user: updateData?.[0]
    })

  } catch (error) {
    console.error('[PROFILE_UPLOAD] 프로필 이미지 업로드 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

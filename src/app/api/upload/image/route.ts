import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: tokenUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !tokenUser) {
      console.error('[UPLOAD_IMAGE] 사용자 인증 실패:', authError?.message)
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'posts'

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 체크 (이미지: 5MB, 영상: 100MB)
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: isVideo 
            ? '영상 파일 크기는 100MB를 초과할 수 없습니다.' 
            : '이미지 파일 크기는 5MB를 초과할 수 없습니다.' 
        },
        { status: 400 }
      )
    }

    // 파일 타입 체크 (이미지, 영상, GIF 지원)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. 이미지, 영상, GIF만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${tokenUser.id}/${fileName}`

    console.log('[UPLOAD_IMAGE] 파일 업로드 시작:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    })

    // Supabase Storage에 파일 업로드
    const { data, error } = await supabaseServer.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[UPLOAD_IMAGE] 파일 업로드 실패:', error)
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    // 업로드된 파일의 공개 URL 생성
    const { data: { publicUrl } } = supabaseServer.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('[UPLOAD_IMAGE] 파일 업로드 성공:', {
      path: data.path,
      publicUrl
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('[UPLOAD_IMAGE] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: tokenUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !tokenUser) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: '삭제할 파일 경로가 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 삭제
    const { error } = await supabaseServer.storage
      .from('images')
      .remove([filePath])

    if (error) {
      console.error('[UPLOAD_IMAGE] 파일 삭제 실패:', error)
      return NextResponse.json(
        { error: '파일 삭제에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[UPLOAD_IMAGE] 파일 삭제 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
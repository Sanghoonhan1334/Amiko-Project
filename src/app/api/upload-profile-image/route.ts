import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl } = await request.json()
    
    console.log('[UPLOAD_PROFILE] 프로필 이미지 업로드 시작:', { userId, imageUrl })

    // 사용자의 프로필 이미지 업데이트
    const { data, error } = await supabaseServer
      .from('users')
      .update({
        avatar_url: imageUrl
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('[UPLOAD_PROFILE] 프로필 이미지 업로드 실패:', error)
      return NextResponse.json({ error: '프로필 이미지 업로드 실패', details: error.message }, { status: 500 })
    }

    console.log('[UPLOAD_PROFILE] 프로필 이미지 업로드 완료:', data)
    
    return NextResponse.json({
      message: '프로필 이미지 업로드 완료',
      user: data?.[0]
    })

  } catch (error) {
    console.error('[UPLOAD_PROFILE] 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

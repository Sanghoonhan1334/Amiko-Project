import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key to bypass RLS
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 일반 클라이언트 (인증 확인용)
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 메시지 정보 조회 (삭제 전)
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, user_id, room_id')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { success: false, error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 본인 또는 운영자
    const isOwnMessage = user.id === message.user_id
    
    // 운영자 권한 확인
    const params_check = new URLSearchParams()
    if (user.id) params_check.append('userId', user.id)
    if (user.email) params_check.append('email', user.email)
    
    const checkResponse = await fetch(`${request.nextUrl.origin}/api/admin/check?${params_check.toString()}`)
    const checkData = await checkResponse.json()
    
    let isOperator = checkData.isAdmin || false
    
    if (!isOperator) {
      // users 테이블의 is_admin도 확인
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      isOperator = userData?.is_admin || false
    }

    // 권한이 없으면 거부
    if (!isOwnMessage && !isOperator) {
      return NextResponse.json(
        { success: false, error: '메시지를 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 메시지 삭제 (서비스 롤 키로 RLS 우회)
    const { error: deleteError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('[CHAT_MESSAGES] 삭제 오류:', deleteError)
      return NextResponse.json(
        { success: false, error: '메시지 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '메시지가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[CHAT_MESSAGES] 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


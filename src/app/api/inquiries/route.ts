import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseClient } from '@/lib/supabase'

// 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 세션 검증
    const authSupabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Check if admin — admins can query any user, regular users only their own
    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()
    const isAdmin = !!adminData

    // Non-admins can only see their own inquiries
    const userId = isAdmin ? (requestedUserId || session.user.id) : session.user.id

    let query = supabaseServer
      .from('inquiries')
      .select(`
        *,
        users!inner(email, name),
        inquiry_responses(id, content, responder_type, created_at)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 필터 적용
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data: inquiries, error } = await query

    if (error) {
      console.error('[INQUIRIES API] 조회 실패:', error)
      return NextResponse.json(
        { error: '문의 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 답변 수 계산
    const inquiriesWithCounts = inquiries?.map((inquiry: any) => ({
      ...inquiry,
      response_count: inquiry.inquiry_responses?.length || 0,
      inquiry_responses: undefined // 원본 데이터에서 제거
    }))

    return NextResponse.json({
      inquiries: inquiriesWithCounts,
      pagination: {
        page,
        limit,
        hasMore: inquiriesWithCounts?.length === limit
      }
    })

  } catch (error) {
    console.error('[INQUIRIES API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 문의 생성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 세션 검증 — userId는 항상 토큰에서 추출 (IDOR 방지)
    const authSupabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const authenticatedUserId = session.user.id

    const { type, subject, content, priority = 'medium', language = 'ko', attachments = [] } = await request.json()

    // 입력 검증
    if (!type || !subject || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['bug', 'feature', 'general', 'payment', 'account', 'other'].includes(type)) {
      return NextResponse.json(
        { error: '잘못된 문의 타입입니다.' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: '잘못된 우선순위입니다.' },
        { status: 400 }
      )
    }

    const { data: inquiry, error } = await (supabaseServer as any)
      .from('inquiries')
      .insert({
        user_id: authenticatedUserId,
        type,
        subject,
        content,
        priority,
        language,
        attachments
      })
      .select(`
        *,
        users!inner(email, name)
      `)
      .single()

    if (error) {
      console.error('[INQUIRIES API] 생성 실패:', error)
      return NextResponse.json(
        { error: '문의 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 관리자에게 이메일 알림 발송
    try {
      const { sendNotificationEmail } = await import('@/lib/emailService')
      await sendNotificationEmail(
        'info@helloamiko.com', // 관리자 이메일
        'new_inquiry',
        {
          inquiryId: inquiry.id,
          type: type,
          subject: subject,
          content: content,
          priority: priority,
          userEmail: inquiry.users?.email || 'Unknown',
          userName: inquiry.users?.name || 'Unknown'
        }
      )
      console.log('✅ 관리자 이메일 알림 발송 완료')
    } catch (emailError) {
      console.error('❌ 관리자 이메일 알림 발송 실패:', emailError)
    }

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        response_count: 0
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[INQUIRIES API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

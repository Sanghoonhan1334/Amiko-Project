import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 관리자용 개인정보 삭제 요청 처리
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { requestId, action, adminId, rejectionReason } = body

    if (!requestId || !action || !adminId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 관리자 권한 확인
    const { data: adminData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!adminData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 삭제 요청 조회
    const { data: deletionRequest } = await supabaseServer
      .from('user_deletion_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!deletionRequest) {
      return NextResponse.json(
        { error: '삭제 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (deletionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 요청입니다.' },
        { status: 400 }
      )
    }

    let result
    const now = new Date().toISOString()

    if (action === 'approve') {
      // 삭제 요청 승인 및 처리
      result = await processDataDeletion(deletionRequest, adminId)
    } else if (action === 'reject') {
      // 삭제 요청 거부
      if (!rejectionReason) {
        return NextResponse.json(
          { error: '거부 사유를 입력해주세요.' },
          { status: 400 }
        )
      }

      result = await supabaseServer
        .from('user_deletion_requests')
        .update({
          status: 'rejected',
          processed_at: now,
          processed_by: adminId,
          rejection_reason: rejectionReason,
          updated_at: now
        })
        .eq('id', requestId)
        .select()
    } else {
      return NextResponse.json(
        { error: '잘못된 액션입니다.' },
        { status: 400 }
      )
    }

    if (result.error) {
      console.error('[ADMIN_DATA_DELETION] 데이터베이스 오류:', result.error)
      return NextResponse.json(
        { error: '요청 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 처리 로그 기록
    await supabaseServer
      .from('data_deletion_logs')
      .insert({
        user_id: deletionRequest.user_id,
        request_id: requestId,
        action_type: action === 'approve' ? 'admin_approved' : 'admin_rejected',
        details: {
          admin_id: adminId,
          action: action,
          rejection_reason: rejectionReason
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || '',
        created_at: now
      })

    // 사용자에게 결과 알림 (실제 구현 시 이메일 발송)
    await notifyUser(deletionRequest.user_id, action, rejectionReason)

    return NextResponse.json({
      success: true,
      message: `삭제 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
      requestId,
      status: action === 'approve' ? 'completed' : 'rejected'
    })

  } catch (error) {
    console.error('[ADMIN_DATA_DELETION] 오류:', error)
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 삭제 요청 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!adminId) {
      return NextResponse.json(
        { error: '관리자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 관리자 권한 확인
    const { data: adminData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!adminData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 삭제 요청 목록 조회
    let query = supabaseServer
      .from('user_deletion_requests')
      .select(`
        *,
        users!inner(email, name, created_at)
      `)
      .order('requested_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('[ADMIN_DATA_DELETION_GET] 데이터베이스 오류:', error)
      return NextResponse.json(
        { error: '삭제 요청 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 전체 개수 조회
    const { count } = await supabaseServer
      .from('user_deletion_requests')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('[ADMIN_DATA_DELETION_GET] 오류:', error)
    return NextResponse.json(
      { error: '삭제 요청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 개인정보 삭제 처리 함수
async function processDataDeletion(deletionRequest: any, adminId: string) {
  const userId = deletionRequest.user_id
  const requestType = deletionRequest.request_type
  const deleteAll = deletionRequest.delete_all

  try {
    // 삭제 요청 상태를 처리 중으로 변경
    await supabaseServer
      .from('user_deletion_requests')
      .update({
        status: 'processing',
        processed_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', deletionRequest.id)

    // 삭제 작업 수행
    if (deleteAll || requestType === 'complete') {
      // 전체 삭제 (계정 탈퇴)
      await performCompleteDeletion(userId)
    } else {
      // 부분 삭제
      await performPartialDeletion(userId)
    }

    // 삭제 완료 상태로 변경
    const result = await supabaseServer
      .from('user_deletion_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deletionRequest.id)
      .select()

    return result

  } catch (error) {
    console.error('데이터 삭제 처리 실패:', error)
    
    // 실패 시 상태를 거부로 변경
    await supabaseServer
      .from('user_deletion_requests')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: adminId,
        rejection_reason: '삭제 처리 중 오류가 발생했습니다.',
        updated_at: new Date().toISOString()
      })
      .eq('id', deletionRequest.id)

    throw error
  }
}

// 전체 삭제 수행
async function performCompleteDeletion(userId: string) {
  const tablesToDelete = [
    'user_profiles',
    'community_posts',
    'community_comments',
    'video_call_logs',
    'point_transactions',
    'user_consents',
    'consent_change_logs',
    'user_deletion_requests',
    'data_deletion_logs',
    'access_logs',
    'customer_support_records'
  ]

  for (const table of tablesToDelete) {
    try {
      await supabaseServer
        .from(table)
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error(`테이블 ${table} 삭제 실패:`, error)
      // 개별 테이블 삭제 실패는 전체 작업을 중단하지 않음
    }
  }

  // 사용자 계정 비활성화 (실제 삭제는 auth.users에서 수행)
  await supabaseServer
    .from('users')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

// 부분 삭제 수행
async function performPartialDeletion(userId: string) {
  const tablesToDelete = [
    'user_profiles',
    'community_posts',
    'community_comments'
  ]

  for (const table of tablesToDelete) {
    try {
      await supabaseServer
        .from(table)
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error(`테이블 ${table} 삭제 실패:`, error)
    }
  }

  // 프로필 정보 초기화
  await supabaseServer
    .from('users')
    .update({
      profile_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
}

// 사용자 알림 함수
async function notifyUser(userId: string, action: string, rejectionReason?: string) {
  try {
    // 사용자 이메일 조회
    const { data: userData } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userData?.email) {
      // 실제 구현 시 이메일 발송 로직 추가
      console.log(`사용자 알림: ${userData.email} - 삭제 요청 ${action}`)
      
      // 알림 테이블에 기록
      await supabaseServer
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'data_deletion_result',
          title: action === 'approve' ? '개인정보 삭제 완료' : '개인정보 삭제 요청 거부',
          message: action === 'approve' 
            ? '요청하신 개인정보가 삭제되었습니다.'
            : `삭제 요청이 거부되었습니다. 사유: ${rejectionReason}`,
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('사용자 알림 실패:', error)
  }
}

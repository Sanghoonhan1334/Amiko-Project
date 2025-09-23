import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개인정보 삭제 요청 처리
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, requestType, reason, deleteAll } = body

    if (!userId || !reason || !requestType) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 개인정보만 삭제 요청할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 중복 요청 확인 (진행 중인 요청이 있는지)
    const { data: existingRequest } = await supabaseServer
      .from('user_deletion_requests')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 진행 중인 삭제 요청이 있습니다.' },
        { status: 400 }
      )
    }

    // 삭제 요청 생성
    const deletionRequest = {
      user_id: userId,
      request_type: requestType,
      reason: reason.trim(),
      delete_all: deleteAll || false,
      status: 'pending',
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1',
      user_agent: request.headers.get('user-agent') || '',
      requested_at: new Date().toISOString()
    }

    const { data: newRequest, error: insertError } = await supabaseServer
      .from('user_deletion_requests')
      .insert(deletionRequest)
      .select()
      .single()

    if (insertError) {
      console.error('[DATA_DELETION_POST] 데이터베이스 오류:', insertError)
      return NextResponse.json(
        { error: '삭제 요청 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 삭제 로그 기록
    await supabaseServer
      .from('data_deletion_logs')
      .insert({
        user_id: userId,
        request_id: newRequest.id,
        action_type: 'request_created',
        details: {
          request_type: requestType,
          reason: reason.trim(),
          delete_all: deleteAll || false
        },
        ip_address: deletionRequest.ip_address,
        user_agent: deletionRequest.user_agent,
        created_at: new Date().toISOString()
      })

    // 관리자에게 알림 (실제 구현 시 이메일 발송)
    await notifyAdmins(newRequest.id, userId, requestType, reason)

    return NextResponse.json({
      success: true,
      message: '개인정보 삭제 요청이 접수되었습니다.',
      requestId: newRequest.id,
      status: 'pending',
      estimatedProcessingTime: '1-3 영업일'
    })

  } catch (error) {
    console.error('[DATA_DELETION_POST] 오류:', error)
    return NextResponse.json(
      { error: '삭제 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 개인정보 삭제 요청 상태 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const requestId = searchParams.get('requestId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 삭제 요청만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (requestId) {
      // 특정 요청 조회
      const { data: requestData } = await supabaseServer
        .from('user_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', userId)
        .single()

      if (!requestData) {
        return NextResponse.json(
          { error: '삭제 요청을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        request: requestData
      })
    } else {
      // 사용자의 모든 요청 조회
      const { data: requests } = await supabaseServer
        .from('user_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })

      // 사용자 데이터 현황 조회
      const dataStatus = await getUserDataStatus(userId)

      return NextResponse.json({
        success: true,
        requests: requests || [],
        dataStatus
      })
    }

  } catch (error) {
    console.error('[DATA_DELETION_GET] 오류:', error)
    return NextResponse.json(
      { error: '삭제 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 개인정보 삭제 요청 취소
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, requestId } = body

    if (!userId || !requestId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 삭제 요청만 취소할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 요청 상태 확인
    const { data: requestData } = await supabaseServer
      .from('user_deletion_requests')
      .select('status')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single()

    if (!requestData) {
      return NextResponse.json(
        { error: '삭제 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json(
        { error: '대기 중인 요청만 취소할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 요청 취소
    const { error: updateError } = await supabaseServer
      .from('user_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('[DATA_DELETION_DELETE] 데이터베이스 오류:', updateError)
      return NextResponse.json(
        { error: '요청 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 취소 로그 기록
    await supabaseServer
      .from('data_deletion_logs')
      .insert({
        user_id: userId,
        request_id: requestId,
        action_type: 'request_cancelled',
        details: {
          cancelled_by: 'user'
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '삭제 요청이 취소되었습니다.'
    })

  } catch (error) {
    console.error('[DATA_DELETION_DELETE] 오류:', error)
    return NextResponse.json(
      { error: '요청 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 데이터 현황 조회 함수
async function getUserDataStatus(userId: string) {
  try {
    // 각 테이블에서 데이터 개수 조회
    const [
      profileResult,
      postsResult,
      commentsResult,
      videoCallsResult,
      pointsResult,
      userResult
    ] = await Promise.all([
      supabaseServer.from('user_profiles').select('id').eq('user_id', userId),
      supabaseServer.from('community_posts').select('id').eq('user_id', userId),
      supabaseServer.from('community_comments').select('id').eq('user_id', userId),
      supabaseServer.from('video_call_logs').select('id').eq('user_id', userId),
      supabaseServer.from('point_transactions').select('id').eq('user_id', userId),
      supabaseServer.from('users').select('last_login_at').eq('id', userId).single()
    ])

    return {
      hasProfile: (profileResult.data?.length || 0) > 0,
      postsCount: postsResult.data?.length || 0,
      commentsCount: commentsResult.data?.length || 0,
      videoCallsCount: videoCallsResult.data?.length || 0,
      pointsCount: pointsResult.data?.length || 0,
      lastLoginAt: userResult.data?.last_login_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('사용자 데이터 현황 조회 실패:', error)
    return {
      hasProfile: false,
      postsCount: 0,
      commentsCount: 0,
      videoCallsCount: 0,
      pointsCount: 0,
      lastLoginAt: new Date().toISOString()
    }
  }
}

// 관리자 알림 함수
async function notifyAdmins(requestId: string, userId: string, requestType: string, reason: string) {
  try {
    // 관리자 목록 조회
    const { data: admins } = await supabaseServer
      .from('users')
      .select('email')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      // 실제 구현 시 이메일 발송 로직 추가
      console.log(`관리자 알림: 삭제 요청 ${requestId} - 사용자 ${userId}`)
      
      // 알림 테이블에 기록 (실제 구현 시)
      await supabaseServer
        .from('admin_notifications')
        .insert({
          type: 'data_deletion_request',
          title: '새로운 개인정보 삭제 요청',
          message: `사용자 ${userId}가 ${requestType} 삭제를 요청했습니다.`,
          data: {
            request_id: requestId,
            user_id: userId,
            request_type: requestType,
            reason: reason
          },
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('관리자 알림 실패:', error)
  }
}
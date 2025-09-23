import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GDPR 권리 요청 처리
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, rightType, reason } = body

    if (!userId || !rightType || !reason) {
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
        { error: '본인의 권리만 요청할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 유효한 권리 유형 확인
    const validRights = ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']
    if (!validRights.includes(rightType)) {
      return NextResponse.json(
        { error: '유효하지 않은 권리 유형입니다.' },
        { status: 400 }
      )
    }

    // 중복 요청 확인 (진행 중인 요청이 있는지)
    const { data: existingRequest } = await supabaseServer
      .from('gdpr_rights_requests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('right_type', rightType)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 진행 중인 동일한 권리 요청이 있습니다.' },
        { status: 400 }
      )
    }

    // 권리 요청 생성
    const rightsRequest = {
      user_id: userId,
      right_type: rightType,
      reason: reason.trim(),
      status: 'pending',
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1',
      user_agent: request.headers.get('user-agent') || '',
      requested_at: new Date().toISOString()
    }

    const { data: newRequest, error: insertError } = await supabaseServer
      .from('gdpr_rights_requests')
      .insert(rightsRequest)
      .select()
      .single()

    if (insertError) {
      console.error('[GDPR_RIGHTS_POST] 데이터베이스 오류:', insertError)
      return NextResponse.json(
        { error: '권리 요청 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 권리 요청 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        request_id: newRequest.id,
        action_type: 'right_requested',
        details: {
          right_type: rightType,
          reason: reason.trim()
        },
        ip_address: rightsRequest.ip_address,
        user_agent: rightsRequest.user_agent,
        created_at: new Date().toISOString()
      })

    // 관리자에게 알림
    await notifyAdmins(newRequest.id, userId, rightType, reason)

    return NextResponse.json({
      success: true,
      message: 'GDPR 권리 요청이 접수되었습니다.',
      requestId: newRequest.id,
      status: 'pending',
      estimatedProcessingTime: '30일 이내',
      rightType: rightType
    })

  } catch (error) {
    console.error('[GDPR_RIGHTS_POST] 오류:', error)
    return NextResponse.json(
      { error: '권리 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// GDPR 권리 요청 이력 조회
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
        { error: '본인의 권리 요청만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (requestId) {
      // 특정 요청 조회
      const { data: requestData } = await supabaseServer
        .from('gdpr_rights_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', userId)
        .single()

      if (!requestData) {
        return NextResponse.json(
          { error: '권리 요청을 찾을 수 없습니다.' },
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
        .from('gdpr_rights_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })

      return NextResponse.json({
        success: true,
        rightsHistory: requests || []
      })
    }

  } catch (error) {
    console.error('[GDPR_RIGHTS_GET] 오류:', error)
    return NextResponse.json(
      { error: '권리 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// GDPR 권리 요청 취소
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
        { error: '본인의 권리 요청만 취소할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 요청 상태 확인
    const { data: requestData } = await supabaseServer
      .from('gdpr_rights_requests')
      .select('status')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single()

    if (!requestData) {
      return NextResponse.json(
        { error: '권리 요청을 찾을 수 없습니다.' },
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
      .from('gdpr_rights_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('[GDPR_RIGHTS_DELETE] 데이터베이스 오류:', updateError)
      return NextResponse.json(
        { error: '요청 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 취소 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        request_id: requestId,
        action_type: 'right_cancelled',
        details: {
          cancelled_by: 'user'
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '권리 요청이 취소되었습니다.'
    })

  } catch (error) {
    console.error('[GDPR_RIGHTS_DELETE] 오류:', error)
    return NextResponse.json(
      { error: '요청 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 관리자 알림 함수
async function notifyAdmins(requestId: string, userId: string, rightType: string, reason: string) {
  try {
    // 관리자 목록 조회
    const { data: admins } = await supabaseServer
      .from('users')
      .select('email')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      // 실제 구현 시 이메일 발송 로직 추가
      console.log(`관리자 알림: GDPR 권리 요청 ${requestId} - 사용자 ${userId}`)
      
      // 알림 테이블에 기록
      await supabaseServer
        .from('admin_notifications')
        .insert({
          type: 'gdpr_rights_request',
          title: '새로운 GDPR 권리 요청',
          message: `사용자 ${userId}가 ${rightType} 권리를 요청했습니다.`,
          data: {
            request_id: requestId,
            user_id: userId,
            right_type: rightType,
            reason: reason
          },
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('관리자 알림 실패:', error)
  }
}

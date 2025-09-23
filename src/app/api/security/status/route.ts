import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { validateSecuritySettings } from '@/lib/encryption'

// 보안 상태 조회
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
    const type = searchParams.get('type') // 'status' | 'metrics' | 'logs'

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
        { error: '본인의 보안 정보만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (type === 'status') {
      return await getSecurityStatus(userId)
    } else if (type === 'metrics') {
      return await getSecurityMetrics(userId)
    } else if (type === 'logs') {
      return await getSecurityLogs(userId)
    } else {
      // 기본적으로 상태와 메트릭 모두 반환
      const [statusResult, metricsResult] = await Promise.all([
        getSecurityStatus(userId),
        getSecurityMetrics(userId)
      ])

      return NextResponse.json({
        success: true,
        securityStatus: statusResult.success ? statusResult.securityStatus : null,
        metrics: metricsResult.success ? metricsResult.metrics : null
      })
    }

  } catch (error) {
    console.error('[SECURITY_GET] 오류:', error)
    return NextResponse.json(
      { error: '보안 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 보안 상태 조회 함수
async function getSecurityStatus(userId: string) {
  try {
    // 보안 설정 검증
    const securityValidation = validateSecuritySettings()
    
    // 보안 이슈 조회
    const { data: securityIssues } = await supabaseServer
      .from('security_issues')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('severity', { ascending: false })

    // 보안 권장사항 조회
    const { data: recommendations } = await supabaseServer
      .from('security_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('priority', { ascending: false })

    // 보안 점수 계산
    let securityScore = 100
    let overallStatus = 'secure'

    // 보안 설정 문제로 점수 차감
    if (!securityValidation.isValid) {
      securityScore -= 20
      overallStatus = 'warning'
    }

    // 보안 이슈로 점수 차감
    if (securityIssues) {
      securityIssues.forEach((issue: any) => {
        switch (issue.severity) {
          case 'critical':
            securityScore -= 30
            overallStatus = 'critical'
            break
          case 'high':
            securityScore -= 20
            if (overallStatus !== 'critical') overallStatus = 'warning'
            break
          case 'medium':
            securityScore -= 10
            if (overallStatus === 'secure') overallStatus = 'warning'
            break
          case 'low':
            securityScore -= 5
            break
        }
      })
    }

    // 점수가 0 미만이면 0으로 설정
    securityScore = Math.max(0, securityScore)

    const securityStatus = {
      overall: overallStatus as 'secure' | 'warning' | 'critical',
      score: securityScore,
      lastChecked: new Date().toISOString(),
      issues: securityIssues || [],
      recommendations: recommendations || []
    }

    return NextResponse.json({
      success: true,
      securityStatus
    })

  } catch (error) {
    console.error('보안 상태 조회 실패:', error)
    return NextResponse.json(
      { error: '보안 상태 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 보안 메트릭 조회 함수
async function getSecurityMetrics(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 오늘의 보안 이벤트 조회
    const [
      { data: blockedAttacks },
      { data: failedLogins },
      { data: suspiciousActivities },
      { data: encryptionStatus },
      { data: lastBackup },
      { data: systemUptime }
    ] = await Promise.all([
      // 차단된 공격 수
      supabaseServer
        .from('security_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'blocked_attack')
        .gte('created_at', today.toISOString()),
      
      // 실패한 로그인 수
      supabaseServer
        .from('security_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'failed_login')
        .gte('created_at', today.toISOString()),
      
      // 의심스러운 활동 수
      supabaseServer
        .from('security_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'suspicious_activity')
        .gte('created_at', today.toISOString()),
      
      // 암호화 상태 조회
      supabaseServer
        .from('security_settings')
        .select('encryption_enabled')
        .eq('user_id', userId)
        .single(),
      
      // 마지막 백업 시간 조회
      supabaseServer
        .from('backup_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      
      // 시스템 가동 시간 조회
      supabaseServer
        .from('system_metrics')
        .select('uptime_percentage')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])

    const metrics = {
      totalThreats: (blockedAttacks?.length || 0) + (failedLogins?.length || 0) + (suspiciousActivities?.length || 0),
      blockedAttacks: blockedAttacks?.length || 0,
      failedLogins: failedLogins?.length || 0,
      suspiciousActivities: suspiciousActivities?.length || 0,
      encryptionStatus: encryptionStatus?.encryption_enabled ? 'enabled' : 'disabled',
      lastBackup: lastBackup?.created_at || new Date().toISOString(),
      systemUptime: systemUptime?.uptime_percentage || 99.9
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('보안 메트릭 조회 실패:', error)
    return NextResponse.json(
      { error: '보안 메트릭 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 보안 로그 조회 함수
async function getSecurityLogs(userId: string) {
  try {
    const { data: securityLogs } = await supabaseServer
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      success: true,
      logs: securityLogs || []
    })

  } catch (error) {
    console.error('보안 로그 조회 실패:', error)
    return NextResponse.json(
      { error: '보안 로그 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 보안 이벤트 기록
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, eventType, severity, description, metadata } = body

    if (!userId || !eventType || !severity) {
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
        { error: '본인의 보안 이벤트만 기록할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 보안 이벤트 기록
    const securityEvent = {
      user_id: userId,
      event_type: eventType,
      severity: severity,
      description: description || '',
      metadata: metadata || {},
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1',
      user_agent: request.headers.get('user-agent') || '',
      created_at: new Date().toISOString()
    }

    const { data: newEvent, error: insertError } = await supabaseServer
      .from('security_events')
      .insert(securityEvent)
      .select()
      .single()

    if (insertError) {
      console.error('[SECURITY_POST] 데이터베이스 오류:', insertError)
      return NextResponse.json(
        { error: '보안 이벤트 기록에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 심각한 보안 이벤트인 경우 관리자에게 알림
    if (severity === 'critical' || severity === 'high') {
      await notifyAdmins(newEvent.id, userId, eventType, severity, description)
    }

    return NextResponse.json({
      success: true,
      message: '보안 이벤트가 기록되었습니다.',
      eventId: newEvent.id
    })

  } catch (error) {
    console.error('[SECURITY_POST] 오류:', error)
    return NextResponse.json(
      { error: '보안 이벤트 기록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 관리자 알림 함수
async function notifyAdmins(eventId: string, userId: string, eventType: string, severity: string, description: string) {
  try {
    // 관리자 목록 조회
    const { data: admins } = await supabaseServer
      .from('users')
      .select('email')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      // 실제 구현 시 이메일 발송 로직 추가
      console.log(`관리자 알림: 보안 이벤트 ${eventId} - 사용자 ${userId}`)
      
      // 알림 테이블에 기록
      await supabaseServer
        .from('admin_notifications')
        .insert({
          type: 'security_alert',
          title: '보안 경고',
          message: `사용자 ${userId}에서 ${severity} 수준의 보안 이벤트가 발생했습니다: ${eventType}`,
          data: {
            event_id: eventId,
            user_id: userId,
            event_type: eventType,
            severity: severity,
            description: description
          },
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('관리자 알림 실패:', error)
  }
}

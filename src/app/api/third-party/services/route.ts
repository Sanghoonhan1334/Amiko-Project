import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 제3자 서비스 목록 조회
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
    const type = searchParams.get('type') // 'services' | 'metrics' | 'logs'

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
        { error: '본인의 제3자 서비스 정보만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (type === 'services') {
      return await getThirdPartyServices(userId)
    } else if (type === 'metrics') {
      return await getServiceMetrics(userId)
    } else if (type === 'logs') {
      return await getServiceLogs(userId)
    } else {
      // 기본적으로 서비스와 메트릭 모두 반환
      const [servicesResult, metricsResult] = await Promise.all([
        getThirdPartyServices(userId),
        getServiceMetrics(userId)
      ])

      return NextResponse.json({
        success: true,
        services: servicesResult.success ? servicesResult.services : [],
        metrics: metricsResult.success ? metricsResult.metrics : null
      })
    }

  } catch (error) {
    console.error('[THIRD_PARTY_GET] 오류:', error)
    return NextResponse.json(
      { error: '제3자 서비스 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 제3자 서비스 목록 조회 함수
async function getThirdPartyServices(userId: string) {
  try {
    const { data: services } = await supabaseServer
      .from('third_party_services')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })

    return NextResponse.json({
      success: true,
      services: services || []
    })

  } catch (error) {
    console.error('제3자 서비스 조회 실패:', error)
    return NextResponse.json(
      { error: '제3자 서비스 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 메트릭 조회 함수
async function getServiceMetrics(userId: string) {
  try {
    // 서비스 통계 조회
    const [
      { data: totalServices },
      { data: activeServices },
      { data: criticalIssues },
      { data: uptimeData },
      { data: responseTimeData },
      { data: costData },
      { data: complianceData }
    ] = await Promise.all([
      // 총 서비스 수
      supabaseServer
        .from('third_party_services')
        .select('id')
        .eq('user_id', userId),
      
      // 활성 서비스 수
      supabaseServer
        .from('third_party_services')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active'),
      
      // 위험 이슈 수
      supabaseServer
        .from('third_party_service_issues')
        .select('id')
        .eq('user_id', userId)
        .eq('severity', 'critical'),
      
      // 평균 가동률
      supabaseServer
        .from('third_party_service_metrics')
        .select('uptime')
        .eq('user_id', userId)
        .eq('metric_type', 'uptime'),
      
      // 평균 응답시간
      supabaseServer
        .from('third_party_service_metrics')
        .select('response_time')
        .eq('user_id', userId)
        .eq('metric_type', 'response_time'),
      
      // 총 비용
      supabaseServer
        .from('third_party_services')
        .select('monthly_cost')
        .eq('user_id', userId),
      
      // 준수 점수
      supabaseServer
        .from('third_party_service_compliance')
        .select('compliance_score')
        .eq('user_id', userId)
    ])

    // 평균 가동률 계산
    const averageUptime = uptimeData && uptimeData.length > 0
      ? uptimeData.reduce((sum, item) => sum + item.uptime, 0) / uptimeData.length
      : 99.9

    // 평균 응답시간 계산
    const averageResponseTime = responseTimeData && responseTimeData.length > 0
      ? responseTimeData.reduce((sum, item) => sum + item.response_time, 0) / responseTimeData.length
      : 150

    // 총 비용 계산
    const totalCost = costData && costData.length > 0
      ? costData.reduce((sum, item) => sum + (item.monthly_cost || 0), 0)
      : 0

    // 평균 준수 점수 계산
    const complianceScore = complianceData && complianceData.length > 0
      ? complianceData.reduce((sum, item) => sum + item.compliance_score, 0) / complianceData.length
      : 85

    const metrics = {
      totalServices: totalServices?.length || 0,
      activeServices: activeServices?.length || 0,
      criticalIssues: criticalIssues?.length || 0,
      averageUptime: Math.round(averageUptime * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime),
      totalCost: Math.round(totalCost),
      complianceScore: Math.round(complianceScore)
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('서비스 메트릭 조회 실패:', error)
    return NextResponse.json(
      { error: '서비스 메트릭 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 로그 조회 함수
async function getServiceLogs(userId: string) {
  try {
    const { data: logs } = await supabaseServer
      .from('third_party_service_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      success: true,
      logs: logs || []
    })

  } catch (error) {
    console.error('서비스 로그 조회 실패:', error)
    return NextResponse.json(
      { error: '서비스 로그 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 제3자 서비스 상태 업데이트
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, serviceId, action, data } = body

    if (!userId || !serviceId || !action) {
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
        { error: '본인의 제3자 서비스만 관리할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (action === 'update_status') {
      return await updateServiceStatus(serviceId, data.status, data.reason)
    } else if (action === 'add_service') {
      return await addNewService(userId, data)
    } else if (action === 'remove_service') {
      return await removeService(serviceId, data.reason)
    } else {
      return NextResponse.json(
        { error: '지원되지 않는 액션입니다.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[THIRD_PARTY_POST] 오류:', error)
    return NextResponse.json(
      { error: '제3자 서비스 관리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 상태 업데이트 함수
async function updateServiceStatus(serviceId: string, status: string, reason: string) {
  try {
    const { error: updateError } = await supabaseServer
      .from('third_party_services')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (updateError) {
      console.error('[UPDATE_SERVICE_STATUS] 데이터베이스 오류:', updateError)
      return NextResponse.json(
        { error: '서비스 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 상태 변경 로그 기록
    await supabaseServer
      .from('third_party_service_logs')
      .insert({
        service_id: serviceId,
        action_type: 'status_update',
        details: {
          old_status: 'unknown',
          new_status: status,
          reason: reason
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '서비스 상태가 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('서비스 상태 업데이트 실패:', error)
    return NextResponse.json(
      { error: '서비스 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 새 서비스 추가 함수
async function addNewService(userId: string, serviceData: any) {
  try {
    const newService = {
      user_id: userId,
      name: serviceData.name,
      category: serviceData.category,
      provider: serviceData.provider,
      description: serviceData.description,
      data_types: serviceData.dataTypes || [],
      privacy_level: serviceData.privacyLevel || 'internal',
      status: 'active',
      security_score: serviceData.securityScore || 85,
      compliance_status: serviceData.complianceStatus || {
        gdpr: false,
        ccpa: false,
        soc2: false,
        iso27001: false
      },
      contract_info: serviceData.contractInfo || {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        renewal_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        monthly_cost: 0,
        sla: '99.9%'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertedService, error: insertError } = await supabaseServer
      .from('third_party_services')
      .insert(newService)
      .select()
      .single()

    if (insertError) {
      console.error('[ADD_NEW_SERVICE] 데이터베이스 오류:', insertError)
      return NextResponse.json(
        { error: '새 서비스 추가에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 서비스 추가 로그 기록
    await supabaseServer
      .from('third_party_service_logs')
      .insert({
        service_id: insertedService.id,
        action_type: 'service_added',
        details: {
          service_name: serviceData.name,
          provider: serviceData.provider,
          category: serviceData.category
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '새 서비스가 추가되었습니다.',
      serviceId: insertedService.id
    })

  } catch (error) {
    console.error('새 서비스 추가 실패:', error)
    return NextResponse.json(
      { error: '새 서비스 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 제거 함수
async function removeService(serviceId: string, reason: string) {
  try {
    // 서비스 제거 로그 기록
    await supabaseServer
      .from('third_party_service_logs')
      .insert({
        service_id: serviceId,
        action_type: 'service_removed',
        details: {
          reason: reason
        },
        created_at: new Date().toISOString()
      })

    // 서비스 상태를 비활성으로 변경 (실제 삭제는 하지 않음)
    const { error: updateError } = await supabaseServer
      .from('third_party_services')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (updateError) {
      console.error('[REMOVE_SERVICE] 데이터베이스 오류:', updateError)
      return NextResponse.json(
        { error: '서비스 제거에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '서비스가 제거되었습니다.'
    })

  } catch (error) {
    console.error('서비스 제거 실패:', error)
    return NextResponse.json(
      { error: '서비스 제거에 실패했습니다.' },
      { status: 500 }
    )
  }
}

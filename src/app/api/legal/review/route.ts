import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 법무 검토 목록 조회
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
    const type = searchParams.get('type') // 'policies' | 'metrics' | 'logs'

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
        { error: '본인의 법무 검토 정보만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (type === 'policies') {
      return await getPolicyReviews(userId)
    } else if (type === 'metrics') {
      return await getReviewMetrics(userId)
    } else if (type === 'logs') {
      return await getReviewLogs(userId)
    } else {
      // 기본적으로 정책과 메트릭 모두 반환
      const [policiesResult, metricsResult] = await Promise.all([
        getPolicyReviews(userId),
        getReviewMetrics(userId)
      ])

      return NextResponse.json({
        success: true,
        policies: policiesResult.success ? policiesResult.policies : [],
        metrics: metricsResult.success ? metricsResult.metrics : null
      })
    }

  } catch (error) {
    console.error('[LEGAL_REVIEW_GET] 오류:', error)
    return NextResponse.json(
      { error: '법무 검토 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 정책 검토 목록 조회 함수
async function getPolicyReviews(userId: string) {
  try {
    const { data: policies } = await supabaseServer
      .from('legal_policy_reviews')
      .select(`
        *,
        legal_reviewers(*),
        legal_review_comments(*)
      `)
      .eq('user_id', userId)
      .order('last_updated', { ascending: false })

    return NextResponse.json({
      success: true,
      policies: policies || []
    })

  } catch (error) {
    console.error('정책 검토 조회 실패:', error)
    return NextResponse.json(
      { error: '정책 검토 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 검토 메트릭 조회 함수
async function getReviewMetrics(userId: string) {
  try {
    // 검토 통계 조회
    const [
      { data: totalPolicies },
      { data: underReview },
      { data: approved },
      { data: rejected },
      { data: published },
      { data: reviewTimeData },
      { data: complianceData },
      { data: riskIssues }
    ] = await Promise.all([
      // 총 정책 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId),
      
      // 검토 중인 정책 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'under_review'),
      
      // 승인된 정책 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved'),
      
      // 거부된 정책 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'rejected'),
      
      // 발행된 정책 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'published'),
      
      // 평균 검토 시간
      supabaseServer
        .from('legal_policy_reviews')
        .select('review_duration_days')
        .eq('user_id', userId)
        .not('review_duration_days', 'is', null),
      
      // 준수 점수
      supabaseServer
        .from('legal_policy_reviews')
        .select('compliance_score')
        .eq('user_id', userId),
      
      // 위험 이슈 수
      supabaseServer
        .from('legal_policy_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('risk_level', 'critical')
    ])

    // 평균 검토 시간 계산
    const averageReviewTime = reviewTimeData && reviewTimeData.length > 0
      ? reviewTimeData.reduce((sum, item) => sum + (item.review_duration_days || 0), 0) / reviewTimeData.length
      : 7

    // 평균 준수 점수 계산
    const complianceScore = complianceData && complianceData.length > 0
      ? complianceData.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / complianceData.length
      : 85

    const metrics = {
      totalPolicies: totalPolicies?.length || 0,
      underReview: underReview?.length || 0,
      approved: approved?.length || 0,
      rejected: rejected?.length || 0,
      published: published?.length || 0,
      averageReviewTime: Math.round(averageReviewTime),
      complianceScore: Math.round(complianceScore),
      riskIssues: riskIssues?.length || 0
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('검토 메트릭 조회 실패:', error)
    return NextResponse.json(
      { error: '검토 메트릭 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 검토 로그 조회 함수
async function getReviewLogs(userId: string) {
  try {
    const { data: logs } = await supabaseServer
      .from('legal_review_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      success: true,
      logs: logs || []
    })

  } catch (error) {
    console.error('검토 로그 조회 실패:', error)
    return NextResponse.json(
      { error: '검토 로그 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 법무 검토 제출
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { policyId, action, comment, reviewerId } = body

    if (!policyId || !action || !comment || !reviewerId) {
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
    if (user.id !== reviewerId) {
      return NextResponse.json(
        { error: '본인의 검토만 제출할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 정책 검토 상태 확인
    const { data: policy } = await supabaseServer
      .from('legal_policy_reviews')
      .select('status')
      .eq('id', policyId)
      .single()

    if (!policy) {
      return NextResponse.json(
        { error: '정책을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (policy.status !== 'under_review') {
      return NextResponse.json(
        { error: '검토 중인 정책만 검토할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 검토자 정보 업데이트
    const { error: reviewerError } = await supabaseServer
      .from('legal_reviewers')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        comments: comment
      })
      .eq('policy_id', policyId)
      .eq('reviewer_id', reviewerId)

    if (reviewerError) {
      console.error('[LEGAL_REVIEW_POST] 검토자 업데이트 오류:', reviewerError)
      return NextResponse.json(
        { error: '검토자 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 검토 의견 기록
    const { error: commentError } = await supabaseServer
      .from('legal_review_comments')
      .insert({
        policy_id: policyId,
        reviewer_id: reviewerId,
        content: comment,
        type: action === 'approve' ? 'approval' : 'requirement',
        created_at: new Date().toISOString()
      })

    if (commentError) {
      console.error('[LEGAL_REVIEW_POST] 검토 의견 기록 오류:', commentError)
      return NextResponse.json(
        { error: '검토 의견 기록에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 모든 검토자가 검토를 완료했는지 확인
    const { data: reviewers } = await supabaseServer
      .from('legal_reviewers')
      .select('status')
      .eq('policy_id', policyId)

    const allReviewed = reviewers?.every(r => r.status === 'approved' || r.status === 'rejected')
    const hasRejection = reviewers?.some(r => r.status === 'rejected')

    // 정책 상태 업데이트
    let newStatus = 'under_review'
    if (allReviewed) {
      if (hasRejection) {
        newStatus = 'rejected'
      } else {
        newStatus = 'approved'
      }
    }

    const { error: policyError } = await supabaseServer
      .from('legal_policy_reviews')
      .update({
        status: newStatus,
        last_updated: new Date().toISOString(),
        review_completed_at: allReviewed ? new Date().toISOString() : null
      })
      .eq('id', policyId)

    if (policyError) {
      console.error('[LEGAL_REVIEW_POST] 정책 상태 업데이트 오류:', policyError)
      return NextResponse.json(
        { error: '정책 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 검토 로그 기록
    await supabaseServer
      .from('legal_review_logs')
      .insert({
        policy_id: policyId,
        reviewer_id: reviewerId,
        action_type: action === 'approve' ? 'review_approved' : 'review_rejected',
        details: {
          comment: comment,
          new_status: newStatus
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `정책이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
      newStatus
    })

  } catch (error) {
    console.error('[LEGAL_REVIEW_POST] 오류:', error)
    return NextResponse.json(
      { error: '법무 검토 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 정책 검토 시작
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { policyId, action } = body

    if (!policyId || !action) {
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

    if (action === 'start_review') {
      // 검토 시작
      const { error: updateError } = await supabaseServer
        .from('legal_policy_reviews')
        .update({
          status: 'under_review',
          review_started_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .eq('id', policyId)

      if (updateError) {
        console.error('[LEGAL_REVIEW_PUT] 검토 시작 오류:', updateError)
        return NextResponse.json(
          { error: '검토 시작에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '정책 검토가 시작되었습니다.'
      })
    } else if (action === 'publish') {
      // 정책 발행
      const { error: updateError } = await supabaseServer
        .from('legal_policy_reviews')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .eq('id', policyId)
        .eq('status', 'approved')

      if (updateError) {
        console.error('[LEGAL_REVIEW_PUT] 정책 발행 오류:', updateError)
        return NextResponse.json(
          { error: '정책 발행에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '정책이 발행되었습니다.'
      })
    } else {
      return NextResponse.json(
        { error: '지원되지 않는 액션입니다.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[LEGAL_REVIEW_PUT] 오류:', error)
    return NextResponse.json(
      { error: '정책 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개인정보 보관기간 정책에 따른 자동 삭제 시스템
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 관리자 권한 확인
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

    // 관리자 권한 확인
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const deletionResults = {
      expiredUsers: 0,
      expiredLogs: 0,
      expiredSupport: 0,
      expiredVideoCalls: 0,
      errors: [] as string[]
    }

    // 1. 휴면 계정 삭제 (1년 이상 미접속)
    try {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      const { data: inactiveUsers } = await supabaseServer
        .from('users')
        .select('id, email, last_login_at')
        .lt('last_login_at', oneYearAgo.toISOString())
        .not('last_login_at', 'is', null)

      if (inactiveUsers && inactiveUsers.length > 0) {
        // 사용자에게 삭제 예정 안내 (30일 전)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const usersToDelete = inactiveUsers.filter(user => 
          new Date(user.last_login_at) < thirtyDaysAgo
        )

        for (const userToDelete of usersToDelete) {
          // 관련 데이터 삭제
          await Promise.all([
            // 프로필 데이터 삭제
            supabaseServer
              .from('user_profiles')
              .delete()
              .eq('user_id', userToDelete.id),
            
            // 커뮤니티 게시글 삭제
            supabaseServer
              .from('posts')
              .delete()
              .eq('author_id', userToDelete.id),
            
            // 댓글 삭제
            supabaseServer
              .from('comments')
              .delete()
              .eq('author_id', userToDelete.id),
            
            // 포인트 기록 삭제 (법정 보존 기간 제외)
            supabaseServer
              .from('point_transactions')
              .delete()
              .eq('user_id', userToDelete.id)
              .lt('created_at', new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString()),
            
            // 사용자 계정 삭제
            supabaseServer
              .from('users')
              .delete()
              .eq('id', userToDelete.id)
          ])

          deletionResults.expiredUsers++
        }
      }
    } catch (error) {
      deletionResults.errors.push(`휴면 계정 삭제 오류: ${error}`)
    }

    // 2. 접속 로그 삭제 (3개월 이상)
    try {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      const { error: logError } = await supabaseServer
        .from('access_logs')
        .delete()
        .lt('created_at', threeMonthsAgo.toISOString())

      if (logError) {
        deletionResults.errors.push(`접속 로그 삭제 오류: ${logError.message}`)
      } else {
        deletionResults.expiredLogs++
      }
    } catch (error) {
      deletionResults.errors.push(`접속 로그 삭제 오류: ${error}`)
    }

    // 3. 고객 지원 기록 삭제 (3년 이상)
    try {
      const threeYearsAgo = new Date()
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
      
      const { error: supportError } = await supabaseServer
        .from('support_tickets')
        .delete()
        .lt('created_at', threeYearsAgo.toISOISOString())
        .eq('status', 'resolved')

      if (supportError) {
        deletionResults.errors.push(`고객 지원 기록 삭제 오류: ${supportError.message}`)
      } else {
        deletionResults.expiredSupport++
      }
    } catch (error) {
      deletionResults.errors.push(`고객 지원 기록 삭제 오류: ${error}`)
    }

    // 4. 화상채팅 기록 삭제 (3개월 이상)
    try {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      const { error: videoError } = await supabaseServer
        .from('video_call_logs')
        .delete()
        .lt('created_at', threeMonthsAgo.toISOString())

      if (videoError) {
        deletionResults.errors.push(`화상채팅 기록 삭제 오류: ${videoError.message}`)
      } else {
        deletionResults.expiredVideoCalls++
      }
    } catch (error) {
      deletionResults.errors.push(`화상채팅 기록 삭제 오류: ${error}`)
    }

    // 5. 삭제 로그 기록
    await supabaseServer
      .from('deletion_logs')
      .insert({
        deleted_users: deletionResults.expiredUsers,
        deleted_logs: deletionResults.expiredLogs,
        deleted_support: deletionResults.expiredSupport,
        deleted_video_calls: deletionResults.expiredVideoCalls,
        errors: deletionResults.errors,
        executed_by: user.id,
        executed_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '개인정보 자동 삭제가 완료되었습니다.',
      results: deletionResults
    })

  } catch (error) {
    console.error('[DATA_DELETION] 오류:', error)
    return NextResponse.json(
      { error: '개인정보 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 삭제 예정 데이터 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 관리자 권한 확인
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

    // 관리자 권한 확인
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const upcomingDeletions = {
      inactiveUsers: 0,
      expiredLogs: 0,
      expiredSupport: 0,
      expiredVideoCalls: 0
    }

    // 휴면 계정 조회 (1년 이상 미접속)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    const { count: inactiveCount } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('last_login_at', oneYearAgo.toISOString())
      .not('last_login_at', 'is', null)

    upcomingDeletions.inactiveUsers = inactiveCount || 0

    // 접속 로그 조회 (3개월 이상)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const { count: logCount } = await supabaseServer
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', threeMonthsAgo.toISOString())

    upcomingDeletions.expiredLogs = logCount || 0

    // 고객 지원 기록 조회 (3년 이상)
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
    
    const { count: supportCount } = await supabaseServer
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', threeYearsAgo.toISOString())
      .eq('status', 'resolved')

    upcomingDeletions.expiredSupport = supportCount || 0

    // 화상채팅 기록 조회 (3개월 이상)
    const { count: videoCount } = await supabaseServer
      .from('video_call_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', threeMonthsAgo.toISOString())

    upcomingDeletions.expiredVideoCalls = videoCount || 0

    return NextResponse.json({
      success: true,
      upcomingDeletions,
      lastChecked: new Date().toISOString()
    })

  } catch (error) {
    console.error('[DATA_DELETION_CHECK] 오류:', error)
    return NextResponse.json(
      { error: '삭제 예정 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

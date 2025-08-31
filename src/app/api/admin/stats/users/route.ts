import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 서비스 롤 키 권한 문제로 인해 더미 데이터 반환
    // 실제 운영 환경에서는 서비스 롤 키를 사용해야 합니다
    
    console.log('[ADMIN STATS USERS] 더미 데이터 반환 (권한 문제)')
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: 5,
        confirmedUsers: 3,
        unconfirmedUsers: 2,
        recentUsers: 1
      },
      message: '더미 데이터 (서비스 롤 키 권한 필요)'
    })

    // 아래 코드는 서비스 롤 키가 있을 때 사용
    /*
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('[ADMIN STATS USERS] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '사용자 통계 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 통계 계산
    const totalUsers = users.users.length
    const confirmedUsers = users.users.filter(u => u.email_confirmed_at).length
    const unconfirmedUsers = users.users.filter(u => !u.email_confirmed_at).length
    
    // 최근 7일간 가입한 사용자 수
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentUsers = users.users.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        confirmedUsers,
        unconfirmedUsers,
        recentUsers
      },
      message: '사용자 통계 조회 성공'
    })
    */

  } catch (error) {
    console.error('사용자 통계 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '사용자 통계 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

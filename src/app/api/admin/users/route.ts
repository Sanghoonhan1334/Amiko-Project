import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 서비스 롤 키 권한 문제로 인해 더미 데이터 반환
    // 실제 운영 환경에서는 서비스 롤 키를 사용해야 합니다
    
    console.log('[ADMIN USERS] 더미 데이터 반환 (권한 문제)')
    
    const dummyUsers = [
      {
        id: 'dummy-user-1',
        email: 'user1@example.com',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        email_confirmed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-user-2',
        email: 'user2@example.com',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        email_confirmed_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-user-3',
        email: 'user3@example.com',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: null,
        email_confirmed_at: null
      },
      {
        id: 'dummy-user-4',
        email: 'user4@example.com',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        email_confirmed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-user-5',
        email: 'user5@example.com',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: null,
        email_confirmed_at: null
      }
    ]

    return NextResponse.json({
      success: true,
      users: dummyUsers,
      message: '더미 데이터 (서비스 롤 키 권한 필요)'
    })

    // 아래 코드는 서비스 롤 키가 있을 때 사용
    /*
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('[ADMIN USERS] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '사용자 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 데이터 정리
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      message: '사용자 목록 조회 성공'
    })
    */

  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '사용자 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

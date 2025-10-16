import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP_USER_PROFILES] 사용자 프로필 설정 시작')

    // 1. 기존 사용자 프로필 업데이트 (RLS 우회)
    const { data: updateResult, error: updateError } = await supabaseServer
      .from('users')
      .upsert({
        id: '5f83ab21-fd61-4666-94b5-087d73477476',
        email: 'han133334@naver.com',
        full_name: 'han133334',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        language: 'ko',
        is_admin: false
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (updateError) {
      console.error('[SETUP_USER_PROFILES] 사용자 업데이트 실패:', updateError)
      return NextResponse.json({ error: '사용자 업데이트 실패' }, { status: 500 })
    }

    // 2. 추가 테스트 사용자들 생성
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'user1@example.com',
        full_name: '김철수',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        language: 'ko',
        is_admin: false
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'user2@example.com',
        full_name: '이영희',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        language: 'ko',
        is_admin: false
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'user3@example.com',
        full_name: '박민수',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        language: 'ko',
        is_admin: false
      }
    ]

    const { data: insertResult, error: insertError } = await supabaseServer
      .from('users')
      .upsert(testUsers, {
        onConflict: 'id'
      })

    if (insertError) {
      console.error('[SETUP_USER_PROFILES] 테스트 사용자 생성 실패:', insertError)
      return NextResponse.json({ error: '테스트 사용자 생성 실패' }, { status: 500 })
    }

    // 3. 기존 스토리들의 user_id를 다양한 사용자로 분산 (테스트용)
    const stories = await supabaseServer
      .from('stories')
      .select('id')
      .order('created_at', { ascending: true })

    if (stories.data && stories.data.length > 1) {
      const storyIds = stories.data.map(s => s.id)
      const userIds = [
        '5f83ab21-fd61-4666-94b5-087d73477476',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333'
      ]

      for (let i = 1; i < Math.min(storyIds.length, userIds.length); i++) {
        await supabaseServer
          .from('stories')
          .update({ user_id: userIds[i] })
          .eq('id', storyIds[i])
      }
    }

    // 4. 결과 확인
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('id, email, full_name, avatar_url')

    if (usersError) {
      console.error('[SETUP_USER_PROFILES] 사용자 조회 실패:', usersError)
    }

    console.log('[SETUP_USER_PROFILES] 사용자 프로필 설정 완료')
    
    return NextResponse.json({
      message: '사용자 프로필 설정 완료',
      users: users || []
    })

  } catch (error) {
    console.error('[SETUP_USER_PROFILES] 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

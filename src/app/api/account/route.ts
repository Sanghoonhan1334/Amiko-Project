import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 올바르지 않습니다.' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError
    } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: '인증된 사용자를 찾을 수 없습니다.' }, { status: 401 })
    }

    const userId = user.id
    const deletionTimestamp = new Date().toISOString()
    const anonymizedEmail = `deleted_${userId}_${Date.now()}@helloamiko.com`
    const failedOperations: string[] = []

    const deleteByUserId = async (table: string) => {
      try {
        await supabaseServer.from(table).delete().eq('user_id', userId)
      } catch (error) {
        console.error(`[ACCOUNT_DELETE] ${table} 삭제 실패:`, error)
        failedOperations.push(`delete:${table}`)
      }
    }

    const updateByUserId = async (table: string, updates: Record<string, unknown>) => {
      try {
        await supabaseServer.from(table).update(updates).eq('user_id', userId)
      } catch (error) {
        console.error(`[ACCOUNT_DELETE] ${table} 업데이트 실패:`, error)
        failedOperations.push(`update:${table}`)
      }
    }

    const tablesToRemove = [
      'user_profiles',
      'user_preferences',
      'user_consents',
      'user_notifications',
      'user_favorites',
      'user_korean_level_results',
      'user_quiz_responses',
      'user_general_info',
      'user_student_info',
      'user_auth_status',
      'user_roles',
      'user_points',
      'user_deletion_requests',
      'data_deletion_logs',
      'point_transactions',
      'community_posts',
      'community_comments',
      'video_call_logs',
      'access_logs',
      'customer_support_records'
    ]

    for (const table of tablesToRemove) {
      await deleteByUserId(table)
    }

    // 포인트 및 로그 테이블은 기록을 위해 user_id를 익명화
    await updateByUserId('points_history', { user_id: null })
    await updateByUserId('post_reactions', { user_id: null })
    await updateByUserId('post_views', { user_id: null })

    // 갤러리 게시글/댓글은 삭제 상태로 표시
    try {
      await supabaseServer
        .from('gallery_posts')
        .update({
          is_deleted: true,
          deleted_at: deletionTimestamp
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('[ACCOUNT_DELETE] gallery_posts 업데이트 실패:', error)
      failedOperations.push('update:gallery_posts')
    }

    try {
      await supabaseServer
        .from('post_comments')
        .update({
          is_deleted: true,
          content: '[삭제된 댓글]'
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('[ACCOUNT_DELETE] post_comments 업데이트 실패:', error)
      failedOperations.push('update:post_comments')
    }

    // 사용자 레코드를 익명화
    try {
      await supabaseServer
        .from('users')
        .update({
          email: anonymizedEmail,
          full_name: null,
          spanish_name: null,
          korean_name: null,
          nickname: null,
          phone: null,
          phone_country: null,
          avatar_url: null,
          profile_image: null,
          language: null,
          is_active: false,
          deleted_at: deletionTimestamp,
          updated_at: deletionTimestamp
        })
        .eq('id', userId)
    } catch (error) {
      console.error('[ACCOUNT_DELETE] users 테이블 익명화 실패:', error)
      failedOperations.push('update:users')
    }

    // auth.users에서 계정 제거
    try {
      const { error: authDeleteError } = await supabaseServer.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        console.error('[ACCOUNT_DELETE] auth 사용자 삭제 실패:', authDeleteError)
        failedOperations.push('auth.deleteUser')
      }
    } catch (error) {
      console.error('[ACCOUNT_DELETE] auth 사용자 삭제 중 예외 발생:', error)
      failedOperations.push('auth.deleteUser')
    }

    // 삭제 로그 기록
    try {
      await supabaseServer.from('data_deletion_logs').insert({
        user_id: userId,
        action_type: 'self_account_delete',
        details: {
          failedOperations,
          executed_at: deletionTimestamp
        },
        created_at: deletionTimestamp
      })
    } catch (error) {
      console.error('[ACCOUNT_DELETE] 삭제 로그 기록 실패:', error)
      // 로그 실패는 응답을 막지 않음
    }

    return NextResponse.json({
      success: failedOperations.length === 0,
      message:
        failedOperations.length === 0
          ? '계정이 삭제되었습니다.'
          : '계정 삭제가 완료되었지만 일부 데이터 정리에 실패했습니다.',
      warnings: failedOperations
    })
  } catch (error) {
    console.error('[ACCOUNT_DELETE] 서버 오류:', error)
    return NextResponse.json(
      { error: '계정 삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}


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
    
    // SQL 함수를 사용한 데이터 삭제 (더 안정적)
    let sqlDeleteResult: any = null
    try {
      const { data: sqlResult, error: sqlError } = await supabaseServer.rpc('delete_user_account', {
        p_user_id: userId
      })
      
      if (sqlError) {
        console.error('[ACCOUNT_DELETE] SQL 함수 실행 실패:', sqlError)
        // SQL 함수 실패 시 기존 로직으로 폴백
      } else {
        sqlDeleteResult = sqlResult
        console.log('[ACCOUNT_DELETE] SQL 함수 실행 성공:', sqlResult)
        
        // SQL 함수에서 실패한 작업이 있으면 failedOperations에 추가
        if (sqlResult?.failed_operations && Array.isArray(sqlResult.failed_operations)) {
          failedOperations.push(...sqlResult.failed_operations)
        }
      }
    } catch (sqlException) {
      console.error('[ACCOUNT_DELETE] SQL 함수 실행 중 예외:', sqlException)
      // SQL 함수 실패 시 기존 로직으로 폴백
    }
    
    // SQL 함수가 성공했고 실패한 작업이 없으면 기존 삭제 로직 스킵
    if (sqlDeleteResult && (!sqlDeleteResult.failed_operations || sqlDeleteResult.failed_operations.length === 0)) {
      console.log('[ACCOUNT_DELETE] SQL 함수로 모든 데이터 삭제 완료, 기존 로직 스킵')
    } else {
      // SQL 함수가 실패했거나 부분적으로 실패한 경우 기존 로직 실행
      console.log('[ACCOUNT_DELETE] SQL 함수 실패 또는 부분 실패, 기존 로직 실행')

    const deleteByUserId = async (table: string, columnName: string = 'user_id') => {
      try {
        const { error } = await supabaseServer.from(table).delete().eq(columnName, userId)
        if (error) {
          console.error(`[ACCOUNT_DELETE] ${table} 삭제 실패:`, error)
          failedOperations.push(`delete:${table}`)
        } else {
          console.log(`[ACCOUNT_DELETE] ${table} 삭제 성공`)
        }
      } catch (error) {
        console.error(`[ACCOUNT_DELETE] ${table} 삭제 예외:`, error)
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

    // user_id 컬럼을 사용하는 테이블들 (gallery_posts, post_comments는 별도 업데이트 처리)
    const tablesToRemoveByUserId = [
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
      'story_comments', // 스토리 댓글
      'video_call_logs',
      'access_logs',
      'customer_support_records',
      'bookings', // 예약 정보
      'quiz_interactions', // 퀴즈 상호작용
      'quiz_responses' // 퀴즈 응답
    ]

    // author_id 컬럼을 사용하는 테이블들 (community-schema.sql 참고)
    const tablesToRemoveByAuthorId = [
      'posts', // posts 테이블은 author_id 사용
      'comments' // comments 테이블은 author_id 사용
    ]

      // user_id로 삭제
      for (const table of tablesToRemoveByUserId) {
        await deleteByUserId(table, 'user_id')
      }

      // author_id로 삭제
      for (const table of tablesToRemoveByAuthorId) {
        await deleteByUserId(table, 'author_id')
      }

      // 포인트 및 로그 테이블은 기록을 위해 user_id를 익명화
      await updateByUserId('point_history', { user_id: null }) // points_history → point_history로 수정
      await updateByUserId('post_reactions', { user_id: null })
      await updateByUserId('post_views', { user_id: null })
      await updateByUserId('reactions', { user_id: null }) // reactions 테이블도 익명화

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
    }

    // auth.users에서 계정 제거 (강제 삭제)
    let authDeleteSuccess = false
    try {
      // 먼저 사용자 이메일 저장 (삭제 후 확인용)
      const originalEmail = user.email
      
      // 1차 삭제 시도
      const { error: authDeleteError } = await supabaseServer.auth.admin.deleteUser(userId)
      
      if (authDeleteError) {
        console.error('[ACCOUNT_DELETE] 1차 auth 사용자 삭제 실패:', authDeleteError)
        
        // 2차 시도: 이메일로 사용자 찾아서 삭제
        try {
          const { data: authUsers, error: listError } = await supabaseServer.auth.admin.listUsers()
          
          if (!listError && authUsers) {
            const existingAuthUser = authUsers.users.find(u => u.id === userId || u.email === originalEmail)
            
            if (existingAuthUser) {
              console.log(`[ACCOUNT_DELETE] 2차 시도: 이메일로 사용자 찾음 (${existingAuthUser.id}), 강제 삭제 시도`)
              const { error: retryDeleteError } = await supabaseServer.auth.admin.deleteUser(existingAuthUser.id)
              
              if (retryDeleteError) {
                console.error('[ACCOUNT_DELETE] 2차 auth 사용자 삭제 실패:', retryDeleteError)
                failedOperations.push('auth.deleteUser')
              } else {
                console.log('[ACCOUNT_DELETE] 2차 auth 사용자 삭제 성공')
                authDeleteSuccess = true
              }
            } else {
              console.log('[ACCOUNT_DELETE] Auth에서 사용자를 찾을 수 없음 (이미 삭제됨)')
              authDeleteSuccess = true
            }
          } else {
            console.error('[ACCOUNT_DELETE] Auth 사용자 목록 조회 실패:', listError)
            failedOperations.push('auth.deleteUser')
          }
        } catch (retryError) {
          console.error('[ACCOUNT_DELETE] 2차 삭제 시도 중 예외:', retryError)
          failedOperations.push('auth.deleteUser')
        }
      } else {
        console.log('[ACCOUNT_DELETE] 1차 auth 사용자 삭제 성공')
        authDeleteSuccess = true
      }
      
      // 삭제 확인: 잠시 후 사용자가 실제로 삭제되었는지 확인
      if (authDeleteSuccess) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
        
        try {
          const { data: verifyUsers, error: verifyError } = await supabaseServer.auth.admin.listUsers()
          
          if (!verifyError && verifyUsers) {
            const stillExists = verifyUsers.users.some(u => u.id === userId || u.email === originalEmail)
            
            if (stillExists) {
              console.warn('[ACCOUNT_DELETE] 삭제 확인: 사용자가 여전히 존재함, 3차 강제 삭제 시도')
              const existingUser = verifyUsers.users.find(u => u.id === userId || u.email === originalEmail)
              
              if (existingUser) {
                const { error: forceDeleteError } = await supabaseServer.auth.admin.deleteUser(existingUser.id)
                
                if (forceDeleteError) {
                  console.error('[ACCOUNT_DELETE] 3차 강제 삭제 실패:', forceDeleteError)
                  failedOperations.push('auth.deleteUser.verify')
                } else {
                  console.log('[ACCOUNT_DELETE] 3차 강제 삭제 성공')
                }
              }
            } else {
              console.log('[ACCOUNT_DELETE] 삭제 확인: 사용자가 완전히 삭제됨')
            }
          }
        } catch (verifyError) {
          console.error('[ACCOUNT_DELETE] 삭제 확인 중 오류:', verifyError)
          // 확인 실패는 경고만 하고 계속 진행
        }
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


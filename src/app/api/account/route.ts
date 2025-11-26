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
    
    // 먼저 모든 관련 데이터를 삭제한 후 auth.users를 삭제해야 함
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
    // 단, auth.users 삭제는 항상 실행해야 함 (SQL 함수에서 처리 불가)
    if (sqlDeleteResult && (!sqlDeleteResult.failed_operations || sqlDeleteResult.failed_operations.length === 0)) {
      console.log('[ACCOUNT_DELETE] SQL 함수로 모든 데이터 삭제 완료, 기존 삭제 로직 스킵 (auth.users 삭제는 계속 진행)')
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
    // 존재하지 않는 테이블 제거: user_roles, point_transactions, video_call_logs, access_logs, customer_support_records, quiz_interactions, quiz_responses
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
      'user_points',
      'user_deletion_requests',
      'data_deletion_logs',
      'story_comments', // 스토리 댓글
      'bookings' // 예약 정보
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
      // deleted_at 컬럼이 없을 수 있으므로 is_deleted만 업데이트
      try {
        const { error: galleryError } = await supabaseServer
          .from('gallery_posts')
          .update({
            is_deleted: true
            // deleted_at 컬럼이 없을 수 있으므로 제거
          })
          .eq('user_id', userId)
        
        if (galleryError) {
          console.error('[ACCOUNT_DELETE] gallery_posts 업데이트 실패:', galleryError)
          // 테이블이 없거나 컬럼이 없으면 무시 (PGRST205, PGRST204)
          if (galleryError.code !== 'PGRST205' && galleryError.code !== 'PGRST204') {
            failedOperations.push('update:gallery_posts')
          }
        }
      } catch (error) {
        console.error('[ACCOUNT_DELETE] gallery_posts 업데이트 예외:', error)
        // 테이블이 없거나 컬럼이 없으면 무시
      }

      try {
        const { error: commentsError } = await supabaseServer
          .from('post_comments')
          .update({
            is_deleted: true,
            content: '[삭제된 댓글]'
          })
          .eq('user_id', userId)
        
        if (commentsError) {
          console.error('[ACCOUNT_DELETE] post_comments 업데이트 실패:', commentsError)
          // 테이블이 없으면 무시 (PGRST205)
          if (commentsError.code !== 'PGRST205') {
            failedOperations.push('update:post_comments')
          }
        }
      } catch (error) {
        console.error('[ACCOUNT_DELETE] post_comments 업데이트 예외:', error)
        // 테이블이 없으면 무시
      }

      // 사용자 레코드를 익명화 후 삭제 (auth.users 삭제 전에 먼저 처리)
      // 주의: public.users는 auth.users를 참조하는 외래 키가 있으므로,
      // auth.users 삭제 전에 public.users를 먼저 삭제해야 외래 키 제약 조건 문제를 피할 수 있음
      try {
        // 먼저 익명화
        const { error: usersError } = await supabaseServer
          .from('users')
          .update({
            email: anonymizedEmail,
            full_name: null,
            spanish_name: null,
            korean_name: null,
            nickname: 'deleted_user', // NOT NULL 제약 조건을 위해 빈 문자열 대신 특정 값 사용
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
        
        if (usersError) {
          console.error('[ACCOUNT_DELETE] users 테이블 익명화 실패:', usersError)
          // 익명화 실패해도 삭제는 계속 진행
        } else {
          console.log('[ACCOUNT_DELETE] users 테이블 익명화 성공')
          
          // 익명화 성공 후 삭제 (auth.users 삭제 전에)
          try {
            const { error: deleteUsersError } = await supabaseServer
              .from('users')
              .delete()
              .eq('id', userId)
            
            if (deleteUsersError) {
              console.error('[ACCOUNT_DELETE] public.users 삭제 실패:', deleteUsersError)
              // 삭제 실패해도 계속 진행 (이미 익명화됨)
            } else {
              console.log('[ACCOUNT_DELETE] public.users 삭제 성공 (auth.users 삭제 준비 완료)')
            }
          } catch (error) {
            console.error('[ACCOUNT_DELETE] public.users 삭제 예외:', error)
            // 삭제 실패해도 계속 진행
          }
        }
      } catch (error) {
        console.error('[ACCOUNT_DELETE] users 테이블 익명화 예외:', error)
        // 익명화 실패해도 삭제는 계속 진행
      }
    }

    // auth.users에서 계정 제거 (모든 관련 데이터 삭제 후)
    // SQL 함수에서 session_replication_role = replica를 사용하여 외래 키 제약 조건을 비활성화했으므로
    // public.users는 이미 삭제되었고, 이제 auth.users 삭제를 시도할 수 있음
    let authDeleteSuccess = false
    
    // SQL 함수 결과 확인: auth.users 삭제가 성공했는지 확인
    const sqlAuthDeleteFailed = sqlDeleteResult && sqlDeleteResult.failed_operations && 
      (sqlDeleteResult.failed_operations.includes('auth.users') || 
       sqlDeleteResult.failed_operations.includes('auth.users_insufficient_privilege'))
    
    if (sqlDeleteResult && !sqlAuthDeleteFailed) {
      // SQL 함수에서 auth.users 삭제가 성공했거나 시도하지 않은 경우
      // (failed_operations에 auth.users 관련 항목이 없으면 성공으로 간주)
      console.log('[ACCOUNT_DELETE] SQL 함수에서 auth.users 삭제 성공 또는 시도하지 않음, API에서 확인 필요')
      
      // auth.users가 실제로 삭제되었는지 확인
      try {
        const { data: authUserCheck, error: checkError } = await supabaseServer.auth.admin.getUserById(userId)
        
        if (checkError || !authUserCheck || !authUserCheck.user) {
          console.log('[ACCOUNT_DELETE] auth.users 삭제 확인: 사용자가 존재하지 않음 (삭제 성공)')
          authDeleteSuccess = true
        } else {
          console.log('[ACCOUNT_DELETE] auth.users 삭제 확인: 사용자가 여전히 존재함, API에서 삭제 시도 필요')
          authDeleteSuccess = false
        }
      } catch (checkException) {
        console.error('[ACCOUNT_DELETE] auth.users 삭제 확인 중 예외:', checkException)
        authDeleteSuccess = false
      }
    } else {
      console.log('[ACCOUNT_DELETE] SQL 함수에서 auth.users 삭제 실패 또는 권한 부족, API에서 재시도 필요')
      authDeleteSuccess = false
    }
    
    // SQL 함수에서 삭제가 실패했거나 확인이 필요한 경우에만 API에서 재시도
    // 먼저 사용자 이메일 저장 (삭제 후 확인용)
    const originalEmail = user.email
    
    if (!authDeleteSuccess) {
      try {
        // public.users 삭제 후 충분한 대기 시간 (데이터베이스가 모든 변경사항을 처리할 시간)
        // SQL 함수가 성공했으면 public.users는 이미 삭제되었으므로 대기 시간을 줄임
        // 하지만 Supabase의 내부 동기화를 위해 충분한 시간 필요
        const waitTime = (sqlDeleteResult && (!sqlDeleteResult.failed_operations || sqlDeleteResult.failed_operations.length === 0)) 
          ? 15000  // SQL 함수 성공 시 15초 대기 (Supabase 내부 동기화 시간)
          : 15000  // 기존 로직 실행 시도 15초 대기
        console.log(`[ACCOUNT_DELETE] auth.users 삭제 전 대기: ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // 강력한 재시도 로직: 최대 5번 재시도, 점진적으로 증가하는 대기 시간
      const maxRetries = 5
      let retryCount = 0
      let lastError: any = null
      
      while (retryCount <= maxRetries && !authDeleteSuccess) {
        if (retryCount > 0) {
          // 재시도 시 점진적으로 증가하는 대기 시간 (5초, 10초, 15초, 20초, 25초)
          const retryWaitTime = 5000 * retryCount
          console.log(`[ACCOUNT_DELETE] ${retryCount}차 재시도 전 대기: ${retryWaitTime}ms`)
          await new Promise(resolve => setTimeout(resolve, retryWaitTime))
        }
        
        console.log(`[ACCOUNT_DELETE] auth.users 삭제 시도 (${retryCount === 0 ? '1차' : `${retryCount}차 재시도`})`)
        const { error: authDeleteError } = await supabaseServer.auth.admin.deleteUser(userId)
        
        if (authDeleteError) {
          console.error(`[ACCOUNT_DELETE] ${retryCount === 0 ? '1차' : `${retryCount}차 재시도`} auth 사용자 삭제 실패:`, authDeleteError)
          console.error('[ACCOUNT_DELETE] 에러 상세:', JSON.stringify(authDeleteError, null, 2))
          console.error('[ACCOUNT_DELETE] 에러 메시지:', authDeleteError.message)
          console.error('[ACCOUNT_DELETE] 에러 코드:', authDeleteError.code)
          lastError = authDeleteError
          
          // 모든 종류의 에러에 대해 재시도 (단, 마지막 재시도까지)
          if (retryCount < maxRetries) {
            retryCount++
            continue
          } else {
            // 마지막 재시도 실패 시, 이메일로 사용자 찾아서 삭제 시도
            console.log('[ACCOUNT_DELETE] 모든 재시도 실패, 이메일로 사용자 찾아서 삭제 시도')
            try {
              const { data: authUsers, error: listError } = await supabaseServer.auth.admin.listUsers()
              
              if (!listError && authUsers) {
                const existingAuthUser = authUsers.users.find(u => u.id === userId || u.email === originalEmail)
                
                if (existingAuthUser) {
                  console.log(`[ACCOUNT_DELETE] 이메일로 사용자 찾음 (${existingAuthUser.id}), 최종 강제 삭제 시도`)
                  await new Promise(resolve => setTimeout(resolve, 5000)) // 5초 대기
                  const { error: finalDeleteError } = await supabaseServer.auth.admin.deleteUser(existingAuthUser.id)
                  
                  if (finalDeleteError) {
                    console.error('[ACCOUNT_DELETE] 최종 강제 삭제 실패:', finalDeleteError)
                    failedOperations.push('auth.deleteUser')
                  } else {
                    console.log('[ACCOUNT_DELETE] 최종 강제 삭제 성공')
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
            } catch (finalRetryError) {
              console.error('[ACCOUNT_DELETE] 최종 삭제 시도 중 예외:', finalRetryError)
              failedOperations.push('auth.deleteUser')
            }
            break
          }
        } else {
          console.log(`[ACCOUNT_DELETE] ${retryCount === 0 ? '1차' : `${retryCount}차 재시도`} auth 사용자 삭제 성공!`)
          authDeleteSuccess = true
          break
        }
      }
      
      // 삭제 확인: 잠시 후 사용자가 실제로 삭제되었는지 확인
      if (authDeleteSuccess) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3초 대기
        
        try {
          const { data: verifyUsers, error: verifyError } = await supabaseServer.auth.admin.listUsers()
          
          if (!verifyError && verifyUsers) {
            const stillExists = verifyUsers.users.some(u => u.id === userId || u.email === originalEmail)
            
            if (stillExists) {
              console.warn('[ACCOUNT_DELETE] 삭제 확인: 사용자가 여전히 존재함, 최종 확인 후 강제 삭제 시도')
              const existingUser = verifyUsers.users.find(u => u.id === userId || u.email === originalEmail)
              
              if (existingUser) {
                await new Promise(resolve => setTimeout(resolve, 5000)) // 5초 대기
                const { error: verifyDeleteError } = await supabaseServer.auth.admin.deleteUser(existingUser.id)
                
                if (verifyDeleteError) {
                  console.error('[ACCOUNT_DELETE] 확인 후 강제 삭제 실패:', verifyDeleteError)
                  failedOperations.push('auth.deleteUser.verify')
                  authDeleteSuccess = false
                } else {
                  console.log('[ACCOUNT_DELETE] 확인 후 강제 삭제 성공')
                  authDeleteSuccess = true
                }
              }
            } else {
              console.log('[ACCOUNT_DELETE] 삭제 확인: 사용자가 완전히 삭제됨')
              authDeleteSuccess = true
            }
          }
        } catch (verifyError) {
          console.error('[ACCOUNT_DELETE] 삭제 확인 중 오류:', verifyError)
          // 확인 실패는 경고만 하고 계속 진행 (삭제가 성공했을 수도 있음)
        }
        
        if (authDeleteSuccess) {
          console.log('[ACCOUNT_DELETE] auth.users 삭제 성공 확인 완료')
        }
      } else {
        console.error('[ACCOUNT_DELETE] auth.users 삭제 최종 실패, 모든 재시도 소진')
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


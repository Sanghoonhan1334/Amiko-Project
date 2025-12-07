import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * 특정 이메일의 모든 데이터를 삭제하는 API
 * 주의: 이 API는 관리자 권한이 필요하며, 신중하게 사용해야 합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, force = false } = body

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const deletionResults: any = {
      email: normalizedEmail,
      usersTable: { deleted: false, error: null },
      authUsers: { deleted: false, error: null },
      verificationCodes: { deleted: false, count: 0, error: null }
    }

    // 1. users 테이블에서 soft delete (deleted_at 설정)
    try {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('id, deleted_at')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (userData) {
        if (userData.deleted_at && !force) {
          deletionResults.usersTable.error = '이미 삭제된 계정입니다. force=true로 강제 삭제하세요.'
        } else {
          const { error: updateError } = await supabaseServer
            .from('users')
            .update({ 
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('email', normalizedEmail)

          if (updateError) {
            deletionResults.usersTable.error = updateError.message
          } else {
            deletionResults.usersTable.deleted = true
          }
        }
      }
    } catch (error) {
      deletionResults.usersTable.error = error instanceof Error ? error.message : '알 수 없는 오류'
    }

    // 2. auth.users 테이블에서 삭제 (Supabase Admin API 사용)
    try {
      const { data: authUsers } = await supabaseServer.auth.admin.listUsers()
      const authUser = authUsers?.users.find(u => u.email?.toLowerCase() === normalizedEmail)
      
      if (authUser) {
        if (authUser.deleted_at && !force) {
          deletionResults.authUsers.error = '이미 삭제된 계정입니다. force=true로 강제 삭제하세요.'
        } else {
          const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(authUser.id)
          
          if (deleteError) {
            deletionResults.authUsers.error = deleteError.message
          } else {
            deletionResults.authUsers.deleted = true
          }
        }
      }
    } catch (error) {
      deletionResults.authUsers.error = error instanceof Error ? error.message : '알 수 없는 오류'
    }

    // 3. verification_codes 테이블에서 삭제
    try {
      const { data: codes, error: codesError } = await supabaseServer
        .from('verification_codes')
        .select('id')
        .eq('email', normalizedEmail)

      if (codesError) {
        deletionResults.verificationCodes.error = codesError.message
      } else if (codes && codes.length > 0) {
        const { error: deleteError } = await supabaseServer
          .from('verification_codes')
          .delete()
          .eq('email', normalizedEmail)

        if (deleteError) {
          deletionResults.verificationCodes.error = deleteError.message
        } else {
          deletionResults.verificationCodes.deleted = true
          deletionResults.verificationCodes.count = codes.length
        }
      } else {
        deletionResults.verificationCodes.deleted = true
        deletionResults.verificationCodes.count = 0
      }
    } catch (error) {
      deletionResults.verificationCodes.error = error instanceof Error ? error.message : '알 수 없는 오류'
    }

    const allDeleted = 
      deletionResults.usersTable.deleted && 
      deletionResults.authUsers.deleted && 
      deletionResults.verificationCodes.deleted

    return NextResponse.json({
      success: allDeleted,
      message: allDeleted 
        ? '이메일 관련 모든 데이터가 삭제되었습니다.' 
        : '일부 데이터 삭제에 실패했습니다.',
      ...deletionResults
    })

  } catch (error) {
    console.error('[DELETE_USER_EMAIL] 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '이메일 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}


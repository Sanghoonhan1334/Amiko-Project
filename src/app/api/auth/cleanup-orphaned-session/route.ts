import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[CLEANUP_ORPHANED] Orphaned 세션 정리 시작:', userId)

    // public.users에 사용자가 있는지 확인
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (사용자 없음)
      console.error('[CLEANUP_ORPHANED] public.users 조회 오류:', userError)
      return NextResponse.json(
        { error: 'Failed to check user status' },
        { status: 500 }
      )
    }

    if (userData) {
      // public.users에 사용자가 있으면 정리할 필요 없음
      console.log('[CLEANUP_ORPHANED] public.users에 사용자 존재, 정리 불필요:', userId)
      return NextResponse.json({
        success: true,
        message: 'User exists in public.users, no cleanup needed'
      })
    }

    // public.users에 사용자가 없으면 auth.users에서 삭제
    console.log('[CLEANUP_ORPHANED] public.users에 사용자 없음, auth.users에서 삭제 시도 (force 옵션 사용):', userId)
    
    // 관련 데이터 먼저 정리
    try {
      // verification_codes에서 사용자 관련 데이터 삭제 (이메일로 찾기)
      const { data: authUsers } = await supabaseServer.auth.admin.listUsers()
      const authUser = authUsers?.users.find(u => u.id === userId)
      if (authUser?.email) {
        await supabaseServer
          .from('verification_codes')
          .delete()
          .eq('email', authUser.email.toLowerCase())
        console.log('[CLEANUP_ORPHANED] verification_codes 정리 완료')
      }
    } catch (cleanupError) {
      console.warn('[CLEANUP_ORPHANED] 관련 데이터 정리 중 오류 (무시하고 계속 진행):', cleanupError)
    }
    
    // force 옵션을 사용하여 외래 키 제약 조건을 무시하고 강제 삭제
    const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(userId, true)

    if (deleteError) {
      // 사용자가 이미 삭제된 경우 (user_not_found)는 성공으로 처리
      if (deleteError.code === 'user_not_found' || deleteError.status === 404) {
        console.log('[CLEANUP_ORPHANED] auth.users에서 사용자가 이미 삭제됨 (정리 완료):', userId)
        return NextResponse.json({
          success: true,
          message: 'User already deleted, cleanup completed'
        })
      }
      
      console.error('[CLEANUP_ORPHANED] auth.users 삭제 실패 (force 옵션 사용):', deleteError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete user from auth.users',
          details: deleteError.message 
        },
        { status: 500 }
      )
    }

    console.log('[CLEANUP_ORPHANED] auth.users에서 사용자 삭제 성공:', userId)

    return NextResponse.json({
      success: true,
      message: 'Orphaned session cleaned up successfully'
    })

  } catch (error) {
    console.error('[CLEANUP_ORPHANED] 오류:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}


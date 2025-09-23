import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개인정보 수집 동의 상태 조회
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
        { error: '본인의 동의 정보만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 동의 상태 조회
    const { data: consentData } = await supabaseServer
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (consentData) {
      return NextResponse.json({
        success: true,
        consentState: consentData.consent_state,
        consentDate: consentData.created_at,
        lastUpdated: consentData.updated_at
      })
    } else {
      // 기본 동의 상태 반환 (필수 항목만 true)
      const defaultConsentState = {
        essential: true,
        profile: false,
        activity: false,
        system: true,
        marketing: false
      }

      return NextResponse.json({
        success: true,
        consentState: defaultConsentState,
        consentDate: null,
        lastUpdated: null
      })
    }

  } catch (error) {
    console.error('[CONSENT_GET] 오류:', error)
    return NextResponse.json(
      { error: '동의 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 개인정보 수집 동의 저장
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, consentState, consentDate } = body

    if (!userId || !consentState) {
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
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 동의 정보만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 필수 동의 항목 확인
    if (!consentState.essential || !consentState.system) {
      return NextResponse.json(
        { error: '필수 동의 항목에 동의해야 합니다.' },
        { status: 400 }
      )
    }

    // 기존 동의 기록 확인
    const { data: existingConsent } = await supabaseServer
      .from('user_consents')
      .select('id')
      .eq('user_id', userId)
      .single()

    const consentData = {
      user_id: userId,
      consent_state: consentState,
      consent_date: consentDate || new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1',
      user_agent: request.headers.get('user-agent') || '',
      updated_at: new Date().toISOString()
    }

    let result
    if (existingConsent) {
      // 기존 동의 업데이트
      result = await supabaseServer
        .from('user_consents')
        .update(consentData)
        .eq('user_id', userId)
        .select()
    } else {
      // 새 동의 생성
      result = await supabaseServer
        .from('user_consents')
        .insert(consentData)
        .select()
    }

    if (result.error) {
      console.error('[CONSENT_POST] 데이터베이스 오류:', result.error)
      return NextResponse.json(
        { error: '동의 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 동의 변경 로그 기록
    await supabaseServer
      .from('consent_change_logs')
      .insert({
        user_id: userId,
        previous_state: existingConsent ? existingConsent.consent_state : null,
        new_state: consentState,
        change_type: existingConsent ? 'update' : 'create',
        changed_at: new Date().toISOString(),
        ip_address: consentData.ip_address,
        user_agent: consentData.user_agent
      })

    // 사용자 프로필에 동의 상태 반영
    await supabaseServer
      .from('users')
      .update({
        consent_essential: consentState.essential,
        consent_profile: consentState.profile,
        consent_activity: consentState.activity,
        consent_system: consentState.system,
        consent_marketing: consentState.marketing,
        consent_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: '개인정보 수집 동의가 저장되었습니다.',
      consentState,
      savedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CONSENT_POST] 오류:', error)
    return NextResponse.json(
      { error: '동의 정보 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 개인정보 수집 동의 철회
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, consentType } = body

    if (!userId || !consentType) {
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
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 동의 정보만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 필수 동의 항목은 철회 불가
    if (consentType === 'essential' || consentType === 'system') {
      return NextResponse.json(
        { error: '필수 동의 항목은 철회할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 현재 동의 상태 조회
    const { data: currentConsent } = await supabaseServer
      .from('user_consents')
      .select('consent_state')
      .eq('user_id', userId)
      .single()

    if (!currentConsent) {
      return NextResponse.json(
        { error: '동의 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 동의 철회
    const updatedConsentState = {
      ...currentConsent.consent_state,
      [consentType]: false
    }

    const result = await supabaseServer
      .from('user_consents')
      .update({
        consent_state: updatedConsentState,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (result.error) {
      console.error('[CONSENT_DELETE] 데이터베이스 오류:', result.error)
      return NextResponse.json(
        { error: '동의 철회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 동의 변경 로그 기록
    await supabaseServer
      .from('consent_change_logs')
      .insert({
        user_id: userId,
        previous_state: currentConsent.consent_state,
        new_state: updatedConsentState,
        change_type: 'withdraw',
        consent_type: consentType,
        changed_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || ''
      })

    // 사용자 프로필에 동의 상태 반영
    const updateData: any = {
      consent_updated_at: new Date().toISOString()
    }
    updateData[`consent_${consentType}`] = false

    await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: `${consentType} 동의가 철회되었습니다.`,
      consentState: updatedConsentState,
      withdrawnAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CONSENT_DELETE] 오류:', error)
    return NextResponse.json(
      { error: '동의 철회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

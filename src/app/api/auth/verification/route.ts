import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 이메일 인증코드 발송
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { email, phoneNumber, type } = await request.json()

    if (!type || (!email && !phoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + (type === 'email' ? 10 : 5) * 60 * 1000) // 이메일 10분, SMS 5분

    if (type === 'email') {
      // 이메일 인증코드 저장
      const { error: insertError } = await supabaseServer
        .from('verification_codes')
        .insert({
          email: email,
          code: verificationCode,
          type: 'email',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('[EMAIL_VERIFICATION] 저장 실패:', insertError)
        return NextResponse.json(
          { error: '인증코드 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 실제 이메일 발송은 별도 서비스 사용 (SendGrid, AWS SES 등)
      console.log(`[EMAIL_VERIFICATION] ${email}로 인증코드 발송: ${verificationCode}`)
      
      return NextResponse.json({
        success: true,
        message: '이메일로 인증코드가 발송되었습니다.',
        expiresIn: 600 // 10분
      })

    } else if (type === 'sms') {
      // SMS 인증코드 저장
      const { error: insertError } = await supabaseServer
        .from('verification_codes')
        .insert({
          phone_number: phoneNumber,
          code: verificationCode,
          type: 'sms',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('[SMS_VERIFICATION] 저장 실패:', insertError)
        return NextResponse.json(
          { error: '인증코드 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 실제 SMS 발송은 별도 서비스 사용 (Twilio, AWS SNS 등)
      console.log(`[SMS_VERIFICATION] ${phoneNumber}로 인증코드 발송: ${verificationCode}`)
      
      return NextResponse.json({
        success: true,
        message: 'SMS로 인증코드가 발송되었습니다.',
        expiresIn: 300 // 5분
      })
    }

    return NextResponse.json(
      { error: '지원되지 않는 인증 타입입니다.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[VERIFICATION_SEND] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증코드 검증
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { email, phoneNumber, code, type } = await request.json()

    if (!code || !type || (!email && !phoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 인증코드 검증
    const { data: verificationData, error: fetchError } = await supabaseServer
      .from('verification_codes')
      .select('*')
      .eq(type === 'email' ? 'email' : 'phone_number', type === 'email' ? email : phoneNumber)
      .eq('code', code)
      .eq('type', type)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificationData) {
      return NextResponse.json(
        { error: '인증코드가 올바르지 않거나 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 인증코드 사용 처리
    const { error: updateError } = await supabaseServer
      .from('verification_codes')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', verificationData.id)

    if (updateError) {
      console.error('[VERIFICATION_VERIFY] 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '인증 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      verified: true
    })

  } catch (error) {
    console.error('[VERIFICATION_VERIFY] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증코드 재발송
export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { email, phoneNumber, type } = await request.json()

    if (!type || (!email && !phoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 미사용 인증코드 비활성화
    await supabaseServer
      .from('verification_codes')
      .update({ verified: true }) // 비활성화 처리
      .eq(type === 'email' ? 'email' : 'phone_number', type === 'email' ? email : phoneNumber)
      .eq('type', type)
      .eq('verified', false)

    // 새로운 인증코드 발송 (POST 로직 재사용)
    const newRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ email, phoneNumber, type }),
      headers: { 'Content-Type': 'application/json' }
    })

    return await POST(newRequest)

  } catch (error) {
    console.error('[VERIFICATION_RESEND] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 재발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

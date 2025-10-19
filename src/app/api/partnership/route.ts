import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // 폼 데이터 추출
    const companyName = formData.get('companyName') as string
    const representativeName = formData.get('representativeName') as string
    const position = formData.get('position') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const businessField = formData.get('businessField') as string
    const companySize = formData.get('companySize') as string
    const partnershipType = formData.get('partnershipType') as string
    const budget = formData.get('budget') as string
    const expectedEffect = formData.get('expectedEffect') as string
    const message = formData.get('message') as string
    const attachments = formData.get('attachments') as File | null

    // 필수 필드 검증
    if (!companyName || !representativeName || !position || !email || !phone || 
        !businessField || !companySize || !partnershipType || !budget || !message) {
      return NextResponse.json(
        { message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 첨부파일 처리 (선택사항)
    let attachmentUrl = null
    if (attachments && attachments.size > 0) {
      try {
        // 파일 크기 제한 (10MB)
        if (attachments.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { message: '첨부파일 크기는 10MB를 초과할 수 없습니다.' },
            { status: 400 }
          )
        }

        // 파일 확장자 검증
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png']
        const fileName = attachments.name.toLowerCase()
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
        
        if (!hasValidExtension) {
          return NextResponse.json(
            { message: '지원하지 않는 파일 형식입니다. (PDF, DOC, PPT, 이미지 파일만 가능)' },
            { status: 400 }
          )
        }

        // Supabase Storage에 파일 업로드
        if (!supabase) {
          return NextResponse.json(
            { message: '데이터베이스 연결이 설정되지 않았습니다.' },
            { status: 500 }
          )
        }

        const fileExt = fileName.split('.').pop()
        const fileNameWithTimestamp = `partnership_${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await (supabase as any).storage
          .from('partnership-attachments')
          .upload(fileNameWithTimestamp, attachments)

        if (uploadError) {
          console.error('파일 업로드 오류:', uploadError)
          return NextResponse.json(
            { message: '첨부파일 업로드 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('partnership-attachments')
          .getPublicUrl(fileNameWithTimestamp)
        
        attachmentUrl = urlData.publicUrl
      } catch (error) {
        console.error('첨부파일 처리 오류:', error)
        return NextResponse.json(
          { message: '첨부파일 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
    }

    // 데이터베이스에 제휴 문의 저장
    if (!supabase) {
      return NextResponse.json(
        { message: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('partnership_inquiries')
      .insert([
        {
          company_name: companyName,
          representative_name: representativeName,
          position: position,
          email: email,
          phone: phone,
          business_field: businessField,
          company_size: companySize,
          partnership_type: partnershipType,
          budget: budget,
          expected_effect: expectedEffect,
          message: message,
          attachment_url: attachmentUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json(
        { message: '제휴 문의 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 관리자에게 제휴 문의 이메일 알림 발송
    try {
      const { sendNotificationEmail } = await import('@/lib/emailService')
      await sendNotificationEmail(
        'admin@helloamiko.com', // 관리자 이메일
        'new_partnership_inquiry',
        {
          inquiryId: data[0].id,
          companyName: companyName,
          representativeName: representativeName,
          email: email,
          phone: phone,
          businessField: businessField,
          partnershipType: partnershipType,
          budget: budget,
          message: message
        }
      )
      console.log('✅ 제휴 문의 관리자 이메일 알림 발송 완료')
    } catch (emailError) {
      console.error('❌ 제휴 문의 관리자 이메일 알림 발송 실패:', emailError)
    }

    return NextResponse.json(
      { 
        message: '제휴 문의가 성공적으로 제출되었습니다.',
        data: data[0]
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('제휴 문의 API 오류:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    if (!supabase) {
      return NextResponse.json(
        { message: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    let query = (supabase as any)
      .from('partnership_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json(
        { message: '제휴 문의 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('제휴 문의 조회 API 오류:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

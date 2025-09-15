import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 멘토 상태 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentorId')

    if (mentorId) {
      // 특정 멘토 상태 조회
      const { data, error } = await supabaseServer
        .from('mentor_status')
        .select('*')
        .eq('mentor_id', mentorId)
        .single()

      if (error) {
        console.error('멘토 상태 조회 실패:', error)
        return NextResponse.json(
          { error: '멘토 상태를 조회할 수 없습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mentor: data,
        message: '멘토 상태 조회 성공'
      })
    } else {
      // 모든 멘토 상태 조회
      const { data, error } = await supabaseServer
        .from('mentor_status')
        .select(`
          *,
          mentors!inner(
            id,
            name,
            avatar_url,
            is_korean,
            specialties
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('멘토 상태 목록 조회 실패:', error)
        return NextResponse.json(
          { error: '멘토 상태 목록을 조회할 수 없습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mentors: data,
        message: '멘토 상태 목록 조회 성공'
      })
    }
  } catch (error) {
    console.error('멘토 상태 조회 실패:', error)
    return NextResponse.json(
      { error: '멘토 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 멘토 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { mentorId, status, isActive } = body

    if (!mentorId || !status) {
      return NextResponse.json(
        { error: '멘토 ID와 상태가 필요합니다.' },
        { status: 400 }
      )
    }

    // 유효한 상태인지 확인
    const validStatuses = ['online', 'busy', 'offline']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      )
    }

    // 멘토 상태 업데이트 또는 생성
    const { data, error } = await supabaseServer
      .from('mentor_status')
      .upsert({
        mentor_id: mentorId,
        status: status,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'mentor_id'
      })
      .select()
      .single()

    if (error) {
      console.error('멘토 상태 업데이트 실패:', error)
      return NextResponse.json(
        { error: '멘토 상태를 업데이트할 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mentor: data,
      message: '멘토 상태 업데이트 성공'
    })
  } catch (error) {
    console.error('멘토 상태 업데이트 실패:', error)
    return NextResponse.json(
      { error: '멘토 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 투표 참여
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poll_id, option_id } = body

    if (!poll_id || !option_id) {
      return NextResponse.json(
        { error: '투표 ID와 선택지 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 투표 존재 확인
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', poll_id)
      .eq('is_active', true)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: '투표를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 투표 마감 시간 확인
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '투표가 마감되었습니다.' },
        { status: 400 }
      )
    }

    // 선택지 존재 확인
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('id', option_id)
      .eq('poll_id', poll_id)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { error: '선택지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 투표했는지 확인
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('voter_id', user.id)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: '이미 투표하셨습니다.' },
        { status: 400 }
      )
    }

    // 투표 참여
    const { data: vote, error: voteError } = await supabase
      .from('poll_votes')
      .insert({
        poll_id,
        option_id,
        voter_id: user.id
      })
      .select()
      .single()

    if (voteError) {
      console.error('투표 참여 실패:', voteError)
      return NextResponse.json(
        { error: '투표 참여에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vote,
      message: '투표가 완료되었습니다.'
    })

  } catch (error) {
    console.error('투표 참여 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 투표 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poll_id = searchParams.get('poll_id')

    if (!poll_id) {
      return NextResponse.json(
        { error: '투표 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 투표 정보와 선택지, 투표 수 조회
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          option_image_url,
          vote_count
        )
      `)
      .eq('id', poll_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: '투표를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 투표 여부 확인
    const { data: { user } } = await supabase.auth.getUser()
    let userVote = null

    if (user) {
      const { data: vote } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll_id)
        .eq('voter_id', user.id)
        .single()

      userVote = vote
    }

    return NextResponse.json({
      success: true,
      data: {
        poll,
        userVote: userVote?.option_id || null,
        hasVoted: !!userVote
      }
    })

  } catch (error) {
    console.error('투표 결과 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

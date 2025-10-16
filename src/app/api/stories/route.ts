import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

// 스토리 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[STORIES_API] Supabase 서버 클라이언트가 없음, 빈 응답 반환')
      return NextResponse.json({
        stories: [],
        pagination: {
          offset: 0,
          limit: 20,
          total: 0
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isPublic = searchParams.get('isPublic')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Authorization 헤더에서 현재 사용자 ID 가져오기
    let currentUserId = null
    const authHeader = request.headers.get('authorization')
    console.log('[STORIES_API] Authorization 헤더 확인:', { 
      hasHeader: !!authHeader, 
      headerLength: authHeader?.length,
      headerStart: authHeader?.substring(0, 20) + '...'
    })
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseServer.auth.getUser(token)
        currentUserId = user?.id
        console.log('[STORIES_API] 현재 사용자 ID:', currentUserId)
      } catch (error) {
        console.log('[STORIES_API] 토큰 검증 실패:', error)
      }
    } else {
      console.log('[STORIES_API] Authorization 헤더가 없거나 Bearer 형식이 아님')
    }

    // 임시 사용자 ID인 경우 처리 (개발 환경)
    if (userId && (userId.startsWith('user_') || userId.startsWith('temp_'))) {
      console.log('[STORIES_API] 임시 사용자 ID 감지, 빈 스토리 목록 반환')
      return NextResponse.json({
        stories: [],
        pagination: {
          offset: 0,
          limit: 20,
          total: 0
        }
      })
    }

    let query = supabaseServer
      .from('stories')
      .select(`
        id,
        image_url,
        text_content,
        is_public,
        is_expired,
        expires_at,
        created_at,
        user_id,
        like_count,
        comment_count
      `, { count: 'exact' })
      .eq('is_expired', false)
      .gt('expires_at', new Date().toISOString()) // 만료되지 않은 스토리만 조회
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 특정 사용자의 스토리만 조회
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 공개 스토리만 조회
    if (isPublic === 'true') {
      query = query.eq('is_public', true)
    }

    const { data: stories, error, count } = await query

    if (error) {
      console.error('[STORIES_LIST] 쿼리 실행 에러:', error)
      return NextResponse.json(
        { error: `스토리를 불러오는데 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }


    // 현재 사용자의 좋아요 상태 가져오기
    let userLikedStories = new Set<string>()
    if (currentUserId && stories && stories.length > 0) {
      try {
        const storyIds = stories.map(story => story.id)
        const { data: likedStories, error: likesError } = await supabaseServer
          .from('story_likes')
          .select('story_id')
          .eq('user_id', currentUserId)
          .in('story_id', storyIds)

        if (!likesError && likedStories) {
          userLikedStories = new Set(likedStories.map(like => like.story_id))
          console.log('[STORIES_API] 사용자 좋아요 상태:', Array.from(userLikedStories))
        }
      } catch (error) {
        console.error('[STORIES_API] 좋아요 상태 조회 실패:', error)
      }
    }

    // 사용자 정보를 별도로 가져오기
    const storiesWithUsers = await Promise.all(
      (stories || []).map(async (story) => {
        try {
          console.log(`[STORIES_LIST] 사용자 정보 조회 시작 (${story.user_id})`)
          
          // 먼저 user_profiles 테이블에서 조회
          const { data: profileData, error: profileError } = await supabaseServer
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', story.user_id)
            .single()

          console.log(`[STORIES_LIST] user_profiles 조회 결과:`, { profileData, profileError })

          if (!profileError && profileData && profileData.display_name) {
            console.log(`[STORIES_LIST] user_profiles에서 데이터 발견:`, profileData)
            return {
              ...story,
              text: story.text_content,
              likes: story.like_count || 0,
              comment_count: story.comment_count || 0,
              user_name: profileData.display_name,
              user_email: null,
              user_profile_image: profileData.avatar_url
            }
          }

          // user_profiles에 없으면 users 테이블에서 조회 (RLS 우회)
          console.log(`[STORIES_LIST] user_profiles에 데이터 없음, users 테이블 조회 시작`)
          const { data: userData, error: userError } = await supabaseServer
            .from('users')
            .select('id, full_name, email, avatar_url')
            .eq('id', story.user_id)
            .single()

          console.log(`[STORIES_LIST] users 테이블 조회 결과:`, { userData, userError })

          if (userError) {
            console.error(`[STORIES_LIST] 사용자 정보 조회 실패 (${story.user_id}):`, userError)
            return {
              ...story,
              text: story.text_content,
              likes: 0,
              comment_count: 0,
              user_name: '익명',
              user_email: null,
              user_profile_image: null
            }
          }

          const result = {
            ...story,
            text: story.text_content, // API 응답에 text 필드 추가
            likes: story.like_count || 0,
            comment_count: story.comment_count || 0,
            user_name: userData?.full_name || userData?.email?.split('@')[0] || '익명',
            user_email: userData?.email || null,
            user_profile_image: userData?.avatar_url || null // 실제 사용자 프로필 이미지 사용
          }
          
          console.log(`[STORIES_LIST] 최종 결과:`, result)
          return result
        } catch (err) {
          console.error(`[STORIES_LIST] 사용자 정보 처리 실패 (${story.user_id}):`, err)
          return {
            ...story,
            text: story.text_content,
            likes: story.like_count || 0,
            comments: [], // 댓글 배열 초기화
            comment_count: story.comment_count || 0,
            user_name: '익명',
            user_email: null,
            user_profile_image: null
          }
        }
      })
    )

    return NextResponse.json({
      stories: storiesWithUsers,
      userLikedStories: Array.from(userLikedStories), // 사용자가 좋아요한 스토리 ID 목록
      pagination: {
        offset,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('[STORIES_LIST] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스토리 생성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[STORIES_API] Supabase 서버 클라이언트가 없음, 스토리 생성 불가')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageUrl, text, isPublic = true, userId } = body

    // 사용자 ID 검증 (임시로 단순 검증만 수행)
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    console.log('[STORIES_CREATE] 요청 데이터:', { imageUrl, text, isPublic, userId })

    // 입력 검증
    if (!imageUrl || !text) {
      return NextResponse.json(
        { error: '이미지와 텍스트를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: '텍스트는 500자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // 스토리 생성
    const { data: story, error } = await supabaseServer
      .from('stories')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        text_content: text,
        is_public: isPublic,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후 만료
      })
      .select(`
        id,
        image_url,
        text_content,
        is_public,
        is_expired,
        expires_at,
        created_at,
        user_id
      `)
      .single()

    if (error) {
      console.error('[STORIES_CREATE] 스토리 생성 실패:', error)
      console.error('[STORIES_CREATE] 에러 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: `스토리 작성에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '스토리가 성공적으로 작성되었습니다.',
      story
    }, { status: 201 })

  } catch (error) {
    console.error('[STORIES_CREATE] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

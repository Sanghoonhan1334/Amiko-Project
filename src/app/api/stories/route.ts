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

          // user_profiles에 데이터가 있고 display_name이 있으면 우선 사용
          let userName = null
          let avatarUrl = null
          
          if (!profileError && profileData && profileData.display_name && profileData.display_name.trim() !== '') {
            console.log(`[STORIES_LIST] user_profiles에서 display_name 발견:`, profileData.display_name)
            // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
            userName = profileData.display_name.includes('#') 
              ? profileData.display_name.split('#')[0] 
              : profileData.display_name
            
            // avatar_url 처리
            avatarUrl = profileData.avatar_url
            console.log(`[STORIES_LIST] user_profiles avatar_url 원본 값:`, { 
              avatar_url: avatarUrl, 
              type: typeof avatarUrl,
              isNull: avatarUrl === null,
              isEmpty: avatarUrl === '',
              isUndefined: avatarUrl === undefined
            })
            
            if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.startsWith('http')) {
              console.log(`[STORIES_LIST] avatar_url을 공개 URL로 변환:`, avatarUrl)
              const { data: { publicUrl } } = supabaseServer.storage
                .from('profile-images')
                .getPublicUrl(avatarUrl)
              avatarUrl = publicUrl
              console.log(`[STORIES_LIST] 변환된 URL:`, avatarUrl)
            } else if (!avatarUrl || avatarUrl.trim() === '') {
              console.log(`[STORIES_LIST] avatar_url이 없거나 빈 문자열, users 테이블 확인 필요`)
              avatarUrl = null
            }
            
            // avatar_url이 있으면 여기서 반환
            if (avatarUrl) {
              console.log(`[STORIES_LIST] user_profiles에서 avatar_url 발견, 반환`)
              return {
                ...story,
                text: story.text_content,
                likes: story.like_count || 0,
                comment_count: story.comment_count || 0,
                user_name: userName,
                user_email: null,
                user_profile_image: avatarUrl
              }
            }
          }

          // user_profiles에 display_name은 있지만 avatar_url이 없거나, user_profiles 데이터가 없으면 users 테이블 조회
          console.log(`[STORIES_LIST] users 테이블 조회 시작 (user_profiles에 avatar_url이 없거나 display_name이 없음)`)
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
              user_name: userName || '익명',
              user_email: null,
              user_profile_image: null
            }
          }

          // users 테이블에서 avatar_url 확인
          let finalAvatarUrl = userData?.avatar_url || null
          console.log(`[STORIES_LIST] users avatar_url 원본 값:`, { 
            avatar_url: finalAvatarUrl, 
            type: typeof finalAvatarUrl,
            isNull: finalAvatarUrl === null,
            isEmpty: finalAvatarUrl === '',
            isUndefined: finalAvatarUrl === undefined
          })
          
          if (finalAvatarUrl && finalAvatarUrl.trim() !== '' && !finalAvatarUrl.startsWith('http')) {
            console.log(`[STORIES_LIST] avatar_url을 공개 URL로 변환 (users):`, finalAvatarUrl)
            const { data: { publicUrl } } = supabaseServer.storage
              .from('profile-images')
              .getPublicUrl(finalAvatarUrl)
            finalAvatarUrl = publicUrl
            console.log(`[STORIES_LIST] 변환된 URL (users):`, finalAvatarUrl)
          } else if (!finalAvatarUrl || finalAvatarUrl.trim() === '') {
            console.log(`[STORIES_LIST] avatar_url이 없거나 빈 문자열 (users), null로 설정`)
            finalAvatarUrl = null
          }
          
          // user_name 결정: user_profiles의 display_name 우선, 없으면 users의 full_name 또는 email
          // display_name에 #이 포함된 경우 # 이후 부분 제거
          let finalUserName = userName 
            || (userData?.full_name && userData.full_name.trim() !== '' ? userData.full_name : null)
            || (userData?.email ? userData.email.split('@')[0] : null)
            || '익명'
          
          // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
          if (finalUserName && finalUserName.includes('#')) {
            finalUserName = finalUserName.split('#')[0]
          }
          
          const result = {
            ...story,
            text: story.text_content, // API 응답에 text 필드 추가
            likes: story.like_count || 0,
            comment_count: story.comment_count || 0,
            user_name: finalUserName,
            user_email: userData?.email || null,
            user_profile_image: finalAvatarUrl
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
    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지를 선택해주세요.' },
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12')
    const status = searchParams.get('status') || 'approved'
    const includeGuide = searchParams.get('includeGuide') === 'true'

    console.log('[DANCE_VIDEOS] 비디오 조회 시작:', { limit, status, includeGuide })

    // 운영자 아이디 가져오기 (가이드 영상용)
    // admin_users 테이블의 RLS 정책 무한 재귀 문제를 피하기 위해 users 테이블에서 직접 조회
    // 또는 supabaseServer를 사용하여 RLS 우회
    let adminUserIds: string[] = []
    if (includeGuide) {
      try {
        // 방법 1: users 테이블에서 is_admin = true인 사용자 조회 (RLS 적용)
        const { data: adminUsers, error: adminError } = await supabase
          .from('users')
          .select('id')
          .eq('is_admin', true)
        
        if (!adminError && adminUsers && adminUsers.length > 0) {
          adminUserIds = adminUsers.map(au => au.id)
          console.log('[DANCE_VIDEOS] 운영자 ID 조회 성공 (users 테이블):', adminUserIds.length, '명')
        } else if (adminError) {
          console.warn('[DANCE_VIDEOS] users 테이블 조회 실패, supabaseServer 시도:', adminError.message)
          
          // 방법 2: supabaseServer 사용 (RLS 우회)
          if (supabaseServer) {
            const { data: adminUsersServer, error: adminErrorServer } = await supabaseServer
              .from('users')
              .select('id')
              .eq('is_admin', true)
            
            if (!adminErrorServer && adminUsersServer && adminUsersServer.length > 0) {
              adminUserIds = adminUsersServer.map(au => au.id)
              console.log('[DANCE_VIDEOS] 운영자 ID 조회 성공 (supabaseServer):', adminUserIds.length, '명')
            }
          }
        }
      } catch (adminErr) {
        console.warn('[DANCE_VIDEOS] 운영자 정보 조회 실패 (무시하고 계속 진행):', adminErr)
      }
    }

    // dance_videos 테이블 조회 시 admin_users RLS 무한 재귀 문제를 피하기 위해
    // supabaseServer 사용 (RLS 우회) 또는 일반 클라이언트 사용
    let videos: any[] | null = null
    let error: any = null

    // 먼저 supabaseServer로 시도 (RLS 우회)
    if (supabaseServer) {
      const { data: videosServer, error: errorServer } = await supabaseServer
        .from('dance_videos')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (!errorServer) {
        videos = videosServer
        console.log('[DANCE_VIDEOS] 비디오 조회 성공 (supabaseServer):', videos?.length || 0, '개')
      } else {
        console.warn('[DANCE_VIDEOS] supabaseServer 조회 실패, 일반 클라이언트 시도:', errorServer.message)
        // fallback: 일반 클라이언트 사용
        const { data: videosClient, error: errorClient } = await supabase
          .from('dance_videos')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        videos = videosClient
        error = errorClient
      }
    } else {
      // supabaseServer가 없으면 일반 클라이언트 사용
      const { data: videosClient, error: errorClient } = await supabase
        .from('dance_videos')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      videos = videosClient
      error = errorClient
    }

    if (error) {
      console.error('[DANCE_VIDEOS] 비디오 조회 실패:', error)
      console.error('[DANCE_VIDEOS] 에러 상세:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      // 테이블이 없을 수 있으므로 빈 배열 반환
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('[DANCE_VIDEOS] dance_videos 테이블이 없습니다. 빈 배열 반환.')
        return NextResponse.json({ 
          success: true,
          videos: [] 
        })
      }
      return NextResponse.json(
        { 
          success: false,
          error: '비디오 조회 실패', 
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    // videos가 null이면 빈 배열로 처리
    const videoList = videos || []
    console.log('[DANCE_VIDEOS] 비디오 조회 성공:', videoList.length, '개')

    // 사용자 정보 조회 (user_profiles 우선, users fallback)
    // 에러가 발생해도 비디오는 표시되도록 안전하게 처리
    const userIds = [...new Set(videoList.map(v => v.user_id))]
    const usersMap: { [key: string]: { display_name: string; avatar_url: string | null } } = {}

    // 사용자 정보 조회는 비동기로 처리하되, 에러가 발생해도 기본값 사용
    if (userIds.length > 0) {
      // 병렬 처리로 성능 개선 (최대 5개씩)
      const batchSize = 5
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (userId) => {
            try {
              let displayName = 'Anónimo'
              let avatarUrl: string | null = null

              // 먼저 user_profiles 테이블에서 조회 (테이블이 없을 수 있으므로 에러 무시)
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('display_name, avatar_url')
                  .eq('user_id', userId)
                  .maybeSingle()
                  .timeout(3000) // 3초 타임아웃

                if (!profileError && profileData && profileData.display_name) {
                  displayName = profileData.display_name.includes('#')
                    ? profileData.display_name.split('#')[0]
                    : profileData.display_name.trim()
                  avatarUrl = profileData.avatar_url
                }
              } catch (profileErr) {
                // user_profiles 테이블이 없거나 에러가 발생해도 계속 진행
                // 에러 로그는 최소화
              }

              // user_profiles에서 정보를 못 찾았으면 users 테이블 조회
              if (displayName === 'Anónimo') {
                try {
                  const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('full_name, nickname, profile_image, avatar_url')
                    .eq('id', userId)
                    .maybeSingle()
                    .timeout(3000) // 3초 타임아웃

                  if (!userError && userData) {
                    displayName = userData.nickname || userData.full_name || 'Anónimo'
                    avatarUrl = userData.profile_image || userData.avatar_url
                  }
                } catch (userErr) {
                  // 에러 로그는 최소화
                }
              }

              usersMap[userId] = {
                display_name: displayName,
                avatar_url: avatarUrl
              }
            } catch (err) {
              // 최종 fallback: 기본값 사용
              usersMap[userId] = {
                display_name: 'Anónimo',
                avatar_url: null
              }
            }
          })
        )
      }
    }

    // 가이드 영상(운영자 영상) 표시 및 정렬
    let processedVideos = videoList.map(video => {
      const userInfo = usersMap[video.user_id] || { display_name: 'Anónimo', avatar_url: null }
      return {
        ...video,
        is_guide: includeGuide && adminUserIds.length > 0 && adminUserIds.includes(video.user_id),
        like_count: video.like_count || 0,
        comment_count: video.comment_count || 0,
        view_count: video.view_count || 0,
        user_display_name: userInfo.display_name,
        user_avatar_url: userInfo.avatar_url
      }
    })

    // 가이드 영상을 첫 번째로 정렬
    if (includeGuide && adminUserIds.length > 0) {
      const guideVideos = processedVideos.filter(v => v.is_guide)
      const otherVideos = processedVideos.filter(v => !v.is_guide)
      processedVideos = [...guideVideos, ...otherVideos]
    }

    return NextResponse.json({ 
      success: true,
      videos: processedVideos 
    })
  } catch (error) {
    console.error('[DANCE_VIDEOS] 비디오 조회 예외:', error)
    console.error('[DANCE_VIDEOS] 예외 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        success: false,
        error: '비디오 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { video_url, thumbnail_url, title, playlist_id } = body

    if (!video_url) {
      return NextResponse.json(
        { error: '비디오 URL이 필요합니다.' },
        { status: 400 }
      )
    }

    // 현재 플레이리스트 가져오기 (playlist_id가 없으면)
    let finalPlaylistId = playlist_id
    if (!finalPlaylistId) {
      const { data: currentPlaylist } = await supabase
        .from('dance_playlists')
        .select('id')
        .order('week_number', { ascending: false })
        .limit(1)
        .single()

      if (currentPlaylist) {
        finalPlaylistId = currentPlaylist.id
      }
    }

    const { data: video, error } = await supabase
      .from('dance_videos')
      .insert({
        user_id: user.id,
        playlist_id: finalPlaylistId,
        video_url,
        thumbnail_url: thumbnail_url || null,
        title: title || null,
        status: 'pending', // 업로드 시 대기 상태
        like_count: 0,
        comment_count: 0,
        view_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('[DANCE_VIDEOS] 비디오 업로드 실패:', error)
      return NextResponse.json(
        { error: '비디오 업로드 실패', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      video
    })
  } catch (error) {
    console.error('[DANCE_VIDEOS] 비디오 업로드 예외:', error)
    return NextResponse.json(
      { error: '비디오 업로드 실패' },
      { status: 500 }
    )
  }
}


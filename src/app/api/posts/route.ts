import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 게시물 목록 조회 (기존 FreeBoard 호환용)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const searchQuery = searchParams.get('searchQuery') || ''
    const gallerySlug = searchParams.get('gallery') // 갤러리 슬러그 파라미터 (전체 선택 시 null)
    const category = searchParams.get('category') // 카테고리 필터 (예: "공지사항")
    const isNotice = searchParams.get('is_notice') // 공지사항 필터 (true/false)
    const exclude = searchParams.get('exclude') // 제외할 게시글 ID
    const offset = (page - 1) * limit

    console.log('[POSTS_GET] 게시물 목록 조회:', { page, limit, sortBy, searchQuery, gallerySlug, category, isNotice })

    // 공지사항 필터가 있으면 공지사항만 반환
    if (isNotice === 'true') {
      console.log('[POSTS_GET] 공지사항만 조회')

      // 공지사항만 조회
      let noticeQuery = supabaseServer
        .from('gallery_posts')
        .select(`
          id,
          title,
          content,
          images,
          category,
          view_count,
          like_count,
          dislike_count,
          comment_count,
          is_pinned,
          is_hot,
          is_notice,
          created_at,
          updated_at,
          user_id
        `)
        .eq('is_deleted', false)
        .eq('is_notice', true)
        .order('created_at', { ascending: false })

      // 카테고리 필터 적용
      if (category) {
        noticeQuery = noticeQuery.eq('category', category)
      }

      // 검색 쿼리 적용
      if (searchQuery) {
        noticeQuery = noticeQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }

      // limit 적용
      if (limit) {
        noticeQuery = noticeQuery.limit(limit)
      }

      const { data: noticePosts, error: noticeError } = await noticeQuery

      if (noticeError) {
        console.error('[POSTS_GET] 공지사항 조회 오류:', noticeError)
        return NextResponse.json({
          success: true,
          posts: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalPosts: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      }

      // 사용자 정보 조회 및 변환
      const transformedPosts = noticePosts ? await Promise.all(noticePosts.map(async (post) => {
        let userName = null
        let avatarUrl = null

        if (post.user_id) {
          try {
            const { data: profileData, error: profileError } = await supabaseServer
              .from('user_profiles')
              .select('display_name, avatar_url')
              .eq('user_id', post.user_id)
              .maybeSingle()

            if (!profileError && profileData && profileData.display_name && profileData.display_name.trim() !== '') {
              userName = profileData.display_name.includes('#')
                ? profileData.display_name.split('#')[0]
                : profileData.display_name
              avatarUrl = profileData.avatar_url
            } else {
              const { data: userData, error: userError } = await supabaseServer
                .from('users')
                .select('nickname, korean_name, spanish_name, full_name')
                .eq('id', post.user_id)
                .maybeSingle()

              if (!userError && userData) {
                userName = userData.korean_name || userData.spanish_name || userData.full_name || 'Anónimo'
              } else {
                userName = 'Anónimo'
              }
            }
          } catch (error) {
            console.error(`[POSTS_GET] 사용자 정보 조회 오류 (${post.user_id}):`, error)
            userName = 'Anónimo'
          }
        } else {
          userName = 'Anónimo'
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category || '공지사항',
          is_notice: true,
          is_survey: false,
          is_verified: false,
          is_pinned: post.is_pinned,
          view_count: post.view_count,
          like_count: post.like_count,
          dislike_count: post.dislike_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            id: post.user_id,
            name: userName,
            avatar: avatarUrl
          },
          images: post.images || []
        }
      })) : []

      return NextResponse.json({
        success: true,
        posts: transformedPosts,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalPosts: transformedPosts.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    }

    // 갤러리 데이터 조회 (일반 게시글 필터링용)
    let galleryData = null
    if (gallerySlug) {
      console.log('[POSTS_GET] 특정 갤러리 조회:', gallerySlug)
      const { data: gallery, error: galleryQueryError } = await supabaseServer
        .from('galleries')
        .select('id, slug, name_ko')
        .eq('slug', gallerySlug)
        .maybeSingle()

      console.log('[POSTS_GET] 갤러리 조회 결과:', {
        gallerySlug,
        gallery,
        galleryQueryError: galleryQueryError?.message
      })

      if (gallery) {
        galleryData = gallery
        console.log('[POSTS_GET] 갤러리 ID:', galleryData.id)
      } else {
        console.log('[POSTS_GET] 갤러리를 찾을 수 없음')
      }
    } else {
      console.log('[POSTS_GET] 전체 게시글 조회 (갤러리 필터링 없음)')
    }

    // 공지사항과 일반 게시글을 분리하여 조회 (공지사항이 항상 먼저)
    // PostgreSQL/Supabase에서 boolean 정렬: false < true
    // ascending: false -> true(true)가 먼저, false(false)가 나중
    // 따라서 공지사항(is_notice = true)을 먼저 보려면 ascending: false

    // 공지사항 먼저 가져오기 (페이지네이션 없이 모든 공지사항)
    // 공지사항은 기한(expires_at) 필드가 없으므로 모든 활성 공지사항을 표시
    let noticeQuery = supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        category,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        is_notice,
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_deleted', false)
      .eq('is_notice', true)
      .order('created_at', { ascending: false })

    // 갤러리 필터링 적용 (공지사항은 모든 갤러리에 표시되므로 조건 없음)

    // 카테고리 필터 적용 (공지사항)
    if (category) {
      noticeQuery = noticeQuery.eq('category', category)
    }

    // 검색 쿼리 적용 (공지사항)
    if (searchQuery) {
      noticeQuery = noticeQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { data: noticePosts, error: noticeError } = await noticeQuery

    console.log('[POSTS_GET] 공지사항 조회 결과:', {
      noticeCount: noticePosts?.length || 0,
      noticeError: noticeError?.message,
      noticePosts: noticePosts?.map(p => ({ id: p.id, title: p.title, is_deleted: p.is_deleted, is_notice: p.is_notice }))
    })

    // 일반 게시글 가져오기 (페이지네이션 적용)
    let regularQuery = supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        category,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        is_notice,
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_deleted', false)
      .eq('is_notice', false)

    // 갤러리 필터링 적용 (일반 게시글)
    if (gallerySlug) {
      const { data: galleryData } = await supabaseServer
        .from('galleries')
        .select('id, slug, name_ko')
        .eq('slug', gallerySlug)
        .single()

      if (galleryData) {
        regularQuery = regularQuery.eq('gallery_id', galleryData.id)
      }
    }

    // 카테고리 필터 적용 (일반 게시글)
    if (category) {
      regularQuery = regularQuery.eq('category', category)
    }

    // 제외할 게시글 필터 적용
    if (exclude) {
      regularQuery = regularQuery.neq('id', exclude)
    }

    // 검색 쿼리 적용 (일반 게시글)
    if (searchQuery) {
      regularQuery = regularQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // 정렬 적용 (일반 게시글)
    if (sortBy === 'latest') {
      regularQuery = regularQuery.order('created_at', { ascending: false })
    } else if (sortBy === 'oldest') {
      regularQuery = regularQuery.order('created_at', { ascending: true })
    } else if (sortBy === 'popular') {
      regularQuery = regularQuery.order('like_count', { ascending: false })
    } else if (sortBy === 'views') {
      regularQuery = regularQuery.order('view_count', { ascending: false })
    }

    // 고정 게시물 우선 표시 (일반 게시글)
    regularQuery = regularQuery.order('is_pinned', { ascending: false })

    // 공지사항 개수를 고려한 페이지네이션
    const noticeCount = noticePosts?.length || 0

    // 첫 페이지 (page === 1): 공지사항 + 일반 게시글
    // 두 번째 페이지 이상: 일반 게시글만
    if (page === 1) {
      // 첫 페이지: 공지사항 개수만큼 일반 게시글 개수 감소
      const regularLimit = Math.max(0, limit - noticeCount)
      if (regularLimit > 0) {
        regularQuery = regularQuery.range(0, regularLimit - 1)
      } else {
        // 공지사항이 limit를 모두 차지하면 일반 게시글 없음
        regularQuery = regularQuery.limit(0)
      }
    } else {
      // 두 번째 페이지 이상: 공지사항을 제외하고 일반 게시글만
      // offset 계산: (page - 1) * limit - noticeCount
      const regularOffset = (page - 1) * limit - noticeCount
      if (regularOffset >= 0) {
        regularQuery = regularQuery.range(regularOffset, regularOffset + limit - 1)
      } else {
        // offset이 음수면 일반 게시글 없음 (공지사항만 있는 페이지)
        regularQuery = regularQuery.limit(0)
      }
    }

    const { data: regularPosts, error: regularError } = await regularQuery

    console.log('[POSTS_GET] 일반 게시글 조회 결과:', {
      regularCount: regularPosts?.length || 0,
      regularError: regularError?.message,
      noticeCount,
      page,
      limit
    })

    // 공지사항과 일반 게시글 합치기
    const posts = [...(noticePosts || []), ...(regularPosts || [])]
    const postsError = noticeError || regularError

    // 전체 게시글 수 조회 (페이지네이션용)
    const countQuery = supabaseServer
      .from('gallery_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('is_notice', false) // 일반 게시글만 카운트 (공지사항은 항상 포함)

    // 갤러리 필터링 적용 (count 쿼리에도)
    if (gallerySlug && gallerySlug !== 'all') {
      const { data: galleryData } = await supabaseServer
        .from('galleries')
        .select('id')
        .eq('slug', gallerySlug)
        .single()

      if (galleryData) {
        countQuery.eq('gallery_id', galleryData.id)
      }
    }

    // 카테고리 필터 적용 (count 쿼리)
    if (category) {
      countQuery.eq('category', category)
    }

    // 검색 쿼리 적용 (count 쿼리)
    if (searchQuery) {
      countQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { count: totalRegularPosts, error: countError } = await countQuery

    // 총 게시글 수 = 공지사항 수 + 일반 게시글 수
    const totalPosts = (noticePosts?.length || 0) + (totalRegularPosts || 0)

    if (countError) {
      console.error('[POSTS_GET] 전체 게시글 수 조회 오류:', countError)
    }

    console.log('[POSTS_GET] 게시글 조회 결과:', {
      postsCount: posts?.length || 0,
      noticeCount: noticePosts?.length || 0,
      regularCount: regularPosts?.length || 0,
      postsError: postsError?.message,
      firstPost: posts?.[0] ? {
        id: posts[0].id,
        title: posts[0].title,
        is_notice: posts[0].is_notice,
        user_id: posts[0].user_id
      } : null,
      allPosts: posts?.map(p => ({ id: p.id, title: p.title, is_notice: p.is_notice })) || []
    })

    if (postsError) {
      console.error('[POSTS_GET] 게시물 조회 오류:', postsError)
      // 테이블이 없어도 빈 배열로 성공 응답
      return NextResponse.json({
        success: true,
        posts: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalPosts: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    }

    // 데이터가 없어도 성공으로 처리
    console.log(`[POSTS_GET] 조회된 게시물 수: ${posts?.length || 0}`)
    console.log(`[POSTS_GET] 공지사항 수: ${noticePosts?.length || 0}, 일반 게시글 수: ${regularPosts?.length || 0}`)
    console.log('[POSTS_GET] 조회된 게시물 데이터:', posts?.map(p => ({
      id: p.id,
      title: p.title,
      user_id: p.user_id,
      is_notice: p.is_notice,
      created_at: p.created_at
    })))

    // 사용자 정보 조회 (user_profiles 우선, users fallback)
    const transformedPosts = posts ? await Promise.all(posts.map(async (post) => {
      let userName = null
      let avatarUrl = null

      if (post.user_id) {
        try {
              // 먼저 user_profiles 테이블에서 조회 (상세 페이지와 동일한 로직)
          const { data: profileData, error: profileError } = await supabaseServer
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', post.user_id)
            .maybeSingle()

          console.log(`[POSTS_GET] user_profiles 조회 결과 (${post.user_id}):`, { profileData, profileError: profileError?.message })

          // user_profiles에 데이터가 있고 display_name이 있으면 우선 사용
          if (!profileError && profileData && profileData.display_name && profileData.display_name.trim() !== '') {
            // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
            userName = profileData.display_name.includes('#')
              ? profileData.display_name.split('#')[0]
              : profileData.display_name.trim()

            avatarUrl = profileData.avatar_url

            // avatar_url을 공개 URL로 변환
            if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.startsWith('http')) {
              const { data: { publicUrl } } = supabaseServer.storage
                .from('profile-images')
                .getPublicUrl(avatarUrl)
              avatarUrl = publicUrl
            }

            console.log(`[POSTS_GET] user_profiles에서 이름 조회 성공: ${post.user_id} -> ${userName}`)
          } else if (profileError) {
            console.warn(`[POSTS_GET] user_profiles 조회 오류 (${post.user_id}):`, profileError.message)
          } else if (!profileData) {
            console.log(`[POSTS_GET] user_profiles에 데이터 없음 (${post.user_id}), users 테이블 조회 시도`)
          }
        } catch (profileErr) {
          console.error(`[POSTS_GET] user_profiles 조회 예외 (${post.user_id}):`, profileErr)
        }

        // user_profiles에 데이터가 없거나 display_name이 없으면 users 테이블 조회 (상세 페이지와 동일한 우선순위)
        if (!userName || userName.trim() === '') {
          try {
            const { data: userData, error: userError } = await supabaseServer
              .from('users')
              .select('id, email, full_name, nickname, spanish_name, korean_name, profile_image, avatar_url, is_admin')
              .eq('id', post.user_id)
              .maybeSingle()

            console.log(`[POSTS_GET] users 조회 결과 (${post.user_id}):`, { userData: userData ? { id: userData.id, spanish_name: userData.spanish_name, korean_name: userData.korean_name, full_name: userData.full_name } : null, userError: userError?.message })

            if (!userError && userData) {
              // 우선순위: korean_name > spanish_name > full_name > email > 운영자 > 익명
              userName = (userData.korean_name && userData.korean_name.trim() !== '') ? userData.korean_name.trim() :
                        (userData.spanish_name && userData.spanish_name.trim() !== '') ? userData.spanish_name.trim() :
                        (userData.full_name && userData.full_name.trim() !== '') ? userData.full_name.trim() :
                        (userData.email ? userData.email.split('@')[0] : null)

              // 여전히 없으면 운영자 확인 또는 익명
              if (!userName || userName.trim() === '') {
                if (userData.is_admin) {
                  userName = 'Operador' // 운영자
                } else {
                  userName = 'Anónimo'
                }
                console.warn(`[POSTS_GET] 사용자 이름을 찾을 수 없음 (${post.user_id}), ${userName}으로 설정`)
              } else {
                console.log(`[POSTS_GET] users에서 이름 조회 성공: ${post.user_id} -> ${userName}`)
              }

              avatarUrl = userData.profile_image || userData.avatar_url
            } else if (userError) {
              console.error(`[POSTS_GET] users 조회 오류 (${post.user_id}):`, userError.message)
              userName = 'Anónimo'
            } else {
              console.warn(`[POSTS_GET] users에서 사용자를 찾을 수 없음 (${post.user_id}), 익명으로 설정`)
              userName = 'Anónimo'
            }
          } catch (userErr) {
            console.error(`[POSTS_GET] users 조회 예외 (${post.user_id}):`, userErr)
            userName = 'Anónimo'
          }
        }
      } else {
        console.warn(`[POSTS_GET] user_id가 없음, 익명으로 설정`)
        userName = 'Anónimo'
      }

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category || '자유게시판', // 카테고리 필드 추가
        is_notice: post.is_notice || false,
        is_survey: false,
        is_verified: false,
        is_pinned: post.is_pinned,
        view_count: post.view_count,
        like_count: post.like_count,
        dislike_count: post.dislike_count,
        comment_count: post.comment_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          id: post.user_id,
          full_name: userName || 'Anónimo',
          avatar_url: avatarUrl
        }
      }
    })) : []

    console.log(`[POSTS_GET] 조회 완료: ${transformedPosts.length}개 게시물`)

    const actualTotal = totalPosts || 0
    const totalPagesCount = Math.ceil(actualTotal / limit)

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      total: actualTotal,
      pagination: {
        currentPage: page,
        totalPages: totalPagesCount,
        totalPosts: actualTotal,
        hasNextPage: page < totalPagesCount,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('[POSTS_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '게시물 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 작성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[POST_CREATE] 게시물 작성 요청 시작')

    // Content-Type에 따라 데이터 파싱 방식 결정
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}
    let gallery_id, title, content, images, category_name, is_notice = false, is_pinned = false

    if (contentType.includes('multipart/form-data')) {
      // FormData 처리 (자유게시판)
      const formData = await request.formData()
      title = formData.get('title') as string
      content = formData.get('content') as string
      category_name = formData.get('category_name') as string
      const uploaded_images_json = formData.get('uploaded_images') as string

      // 업로드된 이미지 URL들 파싱
      let uploadedImages: string[] = []
      if (uploaded_images_json) {
        try {
          uploadedImages = JSON.parse(uploaded_images_json)
        } catch (error) {
          console.error('[POST_CREATE] 이미지 URL 파싱 실패:', error)
        }
      }

      console.log('[POST_CREATE] FormData 받음:', {
        title: title?.substring(0, 50),
        contentLength: content?.length,
        category_name,
        uploadedImagesCount: uploadedImages?.length
      })

      // 선택된 카테고리에 따른 갤러리 ID 결정
      let targetGallery = null
      let galleryError = null

      // 카테고리별 갤러리 매핑
      const categoryGalleryMap: { [key: string]: string } = {
        'K-POP 게시판': 'kpop',
        'K-Drama 게시판': 'drama',
        '뷰티 게시판': 'beauty',
        '한국어 게시판': 'korean',
        '스페인어 게시판': 'spanish',
        '자유게시판': 'free'
      }

      // 선택한 카테고리에 해당하는 갤러리 slug 결정
      const gallerySlug = categoryGalleryMap[category_name] || 'free'

      console.log('[POST_CREATE] 카테고리별 갤러리 매핑:', {
        category_name,
        gallerySlug
      })

      // 해당 갤러리 찾기
      const { data: galleryData, error: galleryQueryError } = await supabaseServer
        .from('galleries')
        .select('id')
        .eq('slug', gallerySlug)
        .single()

      console.log('[POST_CREATE] 갤러리 조회 결과:', {
        gallerySlug,
        galleryData,
        galleryQueryError: galleryQueryError?.message
      })

      if (galleryData) {
        targetGallery = galleryData
      } else {
        // 갤러리가 없으면 자유게시판으로 대체
        console.log('[POST_CREATE] 갤러리 없음 - 자유게시판으로 대체')

        const { data: freeGalleryData, error: freeError } = await supabaseServer
          .from('galleries')
          .select('id')
          .eq('slug', 'free')
          .single()

        if (freeGalleryData) {
          targetGallery = freeGalleryData
        } else {
          galleryError = freeError
        }
      }

      if (galleryError || !targetGallery) {
        console.error('[POST_CREATE] 갤러리 조회 실패:', galleryError)
        return NextResponse.json(
          { error: '갤러리를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      gallery_id = targetGallery.id
      images = uploadedImages // 업로드된 이미지 URL들 사용

      // body 객체에 FormData 정보 저장
      body = {
        gallery_id,
        title,
        content,
        images,
        category_name
      }
    } else {
      // JSON 처리 (기존 갤러리 및 공지사항)
      body = await request.json()
      gallery_id = body.gallery_id
      title = body.title
      content = body.content
      images = body.images
      category_name = body.category_name
      is_notice = body.is_notice || false
      is_pinned = body.is_pinned || false

      // gallery_id가 slug인 경우 실제 UUID로 변환
      if (gallery_id && typeof gallery_id === 'string' && !gallery_id.includes('-')) {
        console.log('[POST_CREATE] 갤러리 slug로 UUID 조회:', gallery_id)

        const { data: gallery, error: galleryError } = await supabaseServer
          .from('galleries')
          .select('id')
          .eq('slug', gallery_id)
          .single()

        if (galleryError || !gallery) {
          console.error('[POST_CREATE] 갤러리 조회 실패:', galleryError)
          return NextResponse.json(
            { error: `갤러리 '${gallery_id}'를 찾을 수 없습니다.` },
            { status: 404 }
          )
        }

        gallery_id = gallery.id
        console.log('[POST_CREATE] 갤러리 UUID 변환 완료:', gallery_id)
      }
    }

    // Authorization 헤더에서 토큰 추출하여 실제 사용자 ID 사용
    const authHeader = request.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[POST_CREATE] 인증 실패:', authError?.message)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      userId = user.id
      console.log('[POST_CREATE] 인증된 사용자 ID 사용:', userId)
    } else {
      // 개발 환경에서는 기본 사용자로 인증 우회
      console.log('[POST_CREATE] 토큰 없음 - 개발 환경 인증 우회')
      userId = '5f83ab21-fd61-4666-94b5-087d73477476'
    }

    // 기본 갤러리 ID 설정 (갤러리가 없을 경우 'free' 갤러리 사용)
    if (!gallery_id) {
      console.log('[POST_CREATE] 갤러리 ID가 없어서 free 갤러리 조회')

      // free 갤러리 조회
      const { data: freeGallery, error: galleryError } = await supabaseServer
        .from('galleries')
        .select('id')
        .eq('slug', 'free')
        .single()

      if (galleryError || !freeGallery) {
        console.error('[POST_CREATE] free 갤러리 조회 실패:', galleryError)
        return NextResponse.json(
          { error: '자유게시판 갤러리를 찾을 수 없습니다.' },
          { status: 500 }
        )
      }

      gallery_id = freeGallery.id
      console.log('[POST_CREATE] free 갤러리 ID 사용:', gallery_id)
    }

    // 게시글 데이터 준비
    const postData: any = {
      gallery_id: gallery_id,
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      images: images || [],
      category: category_name || '자유게시판',
      view_count: 0,
      like_count: 0,
      dislike_count: 0,
      comment_count: 0,
      is_pinned: is_pinned || false,
      is_hot: false,
      is_deleted: false
    }

    // 공지사항인 경우 is_notice 필드 추가
    if (is_notice) {
      postData.is_notice = true
    }

    console.log('[POST_CREATE] 게시글 데이터 준비 완료:', {
      gallery_id: postData.gallery_id,
      user_id: postData.user_id,
      title: postData.title.substring(0, 50),
      category: postData.category,
      imagesCount: postData.images.length
    })

    // 게시글 저장
    const { data: newPost, error: insertError } = await supabaseServer
      .from('gallery_posts')
      .insert(postData)
      .select('id, title, created_at')
      .single()

    if (insertError) {
      console.error('[POST_CREATE] 게시글 저장 실패:', insertError)
      return NextResponse.json(
        {
          error: '게시물 작성에 실패했습니다.',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    console.log('[POST_CREATE] 게시글 저장 성공:', {
      id: newPost.id,
      title: newPost.title,
      created_at: newPost.created_at
    })

    // 새로운 게시물 알림 생성 (모든 사용자에게 데이터베이스 알림 생성)
    try {
      console.log('[POST_CREATE] 게시물 알림 생성 시도')

      const postTitle = newPost.title || '새로운 게시물'

      // 게시물 알림이 활성화된 모든 사용자 조회
      const { data: eligibleUsers, error: usersError } = await supabaseServer
        .from('push_subscriptions')
        .select(`
          user_id,
          users!inner(language)
        `)
        .eq('notification_settings.push_enabled', true)
        .eq('notification_settings.post_notifications_enabled', true)
        .neq('user_id', userId) // 게시물 작성자 제외

      if (usersError) {
        console.error('[POST_CREATE] 사용자 조회 실패:', usersError)
      } else if (eligibleUsers && eligibleUsers.length > 0) {
        console.log(`[POST_CREATE] ${eligibleUsers.length}명의 사용자에게 게시물 알림 생성`)

        // 각 사용자별로 알림 생성
        const notificationsToCreate = eligibleUsers.map((user: any) => {
          const userLanguage = user.users?.language || 'es' // 기본값 스페인어

          let notificationTitle: string
          let notificationMessage: string

          if (userLanguage === 'ko') {
            notificationTitle = '새로운 게시물이 올라왔습니다'
            notificationMessage = `"${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`
          } else {
            notificationTitle = 'Nuevo post'
            notificationMessage = 'Nuevo post publicado en tablón'
          }

          return {
            user_id: user.user_id,
            type: 'new_post',
            title: notificationTitle,
            message: notificationMessage,
            related_id: newPost.id.toString(),
            data: {
              postId: newPost.id,
              postTitle: postTitle,
              galleryId: gallery_id,
              url: `/community/posts/${newPost.id}`
            }
          }
        })

        // 알림 일괄 생성
        const { data: createdNotifications, error: notificationError } = await supabaseServer
          .from('notifications')
          .insert(notificationsToCreate)
          .select()

        if (notificationError) {
          console.error('[POST_CREATE] 게시물 알림 생성 실패:', notificationError)
        } else {
          console.log(`[POST_CREATE] ${createdNotifications?.length || 0}개의 게시물 알림 생성 성공`)
        }
      }
    } catch (notificationError) {
      console.error('[POST_CREATE] 게시물 알림 생성 예외:', notificationError)
      // 알림 생성 실패해도 게시물은 생성됨
    }

    // 새로운 게시물 푸시 알림 브로드캐스트 (기존 로직 유지)
    try {
      console.log('[POST_CREATE] 게시물 푸시 알림 브로드캐스트 시도')

      const postTitle = newPost.title || '새로운 게시물'

      // 게시물 알림이 활성화된 사용자들에게 푸시 알림 발송
      const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/broadcast-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Amiko - Nuevo post', // 범용 제목 사용
          body: 'Nuevo post publicado en tablón',
          data: {
            type: 'new_post',
            postId: newPost.id,
            postTitle: postTitle,
            galleryId: gallery_id,
            url: `/community/posts/${newPost.id}`
          },
          excludeUserId: userId // 게시물 작성자는 알림 제외
        })
      })

      if (pushResponse.ok) {
        const pushResult = await pushResponse.json()
        console.log('[POST_CREATE] 게시물 푸시 알림 브로드캐스트 성공:', {
          sent: pushResult.sent,
          failed: pushResult.failed,
          total: pushResult.total
        })
      } else {
        const pushError = await pushResponse.text()
        console.error('[POST_CREATE] 게시물 푸시 알림 브로드캐스트 실패:', pushResponse.status, pushError)
        // 푸시 알림 실패해도 게시물은 생성됨
      }
    } catch (pushError) {
      console.error('[POST_CREATE] 게시물 푸시 알림 브로드캐스트 예외:', pushError)
      // 푸시 알림 실패해도 게시물은 생성됨
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      message: '게시물이 성공적으로 작성되었습니다.'
    })

  } catch (error) {
    console.error('[POST_CREATE] 서버 오류:', error)
    return NextResponse.json(
      {
        error: '게시물 작성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

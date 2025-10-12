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
    const offset = (page - 1) * limit

    console.log('[POSTS_GET] 게시물 목록 조회:', { page, limit, sortBy, searchQuery, gallerySlug })

    // 기본 쿼리 구성 (자유게시판 갤러리)
    let query = supabaseServer
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
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_deleted', false)

    // 갤러리 필터링 처리
    if (gallerySlug) {
      console.log('[POSTS_GET] 특정 갤러리 조회:', gallerySlug)
      
      // 요청된 갤러리 찾기
      const { data: galleryData, error: galleryQueryError } = await supabaseServer
        .from('galleries')
        .select('id, slug, name_ko')
        .eq('slug', gallerySlug)
        .single()
      
      console.log('[POSTS_GET] 갤러리 조회 결과:', { 
        gallerySlug,
        galleryData, 
        galleryQueryError: galleryQueryError?.message 
      })
      
      if (galleryData) {
        console.log('[POSTS_GET] 갤러리 ID로 필터링:', galleryData.id)
        query = query.eq('gallery_id', galleryData.id)
      } else {
        console.log('[POSTS_GET] 갤러리를 찾을 수 없음 - 모든 게시글 조회')
        // 갤러리가 없으면 모든 게시글 조회 (필터링 없음)
      }
    } else {
      console.log('[POSTS_GET] 전체 게시글 조회 (갤러리 필터링 없음)')
      // gallery 파라미터가 없으면 모든 게시글 조회
    }

    // 검색 쿼리 적용
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // 정렬 적용
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sortBy === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else if (sortBy === 'views') {
      query = query.order('view_count', { ascending: false })
    }

    // 고정 게시물 우선 표시
    query = query.order('is_pinned', { ascending: false })

    // 전체 게시글 수 조회 (페이지네이션 없이)
    const { count: totalPosts, error: countError } = await query.select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('[POSTS_GET] 전체 게시글 수 조회 오류:', countError)
    }

    // 페이지네이션 적용하여 실제 데이터 조회
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error: postsError } = await query

    console.log('[POSTS_GET] 게시글 조회 결과:', {
      postsCount: posts?.length || 0,
      postsError: postsError?.message,
      firstPost: posts?.[0] ? {
        id: posts[0].id,
        title: posts[0].title,
        user_id: posts[0].user_id
      } : null
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
    console.log('[POSTS_GET] 조회된 게시물 데이터:', posts?.map(p => ({
      id: p.id,
      title: p.title,
      user_id: p.user_id,
      created_at: p.created_at
    })))

    // 사용자 정보 조회
    let userMap = new Map()
    if (posts && posts.length > 0) {
      const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))]
      
      if (userIds.length > 0) {
        const { data: users } = await supabaseServer
          .from('users')
          .select('id, full_name, nickname, avatar_url')
          .in('id', userIds)
        
        userMap = new Map(users?.map(u => [u.id, u]) || [])
      }
    }

    // FreeBoard 형식으로 변환
    const transformedPosts = posts?.map(post => {
      const user = userMap.get(post.user_id)
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category || '자유게시판', // 카테고리 필드 추가
        is_notice: false,
        is_survey: false,
        is_verified: false,
        is_pinned: post.is_pinned,
        view_count: post.view_count,
        like_count: post.like_count,
        dislike_count: post.dislike_count,
        comment_count: post.comment_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        user: {
          id: post.user_id,
          full_name: user?.full_name || '익명',
          nickname: user?.nickname,
          avatar_url: user?.avatar_url
        }
      }
    }) || []

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
    let gallery_id, title, content, images, category_name

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
      // JSON 처리 (기존 갤러리)
      body = await request.json()
      gallery_id = body.gallery_id
      title = body.title
      content = body.content
      images = body.images
      category_name = body.category_name
      
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

    // 기본 사용자 ID 사용 (개발용)
    const defaultUserId = '5f83ab21-fd61-4666-94b5-087d73477476'
    
    console.log('[POST_CREATE] 기본 사용자 ID 사용:', defaultUserId)

    // 게시글 데이터 준비
    const postData: any = {
      gallery_id: gallery_id,
      user_id: defaultUserId,
      title: title.trim(),
      content: content.trim(),
      images: images || [],
      category: category_name || '자유게시판',
      view_count: 0,
      like_count: 0,
      dislike_count: 0,
      comment_count: 0,
      is_pinned: false,
      is_hot: false,
      is_deleted: false
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
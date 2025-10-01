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
    const offset = (page - 1) * limit

    console.log('[POSTS_GET] 게시물 목록 조회:', { page, limit, sortBy, searchQuery })

    // 기본 쿼리 구성 (자유게시판 갤러리)
    let query = supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        is_popular,
        created_at,
        updated_at,
        user:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          avatar_url,
          profile_image
        ),
        gallery:galleries!gallery_posts_gallery_id_fkey (
          id,
          slug,
          name_ko
        )
      `)
      .eq('is_deleted', false)

    // 자유게시판 갤러리의 게시글 조회
    console.log('[POSTS_GET] 자유게시판 갤러리의 게시글 조회')
    
    // 자유게시판 갤러리만 조회
    const { data: freeGallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (galleryError) {
      console.log('[POSTS_GET] 갤러리 조회 실패:', galleryError.message)
      // 갤러리가 없어도 빈 배열로 성공 응답
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

    if (freeGallery) {
      query = query.eq('gallery_id', freeGallery.id)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // 정렬
    switch (sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('like_count', { ascending: false })
        break
      case 'hot':
        query = query.order('is_hot', { ascending: false })
        break
      case 'most_commented':
        query = query.order('comment_count', { ascending: false })
        break
      case 'most_viewed':
        query = query.order('view_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 고정글 우선 정렬
    query = query.order('is_pinned', { ascending: false })

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error: postsError } = await query

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
      gallery_id: p.gallery_id,
      user_id: p.user_id,
      created_at: p.created_at
    })))

    // FreeBoard 형식으로 변환
    const transformedPosts = posts?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
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
      author: {
        id: post.user.id,
        full_name: post.user.full_name,
        profile_image: post.user.profile_image || post.user.avatar_url
      }
    })) || []

    console.log(`[POSTS_GET] 조회 완료: ${transformedPosts.length}개 게시물`)

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((transformedPosts.length || 0) / limit),
        totalPosts: transformedPosts.length,
        hasNextPage: transformedPosts.length === limit,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('[POSTS_GET] 게시물 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
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

    const body = await request.json()
    const { gallery_id, title, content, images, user_id } = body

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null
    
    if (authHeader) {
      // 토큰이 있는 경우 정상 인증 처리
    } else {
      // 토큰이 없는 경우 운영자 권한 확인
      console.log('[POST_CREATE] 토큰 없음 - 운영자 권한 확인')
      
      // 운영자 권한 확인을 위한 특별한 헤더나 요청 본문 확인
      const { admin_override, user_id } = body
      if (admin_override === 'admin@amiko.com' && user_id) {
        console.log('[POST_CREATE] 운영자 권한으로 인증 우회, 사용자 ID:', user_id)
        
        // 실제 사용자 ID로 사용자 정보 확인
        const { data: actualUser, error: userError } = await supabaseServer
          .from('users')
          .select('id, email, full_name')
          .eq('id', user_id)
          .single()
        
        if (userError || !actualUser) {
          console.error('[POST_CREATE] 사용자 조회 실패:', userError)
          
          // 사용자가 없으면 생성 시도
          console.log('[POST_CREATE] 사용자 없음 - 생성 시도, ID:', user_id)
          
          const { data: newUser, error: createUserError } = await supabaseServer
            .from('users')
            .insert({
              id: user_id,
              email: 'admin@amiko.com', // 기본 이메일
              full_name: 'Amiko User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id, email, full_name')
            .single()
          
          if (createUserError || !newUser) {
            console.error('[POST_CREATE] 사용자 생성 실패:', createUserError)
            return NextResponse.json(
              { error: '사용자 생성에 실패했습니다.', details: createUserError?.message },
              { status: 500 }
            )
          }
          
          authUser = newUser
          console.log('[POST_CREATE] 사용자 생성 완료:', authUser.id)
        } else {
          authUser = actualUser
          console.log('[POST_CREATE] 사용자 확인:', authUser.id)
        }
      } else {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
    }

    if (authHeader) {
      // 토큰이 있는 경우 정상 인증 처리
      const token = authHeader.replace('Bearer ', '')
      
      console.log('[POST_CREATE] 토큰 정보:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
      })
      
      // 토큰에서 사용자 정보 추출
      const { data: { user: tokenUser }, error: authError } = await supabaseServer.auth.getUser(token)
      
      console.log('[POST_CREATE] 사용자 인증 결과:', {
        hasUser: !!tokenUser,
        userId: tokenUser?.id,
        userEmail: tokenUser?.email,
        authError: authError?.message
      })
      
      if (authError || !tokenUser) {
        console.error('[POST_CREATE] 인증 실패 상세:', authError)
        return NextResponse.json(
          { error: '인증에 실패했습니다.' },
          { status: 401 }
        )
      }
      
      // 토큰으로 인증된 사용자가 실제 users 테이블에 있는지 확인
      const { data: dbUser, error: dbUserError } = await supabaseServer
        .from('users')
        .select('id, email, full_name')
        .eq('id', tokenUser.id)
        .single()
      
      if (dbUserError || !dbUser) {
        console.log('[POST_CREATE] DB에 사용자 없음 - 생성 시도:', tokenUser.id)
        
        // 사용자 생성
        const { data: newDbUser, error: createDbUserError } = await supabaseServer
          .from('users')
          .insert({
            id: tokenUser.id,
            email: tokenUser.email || 'user@amiko.com',
            full_name: tokenUser.user_metadata?.full_name || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, email, full_name')
          .single()
        
        if (createDbUserError || !newDbUser) {
          console.error('[POST_CREATE] DB 사용자 생성 실패:', createDbUserError)
          return NextResponse.json(
            { error: '사용자 생성에 실패했습니다.', details: createDbUserError?.message },
            { status: 500 }
          )
        }
        
        authUser = newDbUser
        console.log('[POST_CREATE] DB 사용자 생성 완료:', authUser.id)
      } else {
        authUser = dbUser
        console.log('[POST_CREATE] DB 사용자 확인:', authUser.id)
      }
    }

    // 입력 데이터 검증
    if (!gallery_id || !title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // gallery_id가 slug인 경우 실제 ID로 변환
    let actualGalleryId = gallery_id
    if (gallery_id === 'free' || gallery_id === '자유') {
      console.log('[POST_CREATE] 자유게시판 갤러리 ID 조회 중...')
      
      const { data: freeGallery, error: galleryError } = await supabaseServer
        .from('galleries')
        .select('id')
        .eq('slug', 'free')
        .single()
      
      console.log('[POST_CREATE] 갤러리 조회 결과:', { 
        freeGallery, 
        galleryError: galleryError?.message 
      })
      
      if (galleryError || !freeGallery) {
        console.error('[POST_CREATE] 자유게시판 갤러리 없음:', galleryError)
        
        return NextResponse.json(
          { error: '자유게시판 갤러리를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      
      actualGalleryId = freeGallery.id
      console.log('[POST_CREATE] 자유게시판 갤러리 ID 확인:', actualGalleryId)
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: '제목은 200자를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    console.log('[POST_CREATE] 게시물 작성 시작:', { 
      galleryId: actualGalleryId, 
      userId: authUser.id, 
      title: title.substring(0, 50) + '...' 
    })

    // 갤러리 존재 확인
    console.log('[POST_CREATE] 갤러리 존재 확인 중:', actualGalleryId)
    
    const { data: gallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id, slug, name_ko')
      .eq('id', actualGalleryId)
      .eq('is_active', true)
      .single()

    console.log('[POST_CREATE] 갤러리 확인 결과:', { 
      gallery, 
      galleryError: galleryError?.message 
    })

    if (galleryError || !gallery) {
      console.error('[POST_CREATE] 갤러리 없음:', galleryError)
      return NextResponse.json(
        { error: '갤러리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 게시물 작성
    console.log('[POST_CREATE] 게시물 작성 시작:', {
      galleryId: actualGalleryId,
      userId: authUser.id,
      title: title.trim(),
      contentLength: content.trim().length
    })
    
    const { data: newPost, error: postError } = await supabaseServer
      .from('gallery_posts')
      .insert({
        gallery_id: actualGalleryId,
        user_id: authUser.id,
        title: title.trim(),
        content: content.trim(),
        images: images || [],
        view_count: 0,
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        is_pinned: false,
        is_hot: false,
        is_deleted: false
      })
      .select(`
        id,
        title,
        content,
        images,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        created_at,
        updated_at,
        user:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        gallery:galleries!gallery_posts_gallery_id_fkey (
          id,
          slug,
          name_ko,
          icon,
          color
        )
      `)
      .single()

    console.log('[POST_CREATE] 게시물 작성 결과:', { 
      newPost: newPost?.id, 
      postError: postError?.message,
      postData: newPost ? {
        id: newPost.id,
        title: newPost.title,
        gallery_id: newPost.gallery_id,
        user_id: newPost.user_id
      } : null
    })

    if (postError) {
      console.error('[POST_CREATE] 게시물 작성 실패:', postError)
      return NextResponse.json(
        { error: '게시물 작성에 실패했습니다.', details: postError.message },
        { status: 500 }
      )
    }

    // 갤러리의 게시물 수 증가
    console.log('[POST_CREATE] 갤러리 카운트 업데이트 중:', actualGalleryId)
    
    // 현재 게시물 수를 가져와서 1 증가
    const { data: currentGallery, error: getGalleryError } = await supabaseServer
      .from('galleries')
      .select('post_count')
      .eq('id', actualGalleryId)
      .single()
    
    if (!getGalleryError && currentGallery) {
      const { error: countError } = await supabaseServer
        .from('galleries')
        .update({ post_count: (currentGallery.post_count || 0) + 1 })
        .eq('id', actualGalleryId)

      if (countError) {
        console.error('[POST_CREATE] 갤러리 카운트 업데이트 실패:', countError)
        // 카운트 업데이트 실패는 게시물 작성 성공에 영향을 주지 않음
      } else {
        console.log('[POST_CREATE] 갤러리 카운트 업데이트 성공')
      }
    } else {
      console.error('[POST_CREATE] 갤러리 정보 조회 실패:', getGalleryError)
    }

    console.log('[POST_CREATE] 게시물 작성 성공:', newPost.id)

    return NextResponse.json({
      success: true,
      post: newPost,
      message: '게시물이 성공적으로 작성되었습니다.'
    })

  } catch (error) {
    console.error('[POST_CREATE] 게시물 작성 오류:', error)
    console.error('[POST_CREATE] 오류 스택:', error.stack)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
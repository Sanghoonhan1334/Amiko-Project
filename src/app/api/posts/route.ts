import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { headers } from 'next/headers'

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('[POSTS_LIST] 요청 파라미터:', { category, search, sort, page, limit, offset })
    console.log('[POSTS_LIST] 카테고리 타입:', typeof category, '값:', category)

    // 기본 쿼리 구성
    let query = supabaseServer
      .from('posts')
      .select(`
        id,
        title,
        content,
        is_notice,
        is_survey,
        is_verified,
        is_pinned,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        created_at,
        updated_at,
        author:users!posts_author_id_fkey (
          id,
          full_name,
          profile_image
        ),
        category:board_categories!posts_category_id_fkey (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('status', 'published')

    console.log('[POSTS_LIST] 초기 쿼리 구성 완료, 카테고리:', category)

    // 카테고리 필터
    if (category && category !== 'all' && category !== '자유게시판') {
      console.log('[POSTS_LIST] 카테고리 필터 적용:', category)
      if (category === 'notice') {
        // 공지사항 (운영자 글만)
        console.log('[POSTS_LIST] 공지 필터 적용')
        query = query.eq('is_notice', true)
      } else if (category === 'survey') {
        // 설문조사
        console.log('[POSTS_LIST] 설문조사 필터 적용')
        query = query.eq('is_survey', true)
      } else {
        console.log('[POSTS_LIST] 카테고리명 필터 적용:', category)
        query = query.eq('category.name', category)
      }
    } else {
      console.log('[POSTS_LIST] 전체글 또는 자유게시판 - 카테고리 필터 없음')
    }

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,author:users.full_name.ilike.%${search}%`)
    }

    // 정렬
    switch (sort) {
      case 'latest':
        query = query.order('is_pinned', { ascending: false })
                   .order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('is_pinned', { ascending: false })
                   .order('view_count', { ascending: false })
        break
      case 'likes':
        query = query.order('is_pinned', { ascending: false })
                   .order('like_count', { ascending: false })
        break
      case 'comments':
        query = query.order('is_pinned', { ascending: false })
                   .order('comment_count', { ascending: false })
        break
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    console.log('[POSTS_LIST] 쿼리 실행 전')
    const { data: posts, error, count } = await query
    console.log('[POSTS_LIST] 쿼리 실행 결과:', { 
      postsCount: posts?.length || 0, 
      error: error?.message || 'none',
      count 
    })

    if (error) {
      console.error('[POSTS_LIST] 쿼리 실행 에러:', error)
      return NextResponse.json(
        { error: '게시글을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 작성자 정보 디버깅 로그
    if (posts && posts.length > 0) {
      console.log('[POST_LIST] 첫 번째 게시글 작성자 정보:', {
        postId: (posts[0] as any).id,
        authorId: (posts[0] as any).author?.id,
        authorName: (posts[0] as any).author?.full_name,
        authorProfileImage: (posts[0] as any).author?.profile_image
      })
    }

    // 전체 게시글 수 확인 (디버깅용)
    const { count: totalPostsCount } = await supabaseServer
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    console.log('[POSTS_LIST] 쿼리 결과:', {
      category,
      search,
      sort,
      page,
      limit,
      postsCount: posts?.length || 0,
      totalCount: count,
      totalPostsInDB: totalPostsCount
    })

    if (error) {
      console.error('[POSTS_LIST] 게시글 목록 조회 실패:', error)
      return NextResponse.json(
        { error: `게시글 목록을 불러오는데 실패했습니다: ${(error as any).message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('[POSTS_LIST] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 작성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.error('[POST_CREATE] Supabase 서버 클라이언트가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      )
    }

    // 요청 데이터 처리 (JSON 또는 FormData)
    let title: string, content: string, category_name: string, is_notice: boolean, is_survey: boolean, survey_options: any[], files: File[]
    
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      // JSON 형식 처리
      const body = await request.json()
      title = body.title
      content = body.content
      category_name = body.category_name
      is_notice = body.is_notice || false
      is_survey = body.is_survey || false
      survey_options = body.survey_options || []
      files = []
    } else {
      // FormData 형식 처리
      const formData = await request.formData()
      title = formData.get('title') as string
      content = formData.get('content') as string
      category_name = formData.get('category_name') as string
      is_notice = formData.get('is_notice') === 'true'
      is_survey = formData.get('is_survey') === 'true'
      survey_options = is_survey ? JSON.parse(formData.get('survey_options') as string || '[]') : []
      files = formData.getAll('files') as File[]
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 공지사항 작성 권한 확인 (운영자만 가능)
    if (is_notice) {
      const isAdmin = user.email?.includes('admin') || user.email?.includes('@amiko.com')
      if (!isAdmin) {
        return NextResponse.json(
          { error: '공지사항은 운영자만 작성할 수 있습니다.' },
          { status: 403 }
        )
      }
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: '제목은 200자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: '내용은 10,000자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // 카테고리 ID 조회
    let category_id = null
    if (category_name) {
      console.log('[POSTS_CREATE] 카테고리 조회:', category_name)
      const { data: category, error: categoryError } = await supabaseServer
        .from('board_categories')
        .select('id')
        .eq('name', category_name)
        .eq('is_active', true)
        .single()

      console.log('[POSTS_CREATE] 카테고리 조회 결과:', { category, categoryError })
      category_id = (category as any)?.id || null
    }

    // 게시글 생성
    console.log('[POSTS_CREATE] 게시글 생성 데이터:', {
      title,
      content: content.substring(0, 50) + '...',
      category_id,
      author_id: user.id,
      is_notice: is_notice || false,
      is_survey: is_survey || false,
      status: 'published'
    })

    const { data: post, error } = await (supabaseServer as any)
      .from('posts')
      .insert({
        title,
        content,
        category_id,
        author_id: user.id,
        is_notice: is_notice || false,
        is_survey: is_survey || false,
        status: 'published'
      })
      .select(`
        id,
        title,
        content,
        is_notice,
        is_survey,
        is_verified,
        is_pinned,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        created_at,
        author:users!posts_author_id_fkey (
          id,
          full_name,
          profile_image
        ),
        category:board_categories!posts_category_id_fkey (
          id,
          name
        )
      `)
      .single()

    console.log('[POSTS_CREATE] 게시글 생성 결과:', { post, error })

    if (error) {
      console.error('[POST_CREATE] 게시글 생성 실패:', error)
      return NextResponse.json(
        { error: `게시글 작성에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    // 작성된 게시글의 작성자 정보 로그
    console.log('[POST_CREATE] 작성된 게시글 정보:', {
      postId: post.id,
      authorId: post.author?.id,
      authorName: post.author?.full_name,
      authorProfileImage: post.author?.profile_image
    })

    // 설문조사인 경우 설문 데이터 생성
    if (is_survey && survey_options && survey_options.length > 0) {
      try {
        // 설문조사 생성
        const { data: survey, error: surveyError } = await (supabaseServer as any)
          .from('surveys')
          .insert({
            post_id: (post as any).id,
            title: title,
            description: content,
            is_multiple_choice: false,
            is_anonymous: true,
            is_active: true
          })
          .select()
          .single()

        if (surveyError) {
          console.error('[POST_CREATE] 설문조사 생성 실패:', surveyError)
        } else {
          // 설문조사 선택지 생성
          const optionsData = survey_options.map((option: string, index: number) => ({
            survey_id: survey.id,
            option_text: option.trim(),
            option_order: index + 1
          }))

          const { error: optionsError } = await supabaseServer
            .from('survey_options')
            .insert(optionsData)

          if (optionsError) {
            console.error('[POST_CREATE] 설문조사 선택지 생성 실패:', optionsError)
          } else {
            console.log('[POST_CREATE] 설문조사 생성 완료:', survey.id)
          }
        }
      } catch (surveyErr) {
        console.error('[POST_CREATE] 설문조사 처리 중 오류:', surveyErr)
      }
    }

    // 파일 업로드 처리
    if (files && files.length > 0) {
      try {
        console.log('[POST_CREATE] 파일 업로드 시작:', files.length, '개 파일')
        
        for (const file of files) {
          if (file.size > 0) {
            // 파일을 바이트 배열로 변환
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            // 파일명 생성 (타임스탬프 + 원본 파일명)
            const timestamp = Date.now()
            const fileExtension = file.name.split('.').pop()
            const fileName = `${post.id}_${timestamp}.${fileExtension}`
            
            // Supabase Storage에 파일 업로드
            const { data: uploadData, error: uploadError } = await supabaseServer.storage
              .from('post-attachments')
              .upload(`posts/${post.id}/${fileName}`, buffer, {
                contentType: file.type,
                cacheControl: '3600'
              })
            
            if (uploadError) {
              console.error('[POST_CREATE] 파일 업로드 실패:', uploadError)
            } else {
              console.log('[POST_CREATE] 파일 업로드 성공:', uploadData.path)
              
              // 파일 정보를 데이터베이스에 저장
              const { error: fileError } = await (supabaseServer as any)
                .from('post_attachments')
                .insert({
                  post_id: (post as any).id,
                  file_name: file.name,
                  file_path: uploadData.path,
                  file_size: file.size,
                  file_type: file.type,
                  uploaded_by: user.id
                })
              
              if (fileError) {
                console.error('[POST_CREATE] 파일 정보 저장 실패:', fileError)
              }
            }
          }
        }
      } catch (fileErr) {
        console.error('[POST_CREATE] 파일 업로드 처리 중 오류:', fileErr)
      }
    }

    return NextResponse.json({
      message: '게시글이 성공적으로 작성되었습니다.',
      post
    }, { status: 201 })

  } catch (error) {
    console.error('[POST_CREATE] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}
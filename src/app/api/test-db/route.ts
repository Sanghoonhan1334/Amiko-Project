import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_DB] 데이터베이스 연결 테스트 시작')
    
    if (!supabaseServer) {
      console.error('[TEST_DB] Supabase 서버 클라이언트가 없음')
      return NextResponse.json({
        success: false,
        error: 'Supabase 서버 클라이언트가 설정되지 않았습니다.'
      }, { status: 500 })
    }

    // 1. 기본 연결 테스트
    console.log('[TEST_DB] 기본 연결 테스트')
    const { data: connectionTest, error: connectionError } = await supabaseServer
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('[TEST_DB] 기본 연결 실패:', connectionError)
      return NextResponse.json({
        success: false,
        error: '데이터베이스 연결 실패',
        details: connectionError.message
      }, { status: 500 })
    }

    console.log('[TEST_DB] 기본 연결 성공')

    // 2. stories 테이블 존재 확인
    console.log('[TEST_DB] stories 테이블 존재 확인')
    const { data: storiesTest, error: storiesError } = await supabaseServer
      .from('stories')
      .select('count')
      .limit(1)

    if (storiesError) {
      console.error('[TEST_DB] stories 테이블 확인 실패:', storiesError)
      return NextResponse.json({
        success: false,
        error: 'stories 테이블이 존재하지 않거나 접근할 수 없습니다',
        details: storiesError.message,
        connectionWorking: true
      }, { status: 500 })
    }

    console.log('[TEST_DB] stories 테이블 존재 확인 성공')

    // 3. story_likes 테이블 존재 확인
    console.log('[TEST_DB] story_likes 테이블 존재 확인')
    const { data: likesTest, error: likesError } = await supabaseServer
      .from('story_likes')
      .select('count')
      .limit(1)

    if (likesError) {
      console.error('[TEST_DB] story_likes 테이블 확인 실패:', likesError)
      return NextResponse.json({
        success: false,
        error: 'story_likes 테이블이 존재하지 않거나 접근할 수 없습니다',
        details: likesError.message,
        storiesTableExists: true
      }, { status: 500 })
    }

    console.log('[TEST_DB] story_likes 테이블 존재 확인 성공')

    // 4. story_comments 테이블 존재 확인
    console.log('[TEST_DB] story_comments 테이블 존재 확인')
    const { data: commentsTest, error: commentsError } = await supabaseServer
      .from('story_comments')
      .select('count')
      .limit(1)

    if (commentsError) {
      console.error('[TEST_DB] story_comments 테이블 확인 실패:', commentsError)
      return NextResponse.json({
        success: false,
        error: 'story_comments 테이블이 존재하지 않거나 접근할 수 없습니다',
        details: commentsError.message,
        storiesTableExists: true,
        likesTableExists: true
      }, { status: 500 })
    }

    console.log('[TEST_DB] story_comments 테이블 존재 확인 성공')

    // 5. 함수 존재 확인 (실제 존재하는 스토리 ID로 테스트)
    console.log('[TEST_DB] 업데이트 함수 존재 확인')
    
    // 실제 존재하는 스토리 ID 조회
    const { data: existingStories, error: storiesQueryError } = await supabaseServer
      .from('stories')
      .select('id')
      .limit(1)
    
    let testStoryId = '00000000-0000-0000-0000-000000000000' // 기본값
    if (existingStories && existingStories.length > 0) {
      testStoryId = existingStories[0].id
      console.log('[TEST_DB] 실제 스토리 ID로 테스트:', testStoryId)
    } else {
      console.log('[TEST_DB] 존재하는 스토리가 없어서 더미 ID로 테스트')
    }
    
    const { data: functionTest, error: functionError } = await supabaseServer
      .rpc('increment_story_like_count', { story_id_param: testStoryId })

    // 함수가 존재하면 성공하거나 foreign key 오류가 발생
    // 함수가 존재하지 않으면 'function does not exist' 오류가 발생
    const functionsExist = !functionError || (
      functionError.message.includes('foreign key constraint') ||
      functionError.message.includes('violates') ||
      functionError.message.includes('relation') ||
      functionError.message.includes('duplicate key')
    )
    
    console.log('[TEST_DB] 함수 테스트 결과:', { 
      testStoryId,
      functionError: !!functionError,
      errorMessage: functionError?.message,
      functionsExist 
    })

    return NextResponse.json({
      success: true,
      message: '모든 테이블이 존재합니다',
      results: {
        connectionWorking: true,
        storiesTableExists: true,
        likesTableExists: true,
        commentsTableExists: true,
        functionsAvailable: functionsExist
      },
      tables: {
        stories: storiesTest,
        story_likes: likesTest,
        story_comments: commentsTest
      }
    })

  } catch (error: any) {
    console.error('[TEST_DB] 예상치 못한 오류:', error)
    return NextResponse.json({
      success: false,
      error: '예상치 못한 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}

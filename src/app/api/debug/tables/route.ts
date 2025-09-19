import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // 테이블 존재 여부 확인
    const { data: tables, error: tablesError } = await supabaseServer
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['galleries', 'gallery_posts', 'gallery_comments', 'gallery_votes'])

    if (tablesError) {
      console.error('테이블 조회 오류:', tablesError)
      return NextResponse.json({ error: '테이블 조회 실패' }, { status: 500 })
    }

    // 갤러리 데이터 확인
    const { data: galleries, error: galleriesError } = await supabaseServer
      .from('galleries')
      .select('*')
      .limit(5)

    // 갤러리 게시물 데이터 확인
    const { data: posts, error: postsError } = await supabaseServer
      .from('gallery_posts')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || [],
      galleries: galleries || [],
      posts: posts || [],
      galleriesError: galleriesError?.message,
      postsError: postsError?.message
    })

  } catch (error) {
    console.error('디버그 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

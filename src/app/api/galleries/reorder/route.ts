import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service Role 클라이언트 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// PUT /api/galleries/reorder - 갤러리 순서 변경
export async function PUT(request: NextRequest) {
  try {
    console.log('[GALLERIES REORDER] 순서 변경 요청 받음')
    
    const body = await request.json()
    const { galleries } = body
    
    if (!galleries || !Array.isArray(galleries)) {
      console.error('[GALLERIES REORDER] 잘못된 요청 형식:', body)
      return NextResponse.json(
        { error: '갤러리 목록이 필요합니다' },
        { status: 400 }
      )
    }
    
    console.log('[GALLERIES REORDER] 업데이트할 갤러리 개수:', galleries.length)
    console.log('[GALLERIES REORDER] 갤러리 순서:', galleries.map((g: any) => ({ id: g.id, sort_order: g.sort_order })))
    
    // 각 갤러리의 sort_order 업데이트
    const updates = galleries.map(async (gallery: { id: string; sort_order: number }) => {
      const { error } = await supabase
        .from('galleries')
        .update({ sort_order: gallery.sort_order })
        .eq('id', gallery.id)
      
      if (error) {
        console.error(`[GALLERIES REORDER] 갤러리 ${gallery.id} 업데이트 실패:`, error)
        throw error
      }
      
      console.log(`[GALLERIES REORDER] 갤러리 ${gallery.id} sort_order를 ${gallery.sort_order}로 업데이트 완료`)
      return true
    })
    
    await Promise.all(updates)
    
    console.log('[GALLERIES REORDER] 모든 갤러리 순서 업데이트 완료')
    
    return NextResponse.json({ 
      success: true,
      message: '갤러리 순서가 업데이트되었습니다'
    })
    
  } catch (error) {
    console.error('[GALLERIES REORDER] 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '순서 변경에 실패했습니다' },
      { status: 500 }
    )
  }
}


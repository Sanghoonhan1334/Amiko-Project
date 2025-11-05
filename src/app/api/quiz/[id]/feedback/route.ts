import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

// GET: 피드백 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 재미있음 상태 확인
    const { data: funData } = await supabaseServer
      .from('quiz_fun')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .single()

    // 정확함 상태 확인
    const { data: accurateData } = await supabaseServer
      .from('quiz_accurate')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .single()

    // 전체 카운트 조회
    const { count: funCount } = await supabaseServer
      .from('quiz_fun')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)

    const { count: accurateCount } = await supabaseServer
      .from('quiz_accurate')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)

    return NextResponse.json({
      isFun: !!funData,
      isAccurate: !!accurateData,
      funCount: funCount || 0,
      accurateCount: accurateCount || 0
    })
  } catch (error) {
    console.error('피드백 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 피드백 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const { type, action } = await request.json() // type: 'fun' | 'accurate', action: 'add' | 'remove'
    
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tableName = type === 'fun' ? 'quiz_fun' : 'quiz_accurate'

    console.log(`[FEEDBACK_POST] 요청:`, { tableName, action, quizId, userId: user.id })

    if (action === 'add') {
      // 추가
      const { data: insertData, error: insertError } = await supabaseServer
        .from(tableName)
        .insert({
          quiz_id: quizId,
          user_id: user.id
        })
      
      if (insertError) {
        console.error(`[FEEDBACK_POST] ${tableName} 추가 오류:`, insertError)
        return NextResponse.json({ 
          error: 'Failed to add feedback',
          details: insertError.message 
        }, { status: 500 })
      }
      console.log(`[FEEDBACK_POST] ${tableName} 추가 성공:`, insertData)
    } else {
      // 제거
      const { data: deleteData, error: deleteError } = await supabaseServer
        .from(tableName)
        .delete()
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
      
      if (deleteError) {
        console.error(`[FEEDBACK_POST] ${tableName} 제거 오류:`, deleteError)
        return NextResponse.json({ 
          error: 'Failed to remove feedback',
          details: deleteError.message 
        }, { status: 500 })
      }
      console.log(`[FEEDBACK_POST] ${tableName} 제거 성공:`, deleteData)
    }

    // 업데이트된 카운트 조회
    const { count, error: countError } = await supabaseServer
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)

    if (countError) {
      console.error(`[FEEDBACK_POST] ${tableName} 카운트 조회 오류:`, countError)
    }

    console.log(`[FEEDBACK_POST] 최종 카운트:`, count)

    return NextResponse.json({
      success: true,
      count: count || 0
    })
  } catch (error) {
    console.error('피드백 토글 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


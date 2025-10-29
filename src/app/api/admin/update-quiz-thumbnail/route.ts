import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // 퀴즈 썸네일 경로 업데이트
    const { data, error } = await supabase
      .from('quizzes')
      .update({ 
        thumbnail_url: '/quizzes/mbti-with-kpop-stars/cover/cover.png' 
      })
      .eq('id', 1)
      .select()

    if (error) {
      console.error('Error updating quiz thumbnail:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Quiz thumbnail updated successfully',
      data 
    })
  } catch (error) {
    console.error('Error updating quiz thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 퀴즈 데이터 확인
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')

    if (error) {
      console.error('Error fetching quiz data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data 
    })
  } catch (error) {
    console.error('Error fetching quiz data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

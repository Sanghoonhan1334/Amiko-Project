import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // 운세 테스트 데이터 생성
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        id: 'fortune-test-' + Date.now(),
        slug: 'fortune',
        title: 'Test de Fortuna Personalizada',
        description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
        category: 'fortune',
        thumbnail_url: '/quizzes/fortune/cover/cover.png',
        total_questions: 9,
        is_active: true,
        total_participants: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fortune test:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

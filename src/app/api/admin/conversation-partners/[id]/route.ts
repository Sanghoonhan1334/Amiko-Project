import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 화상 채팅 파트너 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('conversation_partners')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('파트너 삭제 오류:', error)
      return NextResponse.json(
        { error: '파트너 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('파트너 삭제 예외:', error)
    return NextResponse.json(
      { error: '파트너 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}


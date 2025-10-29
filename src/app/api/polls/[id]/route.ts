import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pollId } = await params

    // 먼저 투표가 존재하고, 사용자가 작성자인지 확인
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, created_by')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this poll' }, { status: 403 })
    }

    // 투표 삭제 (CASCADE로 옵션과 투표도 함께 삭제됨)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (deleteError) {
      console.error('[POLLS_DELETE] Error deleting poll:', deleteError)
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Poll deleted successfully' })
  } catch (error: any) {
    console.error('[POLLS_DELETE] Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete poll',
      details: error.toString()
    }, { status: 500 })
  }
}


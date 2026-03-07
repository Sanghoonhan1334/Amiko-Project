import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE /api/education/sessions/[id]/chat/[messageId]
// Elimina un mensaje del chat de una sesión.
// Solo el autor del mensaje, el instructor del curso o un admin puede eliminarlo.
// Query param: ?userId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Obtener el mensaje
    const { data: message, error } = await supabase
      .from('education_chat_messages')
      .select('id, user_id, session_id')
      .eq('id', messageId)
      .eq('session_id', id)
      .single()

    if (error || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const isOwner = message.user_id === userId

    if (!isOwner) {
      // Verificar si es instructor del curso
      const { data: session } = await supabase
        .from('education_sessions')
        .select(`
          course_id,
          course:education_courses(
            instructor:instructor_profiles(user_id)
          )
        `)
        .eq('id', id)
        .single()

      const instructorUserId = (session?.course as { instructor?: { user_id?: string } } | null)
        ?.instructor?.user_id

      if (instructorUserId !== userId) {
        // Verificar si es admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
          return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 })
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('education_chat_messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted_message_id: messageId })
  } catch (err) {
    console.error('[Education] chat delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

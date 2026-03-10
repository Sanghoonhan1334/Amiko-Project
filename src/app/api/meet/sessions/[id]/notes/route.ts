import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * POST   /api/meet/sessions/[id]/notes — Create a session note
 * GET    /api/meet/sessions/[id]/notes — Get notes for a session
 * PATCH  /api/meet/sessions/[id]/notes — Update own note (requires noteId in body)
 * DELETE /api/meet/sessions/[id]/notes — Delete own note (requires noteId in body)
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sessionId } = await context.params

  // Verify participant (exclude cancelled)
  const { data: participant } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .in('status', ['enrolled', 'joined', 'left'])
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      title,
      content,
      language,
      note_type,
      tags,
      session_timestamp_start,
      session_timestamp_end,
      is_public,
    } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const validTypes = ['general', 'vocabulary', 'grammar', 'cultural', 'pronunciation']
    if (note_type && !validTypes.includes(note_type)) {
      return NextResponse.json({ error: 'Invalid note_type' }, { status: 400 })
    }

    const { data: note, error: insertError } = await supabaseServer
      .from('amiko_meet_session_notes')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        title: title || null,
        content: content.trim(),
        language: language || 'es',
        note_type: note_type || 'general',
        tags: tags || [],
        session_timestamp_start: session_timestamp_start || null,
        session_timestamp_end: session_timestamp_end || null,
        is_public: is_public || false,
      } as any)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sessionId } = await context.params

  const { searchParams } = new URL(request.url)
  const noteType = searchParams.get('type')
  const onlyMine = searchParams.get('mine') === 'true'

  let query = supabaseServer
    .from('amiko_meet_session_notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (noteType) query = query.eq('note_type', noteType)
  if (onlyMine) {
    query = query.eq('user_id', user.id)
  } else {
    // Show own notes + public notes from others
    query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
  }

  const { data: notes, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, notes: notes || [] })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { noteId, title, content, note_type, tags, is_public } = body

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabaseServer
      .from('amiko_meet_session_notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single()

    if (!existing || (existing as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Note not found or not owned' }, { status: 404 })
    }

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })
      }
      updates.content = content.trim()
    }
    if (note_type !== undefined) {
      const validTypes = ['general', 'vocabulary', 'grammar', 'cultural', 'pronunciation']
      if (!validTypes.includes(note_type)) {
        return NextResponse.json({ error: 'Invalid note_type' }, { status: 400 })
      }
      updates.note_type = note_type
    }
    if (tags !== undefined) updates.tags = tags
    if (is_public !== undefined) updates.is_public = is_public
    updates.updated_at = new Date().toISOString()

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: note, error: updateError } = await (supabaseServer
      .from('amiko_meet_session_notes') as any)
      .update(updates)
      .eq('id', noteId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json({ success: true, note })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabaseServer
      .from('amiko_meet_session_notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single()

    if (!existing || (existing as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Note not found or not owned' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseServer
      .from('amiko_meet_session_notes')
      .delete()
      .eq('id', noteId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/meet/slots — List all admin slots
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const auth = await requireAdmin(request)
    if (!auth.authenticated) return auth.response

    const { data, error } = await supabaseServer
      .from('amiko_meet_slots')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('[MEET_SLOTS] Error listing slots:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slots: data || [] })
  } catch (err) {
    console.error('[MEET_SLOTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/meet/slots — Create a new slot
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const auth = await requireAdmin(request)
    if (!auth.authenticated) return auth.response

    const body = await request.json()
    const { day_of_week, start_time, end_time, timezone, max_participants } = body

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: 'day_of_week must be 0-6' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('amiko_meet_slots')
      .insert({
        day_of_week,
        start_time,
        end_time,
        timezone: timezone || 'Asia/Seoul',
        max_participants: max_participants || 6,
        is_active: true,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('[MEET_SLOTS] Error creating slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slot: data }, { status: 201 })
  } catch (err) {
    console.error('[MEET_SLOTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/meet/slots — Update a slot (pass id in body)
export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const auth = await requireAdmin(request)
    if (!auth.authenticated) return auth.response

    const body = await request.json()
    const { id, day_of_week, start_time, end_time, timezone, max_participants, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Slot id is required' }, { status: 400 })
    }

    // Only allow specific fields to prevent mass assignment
    const allowedUpdates: Record<string, any> = {}
    if (day_of_week !== undefined) allowedUpdates.day_of_week = day_of_week
    if (start_time !== undefined) allowedUpdates.start_time = start_time
    if (end_time !== undefined) allowedUpdates.end_time = end_time
    if (timezone !== undefined) allowedUpdates.timezone = timezone
    if (max_participants !== undefined) allowedUpdates.max_participants = max_participants
    if (is_active !== undefined) allowedUpdates.is_active = is_active

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await (supabaseServer as any)
      .from('amiko_meet_slots')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[MEET_SLOTS] Error updating slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slot: data })
  } catch (err) {
    console.error('[MEET_SLOTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/meet/slots — Delete a slot (pass id in body)
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const auth = await requireAdmin(request)
    if (!auth.authenticated) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Slot id is required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('amiko_meet_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[MEET_SLOTS] Error deleting slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[MEET_SLOTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

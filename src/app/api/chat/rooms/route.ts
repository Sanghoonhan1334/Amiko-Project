import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching chat rooms:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rooms: data || []
    })
  } catch (error) {
    console.error('Error in GET /api/chat/rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, country, description, created_by, thumbnail_url } = body

    // Validate required fields
    if (!name || !type || !created_by) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type-specific fields
    if (type === 'country' && !country) {
      return NextResponse.json(
        { success: false, error: 'Country is required for country type' },
        { status: 400 }
      )
    }

    // Create room data
    const roomData: any = {
      name,
      type,
      description,
      created_by,
      is_active: true
    }

    if (type === 'country') {
      roomData.country = country
    }

    if (thumbnail_url) {
      roomData.thumbnail_url = thumbnail_url
    }

    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('chat_rooms')
      .insert(roomData)
      .select()
      .single()

    if (error) {
      console.error('Error creating chat room:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Auto-join creator to room using supabaseAdmin
    const { error: joinError } = await supabaseAdmin
      .from('chat_room_participants')
      .insert({
        room_id: data.id,
        user_id: created_by
      })

    if (joinError) {
      console.error('Error joining room:', joinError)
    }

    return NextResponse.json({
      success: true,
      room: data
    })
  } catch (error) {
    console.error('Error in POST /api/chat/rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create chat room' },
      { status: 500 }
    )
  }
}

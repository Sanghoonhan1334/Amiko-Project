import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/fanzone/chat - Obtener mensajes de chat
 * POST /api/fanzone/chat - Enviar mensaje de chat
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fanroomId = searchParams.get('fanroomId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!fanroomId) {
      return NextResponse.json(
        { error: 'ID de FanRoom requerido' },
        { status: 400 }
      )
    }

    // Verificar membresía
    const { data: membership } = await supabase
      .from('fanroom_members')
      .select('id')
      .eq('fanroom_id', fanroomId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Debes ser miembro para ver el chat' },
        { status: 403 }
      )
    }

    // Obtener mensajes de chat
    const { data: messages, error } = await supabase
      .from('fanroom_chat')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('fanroom_id', fanroomId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching chat messages:', error)
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messages: messages || []
    })

  } catch (error) {
    console.error('Error in get chat messages:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fanroomId, message } = body

    if (!fanroomId || !message) {
      return NextResponse.json(
        { error: 'FanRoom ID y mensaje son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar membresía
    const { data: membership } = await supabase
      .from('fanroom_members')
      .select('id')
      .eq('fanroom_id', fanroomId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Debes ser miembro para enviar mensajes' },
        { status: 403 }
      )
    }

    // Enviar mensaje
    const { data: chatMessage, error } = await supabase
      .from('fanroom_chat')
      .insert({
        fanroom_id: fanroomId,
        user_id: user.id,
        message
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (error) {
      console.error('Error sending chat message:', error)
      return NextResponse.json(
        { error: 'Error al enviar mensaje' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: chatMessage
    })

  } catch (error) {
    console.error('Error in send chat message:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

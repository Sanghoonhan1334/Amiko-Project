import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/fanzone/join - Unirse a FanRoom
 */
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
    const { fanroomId } = body

    if (!fanroomId) {
      return NextResponse.json(
        { error: 'ID de FanRoom requerido' },
        { status: 400 }
      )
    }

    // Verificar que el FanRoom existe y es público
    const { data: fanroom, error: fanroomError } = await supabase
      .from('fanrooms')
      .select('id, visibility')
      .eq('id', fanroomId)
      .single()

    if (fanroomError || !fanroom) {
      return NextResponse.json(
        { error: 'FanRoom no encontrado' },
        { status: 404 }
      )
    }

    if (fanroom.visibility === 'private') {
      return NextResponse.json(
        { error: 'Este FanRoom es privado' },
        { status: 403 }
      )
    }

    // Verificar si ya es miembro
    const { data: existingMembership } = await supabase
      .from('fanroom_members')
      .select('id')
      .eq('fanroom_id', fanroomId)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Ya eres miembro de este FanRoom' },
        { status: 400 }
      )
    }

    // Unirse al FanRoom
    const { data: membership, error: joinError } = await supabase
      .from('fanroom_members')
      .insert({
        fanroom_id: fanroomId,
        user_id: user.id,
        role: 'member'
      })
      .select()
      .single()

    if (joinError) {
      console.error('Error joining fanroom:', joinError)
      return NextResponse.json(
        { error: 'Error al unirse al FanRoom' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      membership,
      message: 'Te has unido al FanRoom exitosamente'
    })

  } catch (error) {
    console.error('Error in join fanroom:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

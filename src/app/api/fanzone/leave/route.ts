import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * DELETE /api/fanzone/leave - Salir de FanRoom
 */
export async function DELETE(request: NextRequest) {
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

    if (!fanroomId) {
      return NextResponse.json(
        { error: 'ID de FanRoom requerido' },
        { status: 400 }
      )
    }

    // Verificar membresía
    const { data: membership, error: membershipError } = await supabase
      .from('fanroom_members')
      .select('id, role')
      .eq('fanroom_id', fanroomId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este FanRoom' },
        { status: 404 }
      )
    }

    // No permitir que el creator salga (debe transferir o eliminar)
    if (membership.role === 'creator') {
      return NextResponse.json(
        { error: 'El creador no puede salir del FanRoom. Transfiere la propiedad o elimina el FanRoom.' },
        { status: 400 }
      )
    }

    // Salir del FanRoom
    const { error: leaveError } = await supabase
      .from('fanroom_members')
      .delete()
      .eq('fanroom_id', fanroomId)
      .eq('user_id', user.id)

    if (leaveError) {
      console.error('Error leaving fanroom:', leaveError)
      return NextResponse.json(
        { error: 'Error al salir del FanRoom' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Has salido del FanRoom exitosamente'
    })

  } catch (error) {
    console.error('Error in leave fanroom:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/fanzone/fanroom/[country]/[slug] - Obtener FanRoom específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { country: string; slug: string } }
) {
  try {
    console.log('🔍 [FANROOM API] Starting request for:', params.country, params.slug)
    const supabase = await createSupabaseClient()
    console.log('✅ [FANROOM API] Supabase client created')
    
    const { country, slug } = params

    // Verificar autenticación (opcional para FanRoom público)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 [FANROOM API] User:', user ? 'authenticated' : 'anonymous')

    // Buscar FanRoom por país y slug
    const { data: fanroom, error } = await supabase
      .from('fanrooms')
      .select('*')
      .eq('country', country)
      .eq('slug', slug)
      .eq('visibility', 'public')
      .not('creator_id', 'is', null) // 테스트 데이터 제외
      .single()

    if (error) {
      console.error('❌ [FANROOM API] Error fetching fanroom:', error)
      return NextResponse.json(
        { error: 'FanRoom no encontrado', details: error.message },
        { status: 404 }
      )
    }

    if (!fanroom) {
      console.log('❌ [FANROOM API] FanRoom not found')
      return NextResponse.json(
        { error: 'FanRoom no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [FANROOM API] FanRoom found:', fanroom.name)

    // Creator 정보를 간단하게 처리
    const creatorInfo = fanroom.creator_id ? {
      id: fanroom.creator_id,
      name: 'Usuario',
      avatar: null
    } : null

    // Si el usuario está autenticado, verificar membresía
    let isMember = false
    let userRole = null

    if (user) {
      const { data: membership } = await supabase
        .from('fanroom_members')
        .select('role')
        .eq('fanroom_id', fanroom.id)
        .eq('user_id', user.id)
        .single()

      if (membership) {
        isMember = true
        userRole = membership.role
      }
    }

    // Formatear respuesta
    const responseData = {
      success: true,
      fanroom: {
        ...fanroom,
        isMember,
        userRole,
        creator: creatorInfo
      }
    }

    console.log('✅ [FANROOM API] Response prepared')
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ [FANROOM API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

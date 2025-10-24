import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/fanzone/list - Listar FanRooms por país y categoría
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [FANZONE API] Starting request...')
    const supabase = await createSupabaseClient()
    console.log('✅ [FANZONE API] Supabase client created')
    
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'latam'
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'trending'
    const search = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 [FANZONE API] Params:', { country, category, sort, search, limit, offset })

    // Verificar autenticación (opcional para listado público)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 [FANZONE API] User:', user ? 'authenticated' : 'anonymous')

    // Construir query base - 테스트 데이터 제외 (creator_id가 null이 아닌 것만)
    let query = supabase
      .from('fanrooms')
      .select('*')
      .eq('visibility', 'public')
      .not('creator_id', 'is', null)

    console.log('🏗️ [FANZONE API] Base query created')

    // Filtros
    if (country !== 'all') {
      query = query.eq('country', country)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Ordenamiento
    switch (sort) {
      case 'trending':
        query = query.order('is_trending', { ascending: false })
                   .order('trending_score', { ascending: false })
                   .order('created_at', { ascending: false })
        break
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'featured':
        query = query.order('is_featured', { ascending: false })
                   .order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('member_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Paginación
    query = query.range(offset, offset + limit - 1)

    console.log('🚀 [FANZONE API] Executing query...')
    const { data: fanrooms, error } = await query

    if (error) {
      console.error('❌ [FANZONE API] Error fetching fanrooms:', error)
      return NextResponse.json(
        { error: 'Error al obtener FanRooms', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [FANZONE API] Query successful, got', fanrooms?.length || 0, 'fanrooms')

    // Si hay usuario autenticado, verificar membresías
    let memberships: any[] = []
    if (user) {
      const { data: membershipData } = await supabase
        .from('fanroom_members')
        .select('fanroom_id, role')
        .eq('user_id', user.id)
        .in('fanroom_id', fanrooms?.map(f => f.id) || [])

      memberships = membershipData || []
    }

    // Enriquecer datos con información de membresía
    const enrichedFanrooms = fanrooms?.map(fanroom => {
      const membership = memberships.find(m => m.fanroom_id === fanroom.id)
      
      return {
        ...fanroom,
        isMember: !!membership,
        userRole: membership?.role || null,
        // Calcular miembros activos (simulado por ahora)
        activeMembers: Math.floor(fanroom.member_count * 0.1)
      }
    }) || []

    return NextResponse.json({
      success: true,
      fanrooms: enrichedFanrooms,
      pagination: {
        limit,
        offset,
        hasMore: fanrooms?.length === limit
      }
    })

  } catch (error) {
    console.error('Error in list fanrooms:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

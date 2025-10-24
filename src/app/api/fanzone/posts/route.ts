import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/fanzone/posts - Obtener posts de FanRoom
 * POST /api/fanzone/posts - Crear post en FanRoom
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    // Obtener usuario (opcional para posts públicos)
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const fanroomId = searchParams.get('fanroom_id') || searchParams.get('fanroomId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!fanroomId) {
      return NextResponse.json(
        { error: 'ID de FanRoom requerido' },
        { status: 400 }
      )
    }

    // Verificar que el FanRoom es público (opcional)
    const { data: fanroom } = await supabase
      .from('fanrooms')
      .select('visibility')
      .eq('id', fanroomId)
      .single()

    if (!fanroom || fanroom.visibility !== 'public') {
      // Si no es público, verificar membresía
      if (!user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }

      const { data: membership } = await supabase
        .from('fanroom_members')
        .select('id')
        .eq('fanroom_id', fanroomId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: 'Debes ser miembro para ver los posts' },
          { status: 403 }
        )
      }
    }

    // Obtener posts
    const { data: posts, error } = await supabase
      .from('fanroom_posts')
      .select(`
        *,
        author:author_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('fanroom_id', fanroomId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Error al obtener posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      posts: posts || []
    })

  } catch (error) {
    console.error('Error in get posts:', error)
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
    const { fanroomId, content, mediaUrls } = body

    if (!fanroomId || !content) {
      return NextResponse.json(
        { error: 'FanRoom ID y contenido son obligatorios' },
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
        { error: 'Debes ser miembro para crear posts' },
        { status: 403 }
      )
    }

    // Crear post
    const { data: post, error } = await supabase
      .from('fanroom_posts')
      .insert({
        fanroom_id: fanroomId,
        author_id: user.id,
        content,
        media_urls: mediaUrls || []
      })
      .select(`
        *,
        author:author_id (
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json(
        { error: 'Error al crear post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post
    })

  } catch (error) {
    console.error('Error in create post:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

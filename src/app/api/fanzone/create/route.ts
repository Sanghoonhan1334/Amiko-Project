import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/fanzone/create - Crear FanRoom
 */
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/fanzone/create received')
  
  try {
    const cookieStore = await cookies()
    console.log('🍪 Cookie names:', cookieStore.getAll().map(c => c.name))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // Verificar autenticación - leer sesión de request headers
    const authHeader = request.headers.get('authorization')
    let user = null
    
    console.log('🔐 Auth check in create fanroom:')
    console.log('- Auth header:', authHeader ? 'present' : 'missing')
    console.log('- Cookies:', cookieStore.getAll().map(c => c.name))
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Si hay Authorization header, usar el token directamente
      const token = authHeader.replace('Bearer ', '')
      console.log('- Token extracted from header')
      
      // Verificar token con Supabase
      const { data: { user: headerUser }, error: userError } = await supabase.auth.getUser(token)
      user = headerUser
      
      console.log('- User from token:', user?.id || 'null')
      console.log('- User error:', userError)
    } else {
      // Si no, intentar leer de cookies
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
      user = cookieUser
      
      console.log('- User from cookies:', user?.id || 'null')
      console.log('- Cookie error:', cookieError)
    }
    
    console.log('- Final User:', user?.id || 'null')
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado - Debe iniciar sesión' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, category, country, visibility, tags, coverImage } = body

    // Validaciones básicas
    if (!name || !category || !country) {
      return NextResponse.json(
        { error: 'Nombre, categoría y país son obligatorios' },
        { status: 400 }
      )
    }

    // Generar slug único
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    let slug = baseSlug
    let counter = 0
    
    // Verificar unicidad del slug
    while (true) {
      const { data: existingRoom } = await supabase
        .from('fanrooms')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (!existingRoom) break
      
      counter++
      slug = `${baseSlug}-${counter}`
    }

    // Crear FanRoom
    const { data: fanroom, error } = await supabase
      .from('fanrooms')
      .insert({
        name,
        slug,
        description,
        category,
        country,
        creator_id: user.id,
        visibility: visibility || 'public',
        tags: tags || [],
        cover_image: coverImage
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fanroom:', error)
      return NextResponse.json(
        { error: 'Error al crear FanRoom' },
        { status: 500 }
      )
    }

    // Agregar creator como miembro
    await supabase
      .from('fanroom_members')
      .insert({
        fanroom_id: fanroom.id,
        user_id: user.id,
        role: 'creator'
      })

    return NextResponse.json({
      success: true,
      fanroom: {
        ...fanroom,
        isMember: true,
        userRole: 'creator'
      }
    })

  } catch (error) {
    console.error('Error in create fanroom:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

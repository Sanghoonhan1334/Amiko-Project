import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/sessions/[id]/materials
// Devuelve los materiales específicos de una sesión + los generales del curso
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeGeneral = searchParams.get('includeGeneral') !== 'false'

    // Obtener sesión para conocer course_id
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select('id, course_id')
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Materiales de esta sesión
    const { data: sessionMaterials, error: matError } = await supabase
      .from('education_materials')
      .select('*')
      .eq('session_id', id)
      .order('sort_order')

    if (matError) {
      return NextResponse.json({ error: matError.message }, { status: 500 })
    }

    let generalMaterials = null
    if (includeGeneral) {
      // Materiales generales del curso (sin session_id)
      const { data } = await supabase
        .from('education_materials')
        .select('*')
        .eq('course_id', session.course_id)
        .is('session_id', null)
        .order('sort_order')
      generalMaterials = data || []
    }

    return NextResponse.json({
      session_id: id,
      course_id: session.course_id,
      session_materials: sessionMaterials || [],
      general_materials: generalMaterials,
      total: (sessionMaterials?.length || 0) + (generalMaterials?.length || 0)
    })
  } catch (err) {
    console.error('[Education] session materials GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/education/sessions/[id]/materials
// Agrega un material a una sesión específica
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const { title, type, file_url, external_url, description, sort_order } = await request.json()

    if (!title || !type) {
      return NextResponse.json({ error: 'title and type are required' }, { status: 400 })
    }

    // Obtener sesión para validar que existe y obtener course_id
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select('id, course_id, course:education_courses(instructor:instructor_profiles(user_id))')
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const instructorUserId = (session.course as { instructor?: { user_id?: string } } | null)?.instructor?.user_id
    if (instructorUserId !== auth.user.id) {
      return NextResponse.json({ error: 'Only the instructor can add materials to a session' }, { status: 403 })
    }

    const { data: inserted, error: insErr } = await supabase
      .from('education_materials')
      .insert({
        course_id: session.course_id,
        session_id: id,
        title,
        type,
        file_url: file_url || null,
        external_url: external_url || null,
        description: description || null,
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ material: inserted }, { status: 201 })
  } catch (err) {
    console.error('[Education] session materials POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

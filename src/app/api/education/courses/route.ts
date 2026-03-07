import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/courses - List published courses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const language = searchParams.get('language')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const instructorId = searchParams.get('instructorId')
    const offset = (page - 1) * limit

    let query = supabase
      .from('education_courses')
      .select(`
        *,
        instructor:instructor_profiles(*)
      `, { count: 'exact' })

    // Filter by status:
    // - 'all' + instructorId  → return all statuses for that instructor (dashboard)
    // - 'all' alone          → public marketplace: only published/in_progress/completed
    // - any other value      → exact status match
    if (status === 'all') {
      if (!instructorId) {
        query = query.in('status', ['published', 'in_progress', 'completed'])
      }
      // with instructorId: no status filter – instructor sees all their own courses
    } else {
      query = query.eq('status', status)
    }

    if (category) query = query.eq('category', category)
    if (level) query = query.eq('level', level)
    if (language) query = query.eq('teaching_language', language)
    if (instructorId) query = query.eq('instructor_id', instructorId)
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Education] Error fetching courses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      courses: data || [],
      total: count || 0,
      page,
      limit
    })
  } catch (err) {
    console.error('[Education] courses GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/education/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json()
    const {
      title,
      category,
      description,
      objectives,
      level,
      teaching_language,
      total_classes,
      class_duration_minutes,
      price_usd,
      max_students,
      thumbnail_url,
      allow_recording,
      sessions
    } = body

    // Validate required fields
    if (!title || !category || !description || !level || !teaching_language || !total_classes || !price_usd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Look up instructor profile for authenticated user
    const { data: instructor, error: instructorError } = await supabase
      .from('instructor_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json({ error: 'Instructor profile not found. Please create your instructor profile first.' }, { status: 404 })
    }

    const instructor_id = instructor.id

    // Determine start/end dates from sessions
    let start_date = null
    let end_date = null
    if (sessions && sessions.length > 0) {
      const dates = sessions.map((s: { scheduled_at: string }) => new Date(s.scheduled_at))
      start_date = new Date(Math.min(...dates.map((d: Date) => d.getTime()))).toISOString()
      end_date = new Date(Math.max(...dates.map((d: Date) => d.getTime()))).toISOString()
    }

    // Create course
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .insert({
        instructor_id,
        title,
        category,
        description,
        objectives: objectives || null,
        level,
        teaching_language,
        total_classes,
        class_duration_minutes: class_duration_minutes || 60,
        price_usd,
        max_students: max_students || 20,
        thumbnail_url: thumbnail_url || null,
        allow_recording: allow_recording || false,
        status: 'draft',
        start_date,
        end_date
      })
      .select()
      .single()

    if (courseError) {
      console.error('[Education] Error creating course:', courseError)
      return NextResponse.json({ error: courseError.message }, { status: 500 })
    }

    // Create sessions if provided
    if (sessions && sessions.length > 0) {
      const sessionRecords = sessions.map((s: { session_number: number; title: string; description: string; scheduled_at: string }, idx: number) => ({
        course_id: course.id,
        session_number: s.session_number || idx + 1,
        title: s.title || null,
        description: s.description || null,
        scheduled_at: s.scheduled_at,
        duration_minutes: class_duration_minutes || 60,
        agora_channel: `edu_${course.id}_${idx + 1}`
      }))

      const { error: sessionsError } = await supabase
        .from('education_sessions')
        .insert(sessionRecords)

      if (sessionsError) {
        console.error('[Education] Error creating sessions:', sessionsError)
      }
    }

    // Update instructor course count (recount from DB for accuracy)
    const { count: courseCount } = await supabase
      .from('education_courses')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructor_id)

    await supabase
      .from('instructor_profiles')
      .update({ total_courses: courseCount || 0 })
      .eq('id', instructor_id)

    return NextResponse.json({ course }, { status: 201 })
  } catch (err) {
    console.error('[Education] courses POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

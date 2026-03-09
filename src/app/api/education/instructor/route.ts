import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/instructor - Get instructor profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const instructorId = searchParams.get('instructorId')

    if (!userId && !instructorId) {
      return NextResponse.json({ error: 'userId or instructorId required' }, { status: 400 })
    }

    let query = supabase.from('instructor_profiles').select('*')

    if (userId) query = query.eq('user_id', userId)
    if (instructorId) query = query.eq('id', instructorId)

    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json({ instructor: null })
    }

    return NextResponse.json({ instructor: data })
  } catch (err) {
    console.error('[Education] instructor GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/education/instructor - Create/update instructor profile
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    const body = await request.json()
    const { display_name, country, languages, experience, specialty, bio, photo_url } = body

    if (!display_name || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert instructor profile
    const { data: existing } = await supabase
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('instructor_profiles')
        .update({
          display_name,
          country,
          languages: languages || [],
          experience: experience || null,
          specialty: specialty || null,
          bio: bio || null,
          photo_url: photo_url || null
        })
        .eq('user_id', user_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ instructor: data })
    }

    const { data, error } = await supabase
      .from('instructor_profiles')
      .insert({
        user_id,
        display_name,
        country,
        languages: languages || [],
        experience: experience || null,
        specialty: specialty || null,
        bio: bio || null,
        photo_url: photo_url || null
      })
      .select()
      .single()

    if (error) {
      console.error('[Education] Error creating instructor:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instructor: data }, { status: 201 })
  } catch (err) {
    console.error('[Education] instructor POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

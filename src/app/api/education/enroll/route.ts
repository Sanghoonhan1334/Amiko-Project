import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/enroll — DISABLED
// Enrollment must go through the PayPal payment flow:
//   1. POST /api/education/courses/[id]/payments/paypal/create-order
//   2. POST /api/education/courses/[id]/payments/paypal/capture
// Direct enrollment without payment verification is a security vulnerability.
export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct enrollment is disabled. Use the PayPal payment flow to enroll.',
      flow: [
        'POST /api/education/courses/{id}/payments/paypal/create-order',
        'POST /api/education/courses/{id}/payments/paypal/capture'
      ]
    },
    { status: 405 }
  )
}

// GET /api/education/enroll?courseId=xxx - Get student's enrollments (auth required)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    let query = supabase
      .from('education_enrollments')
      .select(`
        *,
        course:education_courses(
          *,
          instructor:instructor_profiles(*)
        )
      `)
      .eq('student_id', userId)

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query.order('enrolled_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enrollments: data || [] })
  } catch (err) {
    console.error('[Education] enroll GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

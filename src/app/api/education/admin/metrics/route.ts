import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/education/admin/metrics
 *
 * Returns granular metrics for the education admin dashboard:
 *   - revenueByMonth     : last 12 months of revenue (array)
 *   - enrollmentsByMonth : last 12 months of enrollment counts (array)
 *   - topInstructors     : top 10 instructors by revenue
 *   - topCourses         : top 10 courses by enrollment
 *   - completionRates    : course completion statistics
 *   - categoryBreakdown  : enrollment count & revenue by category
 *   - avgAttendanceRate  : average session attendance %
 *
 * Query params:
 *   months (int, default 12) – window size in months
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const admin = await isAdminUser(auth.user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const months = Math.min(Math.max(parseInt(searchParams.get('months') || '12'), 1), 36)

    const since = new Date()
    since.setMonth(since.getMonth() - months)
    const sinceISO = since.toISOString()

    // Run all independent queries in parallel
    const [
      enrollmentsResult,
      coursesResult,
      attendanceResult
    ] = await Promise.all([
      // All completed enrollments in window
      supabase
        .from('education_enrollments')
        .select('enrolled_at, amount_paid, course_id, enrollment_status, course:education_courses(category, instructor_id, title, instructor:instructor_profiles(display_name, user_id))')
        .eq('payment_status', 'completed')
        .gte('enrolled_at', sinceISO)
        .order('enrolled_at'),

      // All published/completed courses for category breakdown
      supabase
        .from('education_courses')
        .select('id, title, category, enrolled_count, instructor_id, instructor:instructor_profiles(display_name, user_id)'),

      // Attendance records in window
      supabase
        .from('education_attendance')
        .select('status, session_id')
        .gte('created_at', sinceISO)
    ])

    const enrollments = enrollmentsResult.data || []
    const courses = coursesResult.data || []
    const attendanceRecords = attendanceResult.data || []

    // ── Revenue & enrollment by month ─────────────────────────────────────
    const monthMap = new Map<string, { revenue: number; count: number }>()

    for (const e of enrollments) {
      if (!e.enrolled_at) continue
      const key = e.enrolled_at.slice(0, 7) // "YYYY-MM"
      const entry = monthMap.get(key) || { revenue: 0, count: 0 }
      entry.revenue += parseFloat(String(e.amount_paid)) || 0
      entry.count += 1
      monthMap.set(key, entry)
    }

    // Fill missing months with zeroes
    const revenueByMonth: Array<{ month: string; revenue: number; enrollments: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = monthMap.get(key) || { revenue: 0, count: 0 }
      revenueByMonth.push({ month: key, revenue: Math.round(entry.revenue * 100) / 100, enrollments: entry.count })
    }

    // ── Top instructors ────────────────────────────────────────────────────
    type InstructorEntry = { display_name: string; user_id: string; revenue: number; enrollments: number; courses: Set<string> }
    const instructorMap = new Map<string, InstructorEntry>()

    for (const e of enrollments) {
      const course = e.course as { instructor_id?: string; instructor?: { display_name?: string; user_id?: string } } | null
      if (!course?.instructor_id) continue
      const key = course.instructor_id
      const entry = instructorMap.get(key) || {
        display_name: course.instructor?.display_name || 'Unknown',
        user_id: course.instructor?.user_id || '',
        revenue: 0,
        enrollments: 0,
        courses: new Set<string>()
      }
      entry.revenue += parseFloat(String(e.amount_paid)) || 0
      entry.enrollments += 1
      if (e.course_id) entry.courses.add(e.course_id)
      instructorMap.set(key, entry)
    }

    const topInstructors = [...instructorMap.entries()]
      .map(([id, v]) => ({ instructor_profile_id: id, display_name: v.display_name, user_id: v.user_id, revenue: Math.round(v.revenue * 100) / 100, enrollments: v.enrollments, active_courses: v.courses.size }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ── Top courses ────────────────────────────────────────────────────────
    const courseEnrollMap = new Map<string, { title: string; category: string; count: number; revenue: number }>()

    for (const e of enrollments) {
      if (!e.course_id) continue
      const course = e.course as { title?: string; category?: string } | null
      const entry = courseEnrollMap.get(e.course_id) || { title: course?.title || '', category: course?.category || '', count: 0, revenue: 0 }
      entry.count += 1
      entry.revenue += parseFloat(String(e.amount_paid)) || 0
      courseEnrollMap.set(e.course_id, entry)
    }

    const topCourses = [...courseEnrollMap.entries()]
      .map(([id, v]) => ({ course_id: id, title: v.title, category: v.category, enrollments: v.count, revenue: Math.round(v.revenue * 100) / 100 }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10)

    // ── Category breakdown ─────────────────────────────────────────────────
    const categoryMap = new Map<string, { enrollments: number; revenue: number; courses: number }>()

    // Count active courses by category
    for (const c of courses) {
      const cat = (c.category as string) || 'uncategorized'
      const entry = categoryMap.get(cat) || { enrollments: 0, revenue: 0, courses: 0 }
      entry.courses += 1
      categoryMap.set(cat, entry)
    }
    // Add enrollment + revenue from enrollments data
    for (const e of enrollments) {
      const cat = ((e.course as { category?: string } | null)?.category) || 'uncategorized'
      const entry = categoryMap.get(cat) || { enrollments: 0, revenue: 0, courses: 0 }
      entry.enrollments += 1
      entry.revenue += parseFloat(String(e.amount_paid)) || 0
      categoryMap.set(cat, entry)
    }

    const categoryBreakdown = [...categoryMap.entries()]
      .map(([category, v]) => ({ category, courses: v.courses, enrollments: v.enrollments, revenue: Math.round(v.revenue * 100) / 100 }))
      .sort((a, b) => b.enrollments - a.enrollments)

    // ── Completion rates ───────────────────────────────────────────────────
    const totalEnrolled = enrollments.length
    const totalCompleted = enrollments.filter(e => e.enrollment_status === 'completed').length
    const completionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0

    // ── Average attendance rate ────────────────────────────────────────────
    const totalAttendance = attendanceRecords.length
    const attended = attendanceRecords.filter(a => ['joined', 'attended', 'completed'].includes(a.status)).length
    const avgAttendanceRate = totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : 0

    return NextResponse.json({
      window_months: months,
      revenueByMonth,
      topInstructors,
      topCourses,
      categoryBreakdown,
      completionRates: {
        totalEnrolled,
        totalCompleted,
        completionRate
      },
      avgAttendanceRate
    })
  } catch (err) {
    console.error('[Education] admin metrics error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

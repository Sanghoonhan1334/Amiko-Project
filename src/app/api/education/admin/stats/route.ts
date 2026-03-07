import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/admin/stats - Admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const [
      { count: totalCourses },
      { count: activeCourses },
      { count: pendingApprovals },
      { count: totalStudents },
      { count: totalInstructors }
    ] = await Promise.all([
      supabase.from('education_courses').select('*', { count: 'exact', head: true }),
      supabase.from('education_courses').select('*', { count: 'exact', head: true })
        .in('status', ['published', 'in_progress']),
      supabase.from('education_courses').select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      supabase.from('education_enrollments').select('*', { count: 'exact', head: true })
        .eq('payment_status', 'completed'),
      supabase.from('instructor_profiles').select('*', { count: 'exact', head: true })
    ])

    // Calculate total revenue
    const { data: revenueData } = await supabase
      .from('education_enrollments')
      .select('amount_paid')
      .eq('payment_status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, e) => sum + (parseFloat(String(e.amount_paid)) || 0), 0) || 0

    // Pending courses for review
    const { data: pendingCourses } = await supabase
      .from('education_courses')
      .select(`
        *,
        instructor:instructor_profiles(display_name, photo_url)
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      stats: {
        totalCourses: totalCourses || 0,
        activeCourses: activeCourses || 0,
        totalStudents: totalStudents || 0,
        totalInstructors: totalInstructors || 0,
        totalRevenue,
        pendingApprovals: pendingApprovals || 0
      },
      pendingCourses: pendingCourses || []
    })
  } catch (err) {
    console.error('[Education] admin stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

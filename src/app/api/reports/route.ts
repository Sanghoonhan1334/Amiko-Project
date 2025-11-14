import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

function extractToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  const [, token] = authHeader.split(' ')
  return token || null
}

async function getAuthUser(token: string) {
  const { data, error } = await supabaseServer!.auth.getUser(token)
  if (error || !data?.user) {
    return null
  }
  return data.user
}

async function isAdmin(userId: string) {
  const { data } = await supabaseServer!
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return Boolean(data?.is_admin)
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = await getAuthUser(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reportedUserId,
      contextType,
      contextId,
      reason,
      details
    }: {
      reportedUserId?: string
      contextType?: string
      contextId?: string
      reason?: string
      details?: string
    } = body || {}

    if (!reportedUserId || !reason) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    if (reportedUserId === authUser.id) {
      return NextResponse.json({ error: '본인을 신고할 수 없습니다.' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('user_reports')
      .insert({
        reporter_id: authUser.id,
        reported_user_id: reportedUserId,
        context_type: contextType,
        context_id: contextId,
        reason,
        details,
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          request.ip ||
          'unknown',
        user_agent: request.headers.get('user-agent')
      })

    if (error) {
      console.error('[REPORT_POST] insert error:', error)
      return NextResponse.json({ error: '신고 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '신고가 접수되었습니다.' })
  } catch (error) {
    console.error('[REPORT_POST] server error:', error)
    return NextResponse.json({ error: '신고 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = await getAuthUser(token)
    if (!authUser || !(await isAdmin(authUser.id))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const { data: reports, error } = await supabaseServer
      .from('user_reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[REPORT_GET] select error:', error)
      return NextResponse.json({ error: '신고 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    const reporterIds = Array.from(
      new Set((reports || []).map((r) => r.reporter_id).filter(Boolean))
    )
    const reportedIds = Array.from(
      new Set((reports || []).map((r) => r.reported_user_id).filter(Boolean))
    )

    const allUserIds = Array.from(new Set([...reporterIds, ...reportedIds]))

    let userInfoMap: Record<string, any> = {}
    if (allUserIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('id, full_name, nickname, email, profile_image, avatar_url')
        .in('id', allUserIds)

      const { data: profiles } = await supabaseServer
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', allUserIds)

      const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]))

      userInfoMap = (users || []).reduce<Record<string, any>>((acc, user) => {
        const profile = profileMap.get(user.id)
        acc[user.id] = {
          id: user.id,
          name:
            profile?.display_name ||
            user.nickname ||
            user.full_name ||
            user.email?.split('@')[0] ||
            'Usuario',
          avatar: profile?.avatar_url || user.profile_image || user.avatar_url || null,
          email: user.email
        }
        return acc
      }, {})
    }

    const enrichedReports = (reports || []).map((report) => ({
      ...report,
      reporter: report.reporter_id ? userInfoMap[report.reporter_id] : null,
      reportedUser: report.reported_user_id ? userInfoMap[report.reported_user_id] : null
    }))

    return NextResponse.json({ success: true, reports: enrichedReports })
  } catch (error) {
    console.error('[REPORT_GET] server error:', error)
    return NextResponse.json({ error: '신고 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = await getAuthUser(token)
    if (!authUser || !(await isAdmin(authUser.id))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, status, resolutionNotes } = body || {}

    if (!reportId || !status) {
      return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 })
    }

    const allowedStatus = ['pending', 'reviewing', 'resolved', 'dismissed']
    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: '잘못된 상태 값입니다.' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('user_reports')
      .update({
        status,
        resolution_notes: resolutionNotes,
        reviewed_by: authUser.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      console.error('[REPORT_PATCH] update error:', error)
      return NextResponse.json({ error: '신고 상태 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[REPORT_PATCH] server error:', error)
    return NextResponse.json({ error: '신고 상태 업데이트에 실패했습니다.' }, { status: 500 })
  }
}


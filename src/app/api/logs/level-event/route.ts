import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    // 세션 검증 — userId는 항상 토큰에서 추출 (IDOR 방지)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    const authenticatedUserId = session.user.id;

    const body = await request.json();
    const {
      eventType,
      oldLevel,
      newLevel,
      oldPoints,
      newPoints,
      sourcePage,
      extra
    } = body || {};
    if (!eventType) {
      return NextResponse.json({ error: 'eventType 필수' }, { status: 400 });
    }
    const { error } = await supabase
      .from('level_event_log')
      .insert({
        user_id: authenticatedUserId,
        event_type: eventType,
        old_level: oldLevel,
        new_level: newLevel,
        old_points: oldPoints,
        new_points: newPoints,
        source_page: sourcePage,
        extra: extra ? JSON.stringify(extra) : null
      });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

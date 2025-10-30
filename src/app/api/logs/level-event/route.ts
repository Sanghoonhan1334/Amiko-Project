import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      eventType,
      oldLevel,
      newLevel,
      oldPoints,
      newPoints,
      sourcePage,
      extra
    } = body || {};
    if (!(userId && eventType)) {
      return NextResponse.json({ error: 'userId, eventType 필수' }, { status: 400 });
    }
    const supabase = createClient();
    const { error } = await supabase
      .from('level_event_log')
      .insert({
        user_id: userId,
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

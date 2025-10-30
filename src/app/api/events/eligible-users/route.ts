import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 이벤트/추첨 대상자 조회: Lv1(75점+), VIP, 또는 Rose(3500+점) 필터 분기
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const roseOnly = searchParams.get('roseOnly') === 'true';

    if (roseOnly) {
      // 장미(3500+)만 필터
      const { data, error } = await supabase
        .from('user_points')
        .select(`user_id, total_points, users(is_vip, full_name, nickname, avatar_url)`)
        .gte('total_points', 3500);
      if (error) throw error;
      return NextResponse.json({
        eligibleUsers: (data || []).map(row => ({
          userId: row.user_id,
          totalPoints: row.total_points,
          isVip: row.users?.is_vip,
          name: row.users?.full_name || row.users?.nickname,
          avatar: row.users?.avatar_url,
        }))
      });
    } else {
      // Lv1(75점+) 또는 VIP
      const { data, error } = await supabase
        .from('user_points')
        .select(`user_id, total_points, users(is_vip, full_name, nickname, avatar_url)`)
        .or('total_points.gte.75,users.is_vip.eq.true');
      if (error) throw error;
      return NextResponse.json({
        eligibleUsers: (data || []).map(row => ({
          userId: row.user_id,
          totalPoints: row.total_points,
          isVip: row.users?.is_vip,
          name: row.users?.full_name || row.users?.nickname,
          avatar: row.users?.avatar_url,
        }))
      });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

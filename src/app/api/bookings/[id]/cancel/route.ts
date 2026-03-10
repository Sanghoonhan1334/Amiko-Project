import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 세션 검증 — 인증 없이 누구나 예약 취소 가능 (IDOR 방지)
    const authSupabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const authenticatedUserId = session.user.id

    const { cancelReason } = await req.json();
    
    console.log('🔍 [BOOKING CANCEL] 예약 취소 요청:', { id, cancelReason });

    if (!id) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 1. 예약 정보 조회
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      console.error('❌ 예약 조회 실패:', fetchError);
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Ownership check — only the booking owner can cancel
    if (booking.user_id !== authenticatedUserId) {
      return NextResponse.json({ error: '예약을 취소할 권한이 없습니다.' }, { status: 403 })
    }

    console.log('✅ 예약 조회 성공:', booking);

    // 2. 예약 상태를 'cancelled'로 변경
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled'
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ 예약 취소 처리 실패:', updateError);
      return NextResponse.json(
        { error: '예약 취소 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 예약 취소 성공:', updatedBooking.id);

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 취소되었습니다.',
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status
      }
    });

  } catch (error) {
    console.error('❌ 예약 취소 처리 중 예외:', error);
    
    return NextResponse.json(
      { 
        error: '예약 취소 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

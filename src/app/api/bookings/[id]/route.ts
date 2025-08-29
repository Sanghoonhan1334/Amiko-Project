import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    console.log('🔍 [BOOKING API] 예약 조회 요청:', id);

    if (!id) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 먼저 기본 예약 정보만 조회
    const { data: booking, error: basicError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (basicError) {
      console.error('❌ 기본 예약 조회 실패:', basicError);
      
      if (basicError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '예약을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: '예약 조회 중 오류가 발생했습니다.', details: basicError.message },
        { status: 500 }
      );
    }

    console.log('✅ 기본 예약 조회 성공:', booking.id);

    // 2. 사용자 정보 조회 (별도 쿼리)
    let userInfo = null;
    if (booking.user_id) {
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, name, phone')
          .eq('id', booking.user_id)
          .single();
        
        if (!userError) {
          userInfo = user;
        }
      } catch (userErr) {
        console.warn('⚠️ 사용자 정보 조회 실패:', userErr);
      }
    }

    // 3. 상담사 정보 조회 (별도 쿼리)
    let consultantInfo = null;
    if (booking.consultant_id) {
      try {
        const { data: consultant, error: consultantError } = await supabase
          .from('consultants')
          .select('id, name, specialty, email, phone, bio')
          .eq('id', booking.consultant_id)
          .single();
        
        if (!consultantError) {
          consultantInfo = consultant;
        }
      } catch (consultantErr) {
        console.warn('⚠️ 상담사 정보 조회 실패:', consultantErr);
      }
    }

    // 4. 통합된 응답 데이터 구성
    const responseData = {
      ...booking,
      users: userInfo,
      consultants: consultantInfo
    };

    console.log('✅ 예약 조회 완료:', {
      bookingId: booking.id,
      hasUser: !!userInfo,
      hasConsultant: !!consultantInfo
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ 예약 조회 중 예외:', error);
    
    return NextResponse.json(
      { 
        error: '예약 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updateData = await req.json();
    
    console.log('🔍 [BOOKING API] 예약 수정 요청:', { id, updateData });

    if (!id) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 업데이트 가능한 필드들만 허용
    const allowedFields = [
      'status', 'start_at', 'end_at', 'duration', 'notes',
      'payment_key', 'payment_amount', 'payment_approved_at',
      'cancelled_at', 'cancel_reason'
    ];

    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    // 예약 정보 업데이트
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        ...filteredData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ 예약 수정 실패:', error);
      return NextResponse.json(
        { error: '예약 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 예약 수정 성공:', updatedBooking.id);

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 수정되었습니다.',
      data: updatedBooking
    });

  } catch (error) {
    console.error('❌ 예약 수정 중 예외:', error);
    
    return NextResponse.json(
      { 
        error: '예약 수정 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    console.log('🔍 [BOOKING API] 예약 삭제 요청:', id);

    if (!id) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 예약 삭제 (실제로는 soft delete 권장)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ 예약 삭제 실패:', error);
      return NextResponse.json(
        { error: '예약 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 예약 삭제 성공:', id);

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 예약 삭제 중 예외:', error);
    
    return NextResponse.json(
      { 
        error: '예약 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

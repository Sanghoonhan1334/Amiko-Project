import { NextResponse } from 'next/server';

// CORS 프리: 내부 API이므로 CORS 설정 불필요
export async function GET(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  try {

    // TODO: 실제 데이터베이스에서 서비스 정보 조회
    const serviceInfo = {
      culture: {
        id: 'culture',
        name: '문화 교류',
        price: 50000,
        description: '한국인 멘토와 함께하는 진정한 한국 문화 체험',
        duration: '60분',
        availableTimes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
      },
      pronunciation: {
        id: 'pronunciation',
        name: '발음 교정',
        price: 45000,
        description: '전문적인 한국어 발음 교정 및 회화 연습',
        duration: '45분',
        availableTimes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
      }
    };

    const service = serviceInfo[serviceId as keyof typeof serviceInfo];

    if (!service) {
      return NextResponse.json(
        { success: false, message: '서비스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: service,
      message: '서비스 정보 조회 성공'
    });
    
  } catch (error) {
    console.error('서비스 정보 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '서비스 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

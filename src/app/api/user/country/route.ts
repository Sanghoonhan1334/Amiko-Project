import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // IP 주소에서 국가 확인
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    
    // 개발 환경에서는 기본값 반환
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ country: 'US' });
    }
    
    // IP Geolocation API 사용 (예: ipapi.co)
    const response = await fetch(`https://ipapi.co/${ip}/country/`);
    const country = await response.text();
    
    return NextResponse.json({ 
      country: country.trim() || 'US',
      ip: ip
    });
    
  } catch (error) {
    console.error('국가 확인 실패:', error);
    return NextResponse.json({ 
      country: 'US' // 기본값
    });
  }
}

# 영상통화 연결 문제 진단 리포트

## 📋 현재 상황

### 증상
- 한국인 파트너가 "지금 참여하기" 버튼 클릭
- `/call/[meetingId]` 페이지 로딩
- **404 에러 발생** - 예약 정보를 찾을 수 없음

### 에러 로그 분석

```
[BOOKINGS ID API] 조회할 ID: 21b58f08-1935-4a24-ac21-bc33d5800976
[BOOKINGS ID API] 조회 결과: {
  booking: null,
  bookingError: {
    code: 'PGRST116',
    details: 'The result contains 0 rows',
    message: 'Cannot coerce the result to a single JSON object'
  }
}
GET /api/bookings/21b58f08-1935-4a24-ac21-bc33d5800976 404
```

### 확인된 사실

1. **my-bookings API에서는 예약이 존재:**
   ```
   [my-bookings] 예약 데이터 (KST): {
     booking_id: '21b58f08-1935-4a24-ac21-bc33d5800976',
     date: '2025-10-31',
     start_time: '10:10:00',
     end_time: '10:30:00',
     status: 'approved'
   }
   ```

2. **bookings/[id] API에서는 404:**
   - 같은 ID로 조회해도 찾을 수 없음
   - 둘 다 `booking_requests` 테이블을 조회

## 🔍 가능한 원인

### 1. RLS (Row Level Security) 정책 문제
- `my-bookings`: `partner_id = user.id` 조건으로 조회 → 성공
- `bookings/[id]`: `id = bookingId` 조건으로 조회 → 실패
- **가능성:** RLS 정책이 `partner_id` 필터가 있을 때만 허용하고, `id`만으로는 거부

### 2. 서로 다른 Supabase 클라이언트 사용
- `my-bookings`: `createSupabaseClient()` (서버 컴포넌트용, 쿠키 기반)
- `bookings/[id]`: `createClient(ANON_KEY)` (익명 클라이언트)
- **가능성:** 익명 클라이언트는 RLS 정책에 의해 접근 차단

### 3. 캐싱 또는 세션 문제
- API 간 인증 컨텍스트가 다름

## 🛠️ 해결 방안

### 방안 1: bookings/[id]에서도 인증된 클라이언트 사용
```typescript
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(request, { params }) {
  const supabase = await createSupabaseClient() // 쿠키 기반 인증 클라이언트
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }
  
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', bookingId)
    .single()
}
```

### 방안 2: Service Role Key 사용
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // RLS 우회
)
```

### 방안 3: RLS 정책 수정
DB의 `booking_requests` 테이블 RLS 정책을 수정하여 ID로도 조회 가능하게

## 📊 다음 단계

1. SQL로 DB 직접 확인 (`database/debug-booking-21b58f08.sql`)
2. `bookings/[id]` API를 인증된 클라이언트로 수정
3. 테스트 후 Google Meet 링크 확인
4. 실제 영상통화 연결 테스트

## 💡 추가 발견

- `meet_url`이 예약 승인 시 자동 생성되는지 확인 필요
- 승인된 예약에 `meet_url`이 있는지 DB 확인 필요


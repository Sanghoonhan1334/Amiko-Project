# Google Meet 연결 시나리오

## 현재 상태 (MVP)

### 현재 플로우
```
1. 현지인 사용자 → 예약 요청
   └─ meet_url 필드 (선택사항, 수동 입력)
   
2. 한국인 파트너 → 예약 승인/거절
   └─ meet_url이 있으면 그대로 사용
   └─ meet_url이 없으면 나중에 추가 필요
   
3. 예약 시간 도래 → /call/[meetingId] 페이지 접속
   └─ meet_url이 있으면 "Google Meet 참여하기" 버튼 활성화
   └─ 새 탭에서 Google Meet 링크 열기
   └─ 20분 타이머 시작
   
4. 상담 종료 → /feedback/[meetingId] 페이지로 이동
```

### 현재 문제점
- ❌ Google Meet 링크를 수동으로 만들어야 함
- ❌ 예약 승인 시점에 meet_url이 없을 수 있음
- ❌ 파트너가 meet_url을 직접 입력해야 하는 불편함

---

## 개선 시나리오 1: 반자동 방식 (추천, 구현 쉬움)

### 플로우
```
1. 현지인 사용자 → 예약 요청
   └─ meet_url 없이 요청 (현재와 동일)
   
2. 한국인 파트너 → 예약 승인
   └─ 승인 시점에 "Google Meet 링크 생성" 버튼 표시
   └─ 버튼 클릭 → 새 Google Meet 링크 자동 생성
   └─ 생성된 링크가 예약에 자동 저장
   └─ 또는 파트너가 직접 링크 입력 가능 (기존 방식 유지)
   
3. 알림 전송
   └─ 사용자에게 "예약이 승인되었습니다" + Google Meet 링크 포함
   
4. 예약 시간 도래 → /call/[meetingId] 페이지
   └─ meet_url 있으면 "참여하기" 버튼 활성화
   └─ 예약 시간 5분 전부터 참여 가능
```

### 구현 방법
- **Google Meet 링크 생성 공식**: `https://meet.google.com/${randomCode}`
  - `randomCode`는 예약 ID 기반 또는 랜덤 문자열 생성
- **또는 Google Calendar API 사용** (더 정식이지만 OAuth 필요)

### 장점
- ✅ 구현이 간단함
- ✅ 파트너가 링크 생성 시점을 제어 가능
- ✅ 수동 입력 옵션도 유지 가능

### 단점
- ⚠️ 링크 생성에 파트너의 추가 액션이 필요
- ⚠️ 승인 후 링크를 생성하지 않으면 나중에 추가해야 함

---

## 개선 시나리오 2: 완전 자동 방식 (추천, 사용자 경험 최적)

### 플로우
```
1. 현지인 사용자 → 예약 요청
   └─ meet_url 없이 요청
   
2. 한국인 파트너 → 예약 승인
   └─ 승인 시점에 **자동으로** Google Meet 링크 생성
   └─ 생성된 링크가 예약에 저장
   └─ 파트너는 승인만 하면 됨
   
3. 알림 전송 (자동)
   └─ 사용자: "예약이 승인되었습니다. Google Meet 링크: [링크]"
   └─ 파트너: "예약이 승인되었습니다. 링크가 생성되었습니다."
   
4. 예약 시간 도래 → /call/[meetingId] 페이지
   └─ 예약 시간 5분 전부터 참여 가능
   └─ "Google Meet 참여하기" 버튼 활성화
   └─ 타이머 표시 (남은 시간)
   
5. 상담 종료
   └─ 타이머 종료 또는 수동 종료
   └─ 자동으로 /feedback/[meetingId]로 이동
```

### 구현 방법
```typescript
// 예약 승인 시 자동 링크 생성
const generateMeetLink = (bookingId: string) => {
  // 방법 1: 예약 ID 기반 고유 코드
  const code = bookingId.substring(0, 8).replace(/-/g, '')
  return `https://meet.google.com/${code}-${Math.random().toString(36).substring(2, 6)}`
  
  // 방법 2: 랜덤 코드 (더 안전)
  const randomCode = Array.from({ length: 3 }, () => 
    Math.random().toString(36).substring(2, 6)
  ).join('-')
  return `https://meet.google.com/${randomCode}`
}
```

### 장점
- ✅ 파트너의 추가 액션 불필요
- ✅ 승인 시점에 바로 링크 생성되어 사용자 경험 최적화
- ✅ 자동화되어 실수 방지

### 단점
- ⚠️ Google Meet 링크 유효성 보장 불가 (실제 API 없이 생성 시)

---

## 개선 시나리오 3: Google Calendar API 활용 (가장 정식, 복잡함)

### 플로우
```
1. 현지인 사용자 → 예약 요청
   
2. 한국인 파트너 → 예약 승인
   └─ Google Calendar API 호출
   └─ 캘린더에 이벤트 생성 + Google Meet 회의 추가
   └─ 실제 Google Meet 링크 생성 및 저장
   └─ 사용자와 파트너 모두 캘린더 초대장 수신
   
3. 예약 시간 도래
   └─ 캘린더에서 자동 알림
   └─ 앱에서 "참여하기" 버튼 활성화
```

### 구현 방법
- Google Calendar API 사용
- OAuth 2.0 인증 필요
- 파트너의 Google 계정 연동 필요

### 장점
- ✅ 실제 Google Meet 링크 생성 보장
- ✅ 캘린더 연동으로 일정 관리 자동화
- ✅ 알림 및 리마인더 자동화

### 단점
- ❌ 구현 복잡도 높음
- ❌ OAuth 인증 플로우 필요
- ❌ 파트너의 Google 계정 연동 필요
- ❌ 초기 설정 시간 필요

---

## 추천 시나리오

### 단기 (즉시 구현 가능)
**시나리오 2: 완전 자동 방식** 추천
- 승인 시 자동으로 링크 생성
- 구현 간단하고 사용자 경험 좋음
- Google Meet 링크는 유니크한 랜덤 코드로 생성 가능

### 중장기 (향후 개선)
**시나리오 3: Google Calendar API 활용**
- 실제 Google Meet 서비스와 연동
- 캘린더 연동으로 더 완전한 솔루션
- 사용자와 파트너 모두에게 알림 자동화

---

## 구현 필요 사항

### 1. 예약 승인 API 수정 (`/api/bookings/[id]/approve`)
```typescript
// 승인 시 자동으로 meet_url 생성
const meetUrl = `https://meet.google.com/${generateRandomCode()}`

await supabase
  .from('booking_requests')
  .update({
    status: 'approved',
    meet_url: meetUrl,
    approved_at: new Date().toISOString()
  })
```

### 2. 알림 메시지 개선
- 사용자 알림에 Google Meet 링크 포함
- 예약 상세 페이지에 링크 표시

### 3. 링크 유효성 체크
- 예약 시간 도래 전/후 링크 접근 가능 여부 확인
- 링크가 없을 경우 대체 처리

---

## Google Meet 링크 생성 로직

### 방법 1: 간단한 랜덤 생성 (추천)
```typescript
function generateMeetLink(bookingId: string): string {
  // 예약 ID + 타임스탬프 기반 고유 코드
  const timestamp = Date.now().toString(36)
  const bookingCode = bookingId.substring(0, 8).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6)
  
  // Google Meet 링크 형식: https://meet.google.com/xxx-xxxx-xxx
  return `https://meet.google.com/${bookingCode}-${random}-${timestamp.slice(-4)}`
}
```

### 방법 2: 예약 정보 기반 (더 예측 가능)
```typescript
function generateMeetLink(bookingId: string, date: string): string {
  // 날짜 + 예약 ID 기반
  const dateCode = date.replace(/-/g, '').slice(-6) // YYYYMMDD → MMDD
  const bookingCode = bookingId.substring(0, 4).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6)
  
  return `https://meet.google.com/${dateCode}-${bookingCode}-${random}`
}
```

---

## 사용자 경험 플로우 다이어그램

```
[현지인 사용자]
    ↓
예약 요청 (날짜/시간 선택)
    ↓
[한국인 파트너]
    ↓
알림: "새로운 예약 요청이 있습니다"
    ↓
예약 관리 페이지에서 승인/거절 선택
    ↓
[승인 선택]
    ↓
자동으로 Google Meet 링크 생성 ✨
    ↓
예약 상태: 'approved' + meet_url 저장
    ↓
[알림 전송]
├─ 사용자: "예약이 승인되었습니다! 링크: [링크]"
└─ 파트너: "예약이 승인되었습니다."
    ↓
[예약 시간 도래 - 5분 전부터]
    ↓
사용자/파트너 모두 /call/[meetingId] 접속
    ↓
"Google Meet 참여하기" 버튼 활성화
    ↓
새 탭에서 Google Meet 열림
    ↓
[상담 진행] (20분 타이머)
    ↓
[상담 종료]
    ↓
자동으로 /feedback/[meetingId] 페이지로 이동
    ↓
후기 작성 및 평가
```

---

## 기술적 고려사항

### 1. Google Meet 링크 형식
- 기본 형식: `https://meet.google.com/xxx-xxxx-xxx`
- 각 섹션: 3자-4자-3자 (총 10-11자)
- 대소문자, 숫자, 하이픈 포함 가능

### 2. 링크 유니크성 보장
- 예약 ID 기반으로 생성하면 충돌 가능성 낮음
- 타임스탬프 추가로 더욱 안전

### 3. 저장 시점
- 예약 승인 시점에 저장 (권장)
- 또는 예약 요청 시점에 미리 생성 가능

### 4. 링크 변경
- 파트너가 원할 경우 링크 재생성 가능
- 이전 링크는 무효화 처리 (선택사항)

---

## 결론

**즉시 구현 추천**: 시나리오 2 (완전 자동 방식)
- 구현 간단
- 사용자 경험 우수
- 파트너의 추가 액션 불필요

**향후 개선**: 시나리오 3 (Google Calendar API)
- 더 정식이고 안정적인 방식
- 캘린더 연동으로 전체적인 경험 향상


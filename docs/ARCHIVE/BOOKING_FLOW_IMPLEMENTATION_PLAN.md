# 예약 생성부터 실행까지 전체 플로우 구현 계획

## 📋 현재 상태 분석

### 현재 문제점
1. 예약 생성 페이지(`/booking/create`)가 제대로 동작하지 않음
2. Google Meet 링크를 수동 입력해야 함 (자동 생성이 아님)
3. 날짜/시간 선택이 동적이지 않음 (파트너의 실제 스케줄 반영 안 됨)
4. 파트너 자동 선택이 되지 않음

---

## 🎯 전체 플로우 개요

```
[현지인 사용자]
    ↓
1. 대화 상대 목록에서 "Chat" 버튼 클릭
    ↓
2. 예약 생성 페이지로 이동 (partnerId 포함)
    ↓
3. 파트너 정보 자동 로드 + 예약 가능 시간 조회
    ↓
4. 날짜/시간 선택 (파트너 스케줄 기반)
    ↓
5. 예약 요청 생성 (meet_url 없이)
    ↓
[한국인 파트너]
    ↓
6. 예약 요청 알림 수신
    ↓
7. "승인" 버튼 클릭
    ↓
8. Google Meet 링크 자동 생성 + 저장
    ↓
9. 사용자에게 승인 알림 전송 (링크 포함)
    ↓
[현지인 사용자]
    ↓
10. 예약 승인 알림 수신
    ↓
11. 예약 상세 페이지에서 "Google Meet 참여하기" 버튼 활성화
    ↓
12. 예약 시간 도래 (5분 전부터 참여 가능)
    ↓
13. Google Meet 링크 클릭 → 새 탭에서 통화 시작
    ↓
14. 20분 타이머 시작
    ↓
15. 통화 종료 후 피드백 작성
```

---

## 🔧 구현 단계별 계획

### **Phase 1: 예약 생성 페이지 개선** ⭐ 우선순위 높음

#### 1.1 파트너 정보 자동 로드
**파일**: `src/app/booking/create/page.tsx`

```typescript
// URL 쿼리에서 partnerId 추출
const searchParams = useSearchParams()
const partnerId = searchParams.get('partnerId')

// 파트너 정보 자동 로드
useEffect(() => {
  if (partnerId) {
    fetchPartnerInfo(partnerId)
    fetchAvailableSlots(partnerId)
  }
}, [partnerId])
```

**구현 사항**:
- URL 쿼리 파라미터에서 `partnerId` 추출
- `/api/conversation-partners/[id]`로 파트너 정보 로드
- 파트너 이름, 프로필 이미지, 전문 분야 등 표시
- "한국인 친구 선택" 드롭다운에 미리 선택되어 표시

#### 1.2 예약 가능 시간 동적 로드
**API**: `/api/partners/[id]/available-slots` (이미 구현됨 ✅)

**구현 사항**:
- 날짜 선택 시 해당 파트너의 예약 가능한 시간 슬롯 조회
- 사용자 현지 시간대로 변환하여 표시
- 30분 이상 남은 슬롯만 필터링
- 정기 스케줄과 일회성 스케줄 모두 포함

**UI 개선**:
```typescript
// 날짜 선택 시 시간 슬롯 동적 로드
const handleDateSelect = async (date: string) => {
  if (!selectedPartner || !date) return
  
  setLoadingSlots(true)
  const slots = await fetchAvailableSlots(selectedPartner.id, date)
  setAvailableTimeSlots(slots)
  setLoadingSlots(false)
}
```

#### 1.3 Google Meet 링크 필드 제거
**현재**: 수동 입력 필드 있음
**변경**: 완전히 제거하고 안내 문구로 대체

```typescript
// 제거할 코드
<Input 
  id="meetUrl"
  value={formData.meetUrl}
  // ...
/>

// 추가할 안내 문구
<div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
  ℹ️ 예약이 승인되면 Google Meet 링크가 자동으로 생성되어 알림으로 전달됩니다.
</div>
```

#### 1.4 날짜 선택 UI 개선
**현재**: 텍스트 입력 필드
**변경**: 달력 컴포넌트 + 예약 가능 날짜만 활성화

**구현**:
- `react-day-picker` 또는 커스텀 달력 컴포넌트 사용
- 파트너의 `available_schedules` 기준으로 예약 가능한 날짜만 선택 가능
- 오늘 날짜 + 최소 30분 이후 슬롯만 활성화

---

### **Phase 2: 예약 요청 API 개선** ⭐ 이미 구현됨 (확인 필요)

#### 2.1 예약 요청 생성
**API**: `/api/bookings/request` (이미 구현됨 ✅)

**확인 사항**:
- ✅ 사용자 시간대를 KST로 변환하여 저장
- ✅ `meet_url` 필드 없이 저장 (승인 시 자동 생성)
- ✅ `available_schedules` 상태를 'pending'으로 업데이트
- ✅ 파트너에게 알림 전송

---

### **Phase 3: 예약 승인 및 링크 생성** ⭐ 이미 구현됨

#### 3.1 Google Meet 링크 자동 생성
**API**: `/api/bookings/[id]/approve` (이미 구현됨 ✅)

**확인 사항**:
- ✅ 승인 시 `generateMeetLink` 함수로 자동 생성
- ✅ `booking_requests` 테이블에 `meet_url` 저장
- ✅ 사용자에게 알림 전송 (링크 포함)

---

### **Phase 4: 예약 상세 및 참여 페이지** 🔄 개선 필요

#### 4.1 예약 목록 페이지
**파일**: `src/app/bookings/page.tsx` 또는 새로운 경로

**구현 사항**:
- 사용자의 예약 요청 목록 표시 (`/api/bookings/my-requests`)
- 상태별 필터링 (pending, approved, rejected)
- 승인된 예약에 "Google Meet 참여하기" 버튼 표시

#### 4.2 예약 상세 페이지
**파일**: 새로운 페이지 필요 (`src/app/bookings/[id]/page.tsx`)

**구현 사항**:
- 예약 상세 정보 표시
- 상태별 다른 UI
  - `pending`: "대기 중입니다. 파트너 승인을 기다려주세요."
  - `approved`: "Google Meet 참여하기" 버튼 + 링크 표시
  - `rejected`: 거절 사유 표시
- 예약 시간 5분 전부터 참여 가능
- 예약 시간 전: 카운트다운 표시
- 예약 시간 후: "상담이 종료되었습니다" + 피드백 버튼

#### 4.3 Google Meet 참여 페이지
**파일**: `src/app/call/[meetingId]/page.tsx` (수정 필요)

**현재 상태**: 
- Google Meet 링크를 새 탭에서 열기
- 20분 타이머 시작

**개선 사항**:
- 예약 시간 체크 (5분 전부터 참여 가능)
- 예약 정보 표시 (파트너 이름, 주제, 시간)
- 타이머 및 상담 종료 후 피드백 이동

---

### **Phase 5: 알림 시스템** ✅ 이미 구현됨 (확인 필요)

#### 5.1 예약 관련 알림
- ✅ 예약 요청 알림 (파트너에게)
- ✅ 예약 승인 알림 (사용자에게, 링크 포함)
- ✅ 예약 거절 알림 (사용자에게)

---

## 📝 상세 구현 계획

### **A. 예약 생성 페이지 (`src/app/booking/create/page.tsx`) 재구성**

#### A-1. 상태 관리
```typescript
const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
const [availableDates, setAvailableDates] = useState<Date[]>([])
const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
const [formData, setFormData] = useState({
  partner_id: '',
  date: '',
  start_time: '',
  topic: '',
  description: ''
})
```

#### A-2. 파트너 정보 로드
```typescript
const fetchPartnerInfo = async (partnerId: string) => {
  const response = await fetch(`/api/conversation-partners/${partnerId}`)
  const data = await response.json()
  setSelectedPartner(data.partner)
  setFormData(prev => ({ ...prev, partner_id: partnerId }))
}
```

#### A-3. 예약 가능 시간 슬롯 로드
```typescript
const fetchAvailableSlots = async (partnerId: string, date: string) => {
  const response = await fetch(`/api/partners/${partnerId}/available-slots?date=${date}`)
  const data = await response.json()
  setAvailableTimeSlots(data.slots || [])
}
```

#### A-4. UI 구성
```tsx
<div>
  {/* 파트너 정보 카드 */}
  {selectedPartner && (
    <Card>
      <CardContent>
        <Avatar src={selectedPartner.avatar_url} />
        <h3>{selectedPartner.name}</h3>
        <p>{selectedPartner.specialty}</p>
      </CardContent>
    </Card>
  )}
  
  {/* 날짜 선택 (달력) */}
  <DayPicker
    mode="single"
    selected={formData.date ? new Date(formData.date) : undefined}
    onSelect={handleDateSelect}
    disabled={date => !availableDates.includes(date)}
  />
  
  {/* 시간 선택 (동적) */}
  <Select
    value={formData.start_time}
    onValueChange={setStartTime}
    disabled={!formData.date || availableTimeSlots.length === 0}
  >
    {availableTimeSlots.map(slot => (
      <SelectItem key={slot.start_time} value={slot.start_time}>
        {slot.start_time} - {slot.end_time}
      </SelectItem>
    ))}
  </Select>
  
  {/* 주제, 설명 입력 */}
  {/* Google Meet 링크 필드 제거 */}
  
  {/* 예약 생성 버튼 */}
</div>
```

---

### **B. 예약 상세 페이지 (`src/app/bookings/[id]/page.tsx`) 생성**

#### B-1. 예약 정보 로드
```typescript
const fetchBookingDetails = async (bookingId: string) => {
  const response = await fetch(`/api/bookings/my-requests/${bookingId}`)
  const data = await response.json()
  setBooking(data.booking)
}
```

#### B-2. 상태별 UI
```tsx
{booking.status === 'pending' && (
  <div>
    <p>대기 중입니다. 파트너 승인을 기다려주세요.</p>
    <p>파트너: {booking.partner.name}</p>
    <p>날짜: {booking.date}</p>
    <p>시간: {booking.start_time}</p>
  </div>
)}

{booking.status === 'approved' && (
  <div>
    <p>✅ 예약이 승인되었습니다!</p>
    {canJoinMeeting ? (
      <Button onClick={handleJoinMeeting}>
        🎥 Google Meet 참여하기
      </Button>
    ) : (
      <div>
        <p>예약 시간까지 {timeUntilBooking}</p>
        <p>예약 시간 5분 전부터 참여할 수 있습니다.</p>
      </div>
    )}
  </div>
)}
```

#### B-3. Google Meet 참여 로직
```typescript
const handleJoinMeeting = () => {
  if (!booking.meet_url) {
    alert('Google Meet 링크가 없습니다.')
    return
  }
  
  // 새 탭에서 Google Meet 열기
  window.open(booking.meet_url, '_blank')
  
  // 상담 페이지로 이동 (타이머 등)
  router.push(`/call/${booking.id}`)
}
```

---

### **C. 예약 목록 페이지 개선**

#### C-1. 예약 목록 API
```typescript
const fetchMyBookings = async () => {
  const response = await fetch('/api/bookings/my-requests')
  const data = await response.json()
  setBookings(data.bookings || [])
}
```

#### C-2. 상태별 필터링
```typescript
const pendingBookings = bookings.filter(b => b.status === 'pending')
const approvedBookings = bookings.filter(b => b.status === 'approved')
const rejectedBookings = bookings.filter(b => b.status === 'rejected')
```

---

## 🔄 데이터 흐름도

```
1. [프론트엔드] 사용자가 Chat 버튼 클릭
   → router.push(`/booking/create?partnerId=${partnerId}`)

2. [프론트엔드] 예약 생성 페이지 로드
   → fetchPartnerInfo(partnerId)
   → fetchAvailableDates(partnerId)
   → fetchAvailableSlots(partnerId, selectedDate)

3. [백엔드] /api/conversation-partners/[id]
   → 파트너 정보 반환

4. [백엔드] /api/partners/[id]/available-slots?date=YYYY-MM-DD
   → 해당 날짜의 예약 가능한 시간 슬롯 반환 (KST → 사용자 시간대 변환)

5. [프론트엔드] 사용자가 날짜/시간 선택 후 예약 요청
   → POST /api/bookings/request
   {
     partner_id: string,
     date: string (사용자 시간대),
     start_time: string (사용자 시간대),
     duration: 20,
     topic: string,
     description: string
   }

6. [백엔드] /api/bookings/request
   → 사용자 시간대를 KST로 변환
   → booking_requests 테이블에 저장 (status: 'pending', meet_url: null)
   → available_schedules.status = 'pending'
   → 파트너에게 알림 전송

7. [프론트엔드] 파트너가 승인 버튼 클릭
   → POST /api/bookings/[id]/approve

8. [백엔드] /api/bookings/[id]/approve
   → generateMeetLink() 호출하여 링크 생성
   → booking_requests.status = 'approved', meet_url 저장
   → available_schedules.status = 'booked'
   → 사용자에게 알림 전송 (링크 포함)

9. [프론트엔드] 사용자가 예약 상세 페이지 접속
   → GET /api/bookings/my-requests/[id]
   → 예약 정보 + meet_url 확인

10. [프론트엔드] 예약 시간 도래 후 "참여하기" 버튼 클릭
    → window.open(meet_url, '_blank')
    → router.push(`/call/${bookingId}`)

11. [프론트엔드] /call/[bookingId] 페이지
    → 20분 타이머 시작
    → 통화 종료 후 /feedback/[bookingId]로 이동
```

---

## ✅ 체크리스트

### 우선순위 높음 (즉시 구현)
- [ ] 예약 생성 페이지 재구성
  - [ ] URL 쿼리에서 partnerId 추출
  - [ ] 파트너 정보 자동 로드
  - [ ] 예약 가능 날짜/시간 동적 로드
  - [ ] Google Meet 링크 필드 제거
  - [ ] 날짜 선택 UI 개선 (달력)
- [ ] 예약 상세 페이지 생성
  - [ ] 예약 정보 조회 API 연결
  - [ ] 상태별 UI 구현
  - [ ] Google Meet 참여 로직
  - [ ] 예약 시간 체크 및 카운트다운

### 우선순위 중간 (기능 완성)
- [ ] 예약 목록 페이지 개선
  - [ ] 내 예약 목록 조회
  - [ ] 상태별 필터링
  - [ ] 예약 상세로 이동 링크
- [ ] 알림 연동 확인
  - [ ] 예약 요청 알림
  - [ ] 예약 승인 알림 (링크 포함)
  - [ ] 예약 거절 알림

### 우선순위 낮음 (UX 개선)
- [ ] 예약 시간 리마인더 (하루 전, 1시간 전)
- [ ] 예약 수정 기능 (승인 전)
- [ ] 예약 취소 기능 (승인 후)

---

## 📌 참고 사항

1. **시간대 처리**: 모든 시간은 KST 기준으로 저장하고, API 레벨에서 사용자 시간대로 변환하여 반환
2. **30분 버퍼**: 예약은 최소 30분 전에 해야 함 (파트너 준비 시간)
3. **20분 고정**: 현재 모든 예약은 20분 고정
4. **Google Meet 링크**: 예약 승인 시 자동 생성, 사용자 입력 불필요

---

## 🚀 다음 단계

1. **즉시 시작**: 예약 생성 페이지(`/booking/create`) 재구성
2. **다음**: 예약 상세 페이지 생성
3. **마지막**: 예약 목록 페이지 개선 및 통합 테스트


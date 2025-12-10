# 강의 플랫폼 통합 제안 (Zoom/Google Meet)

## 🎯 목적

한국어 강사가 강의를 하고 싶어하는데, Agora가 아닌 **Zoom 같은 외부 서비스**를 사용하면서도, **우리 사이트에서 서로간의 연결**을 제공하는 방법

---

## 💡 제안: 하이브리드 방식 (추천)

### 핵심 아이디어

**우리 사이트 = 예약/결제/관리 플랫폼**
**Zoom/Google Meet = 실제 강의 진행 플랫폼**

### 작동 방식

```
1. 강사가 강의 등록
   └─> 우리 사이트에 강의 정보 입력 (제목, 설명, 가격, Zoom 링크 등)

2. 학생이 강의 결제
   └─> 우리 사이트에서 PayPal 결제
   └─> purchases 테이블에 결제 기록 저장

3. 결제 완료 후
   └─> 우리 사이트의 "강의실 입장" 페이지로 이동
   └─> 강의 정보, 강사 정보, 참여자 목록 등 표시
   └─> "Zoom 참여하기" 버튼 클릭 → 새 탭에서 Zoom 링크로 이동

4. 강의 진행
   └─> Zoom에서 실제 강의 진행
   └─> 우리 사이트에서는 강의 기록, 후기, 재생성 등 관리
```

---

## ✅ 장점

### 1. **구현이 간단함
- Zoom/Google Meet API 연동 불필요
- 링크만 저장하고 리다이렉트하면 됨
- 기존 `meeting_link` 필드 활용 가능

### 2. **강사의 자유도
- 강사가 원하는 플랫폼 사용 (Zoom, Google Meet, Microsoft Teams 등)
- 강사가 직접 링크 생성/관리
- 우리는 링크만 저장

### 3. **우리 사이트의 가치
- ✅ 결제 시스템 (PayPal)
- ✅ 강의 예약/관리
- ✅ 학생-강사 연결
- ✅ 강의 기록/후기
- ✅ 커뮤니티 통합
- ✅ 알림 시스템

### 4. **확장성
- 나중에 Agora로 전환해도 구조 변경 최소화
- 여러 플랫폼 동시 지원 가능

---

## 📋 구현 방법

### 1. 데이터베이스 스키마

```sql
-- 강의 테이블

CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    category TEXT, -- 'korean', 'spanish', 'culture' 등
    thumbnail_url TEXT,
    
    -- 외부 플랫폼 링크

    meeting_platform TEXT DEFAULT 'zoom', -- 'zoom', 'google_meet', 'teams' 등
    meeting_link TEXT NOT NULL, -- Zoom/Google Meet 링크
    meeting_id TEXT, -- Zoom Meeting ID (선택적)
    meeting_password TEXT, -- 비밀번호 (선택적)
    
    -- 일정 정보

    scheduled_at TIMESTAMP WITH TIME ZONE, -- 강의 일정
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    
    -- 상태

    is_active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 강의 참여자 테이블 (결제 완료한 학생들)

CREATE TABLE IF NOT EXISTS public.lecture_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id), -- 결제 기록 연결
    joined_at TIMESTAMP WITH TIME ZONE, -- 실제 참여 시간
    attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lecture_id, user_id)
);
```

### 2. UI 플로우

#### 강사 측 (강의 등록)
```
1. 커뮤니티 > 강의실 > "강의 등록하기"
2. 강의 정보 입력:
   - 제목, 설명, 가격
   - 일정 (날짜/시간)
   - Zoom 링크 입력 (또는 "Zoom 링크 생성" 버튼)
3. 저장 → 강의 목록에 표시
```

#### 학생 측 (강의 구매/참여)
```
1. 커뮤니티 > 강의실 > 강의 목록
2. 강의 상세 보기
3. "결제하기" 버튼 → PayPal 결제
4. 결제 완료 → "강의실 입장" 페이지
5. 강의 정보, 강사 정보 표시
6. "Zoom 참여하기" 버튼 → 새 탭에서 Zoom 열기
```

### 3. 코드 예시

#### 강의실 입장 페이지 (`/lectures/[id]/join`)

```typescript
// src/app/lectures/[id]/join/page.tsx

export default function LectureJoinPage({ params }: { params: { id: string } }) {
  const { lecture, participants, userPurchase } = useLectureData(params.id)
  
  const handleJoinZoom = () => {
    if (!lecture?.meeting_link) {
      alert('강의 링크가 없습니다.')
      return
    }
    
    // 새 탭에서 Zoom 열기

    window.open(lecture.meeting_link, '_blank')
    
    // 참여 기록 저장

    markAsJoined(lecture.id)
  }
  
  return (
    <div>
      <h1>{lecture.title}</h1>
      <p>강사: {lecture.instructor.name}</p>
      <p>일정: {formatDate(lecture.scheduled_at)}</p>
      
      {/* 결제 완료한 학생만 보임 */}
      {userPurchase && (
        <Button onClick={handleJoinZoom}>
          🎥 {lecture.meeting_platform === 'zoom' ? 'Zoom' : 'Google Meet'} 참여하기
        </Button>
      )}
      
      {/* 참여자 목록 */}
      <div>
        <h3>참여자 ({participants.length}/{lecture.max_participants})</h3>
        {participants.map(p => (
          <div key={p.id}>{p.user.name}</div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🔄 현재 코드와의 통합

### 이미 있는 것 활용

1. **`meeting_link` 필드** (bookings 테이블)
   - 강의 테이블에도 동일하게 사용

2. **`generateMeetLink` 함수** (Google Meet용)
   - Zoom 링크는 강사가 직접 입력하거나
   - Zoom API로 생성 (선택적)

3. **결제 시스템**
   - 기존 PayPal 시스템 그대로 사용
   - `purchases` 테이블에 `product_type: 'lecture'` 저장

4. **알림 시스템**
   - 강의 시작 전 알림
   - 결제 완료 알림
   - 강의 취소 알림

---

## 🎨 UI 제안

### 강의실 카테고리 (커뮤니티 탭)

```
├─ 공지사항
├─ 자유게시판
├─ K-POP
├─ ...
└─ 📚 강의실 (NEW)
    ├─ 전체 강의
    ├─ 한국어 강의
    ├─ 스페인어 강의
    └─ 내 강의 (구매한 강의)
```

### 강의 카드

```
┌─────────────────────────────┐
│ [썸네일]                     │
│                              │
│ 📚 한국어 기초 회화           │
│ 👤 강사: 김선생님            │
│ 💰 $29.99                    │
│ 📅 2025-12-15 19:00         │
│ 👥 5/10명 참여               │
│                              │
│ [결제하기] [상세보기]        │
└─────────────────────────────┘
```

### 강의실 입장 페이지

```
┌─────────────────────────────┐
│  📚 한국어 기초 회화          │
│                              │
│  강사: 김선생님              │
│  일정: 2025-12-15 19:00     │
│  참여자: 5/10명              │
│                              │
│  ┌─────────────────────┐    │
│  │ 🎥 Zoom 참여하기    │    │
│  └─────────────────────┘    │
│                              │
│  참여자 목록:                │
│  • 학생1                     │
│  • 학생2                     │
│  ...                         │
└─────────────────────────────┘
```

---

## 🚀 구현 단계

### Phase 1: 기본 구조
1. ✅ 강의 테이블 생성
2. ✅ 강의 등록 UI (강사용)
3. ✅ 강의 목록 UI
4. ✅ 강의 상세 UI

### Phase 2: 결제 연결
5. ✅ PayPal 결제 버튼
6. ✅ 결제 완료 후 강의 접근 권한 부여
7. ✅ `purchases` 테이블에 저장

### Phase 3: 강의실 입장
8. ✅ 강의실 입장 페이지
9. ✅ Zoom/Google Meet 링크 연결
10. ✅ 참여자 목록 표시

### Phase 4: 추가 기능
11. 강의 시작 전 알림
12. 강의 후기/평가
13. 강의 재생성 (녹화본)
14. 강의 취소/환불

---

## 💭 고려사항

### 1. Zoom 링크 생성

**✅ **옵션 A: Zoom API 자동 생성** (추천 - Zoom을 이미 결제하고 있으므로)
- 우리 사이트에서 Zoom 미팅 자동 생성
- 강사가 강의 등록 시 → 자동으로 Zoom 미팅 생성
- 링크 자동 저장
- 더 편리하고 전문적

**구현 방법:
1. Zoom App Marketplace에서 Server-to-Server OAuth 앱 생성
2. Account ID, Client ID, Client Secret 발급
3. 우리 서버에서 Zoom API로 미팅 자동 생성
4. 생성된 링크를 데이터베이스에 저장

****옵션 B: 강사가 직접 입력** (대안)
- 강사가 Zoom에서 미팅 생성 후 링크 복사/붙여넣기
- 간단하지만 수동 작업 필요

**추천: 옵션 A (Zoom API 자동 생성) - Zoom을 이미 결제하고 있으므로 활용하는 것이 좋습니다!**

### 2. 보안

- 강의 링크는 결제 완료한 학생만 볼 수 있도록
- RLS 정책으로 접근 제어
- 강의 비밀번호는 별도로 저장 (필요시)

### 3. 확장성

- 나중에 Agora로 전환해도 구조 변경 최소화
- `meeting_platform` 필드로 여러 플랫폼 지원
- 우리 사이트에서 통합 관리

---

## ✅ 최종 제안

**하이브리드 방식 (우리 사이트 + 외부 플랫폼)을 추천합니다!**

**이유:
1. ✅ 구현이 간단함 (링크만 저장하고 리다이렉트)
2. ✅ 강사의 자유도 (원하는 플랫폼 사용)
3. ✅ 우리 사이트의 가치 (결제, 관리, 커뮤니티)
4. ✅ 확장성 (나중에 Agora 전환 가능)
5. ✅ 사용자 경험 (우리 사이트에서 모든 것 관리)

****구현 난이도:** ⭐⭐☆☆☆ (중간 - 기존 구조 활용 가능)

**예상 작업 시간:** 1-2일 (마리아가 작업 시)

---

**작성일:** 2025-12-09

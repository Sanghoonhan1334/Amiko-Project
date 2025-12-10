# Zoom 통합 가이드

## 🎯 목적

Zoom을 이미 결제하고 있으므로, 강의에 Zoom을 연결하는 방법

## ✅ 추천 방법: 간단한 링크 방식

**기존 Google Meet 코드를 참고하면 매우 간단합니다!**

### 구현 방법

1. **강사가 강의 등록 시 Zoom 링크 입력**
2. **데이터베이스에 `meeting_link` 필드로 저장**
3. **학생이 결제 완료 후 → "Zoom 참여하기" 버튼 클릭**
4. **`window.open(meeting_link, '_blank')`로 새 탭에서 Zoom 열기**

### 참고 파일
- `src/app/call/[meetingId]/page.tsx` - Google Meet 참여 페이지 (그대로 활용 가능)
- `src/lib/meet-link-generator.ts` - 링크 생성 유틸리티 (참고용)

---

## 🔧 고급 방법: Zoom API 자동 생성 (선택사항)

나중에 필요하면 Zoom API를 활용하여 강의 미팅을 자동으로 생성할 수 있습니다.

---

## 💻 간단한 구현 코드

### 1. 강의 등록 시 Zoom 링크 입력

```typescript
// 강사가 강의 등록할 때

const lectureData = {
  title: '한국어 기초 회화',
  description: '...',
  price: 29.99,
  scheduled_at: '2025-12-15T19:00:00Z',
  duration_minutes: 60,
  meeting_platform: 'zoom',
  meeting_link: 'https://zoom.us/j/1234567890', // 강사가 직접 입력
  meeting_password: 'optional-password', // 선택적
}
```

### 2. 강의실 입장 페이지 (`/lectures/[id]/join`)

기존 `/call/[meetingId]` 페이지를 참고:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Clock } from 'lucide-react'

export default function LectureJoinPage() {
  const params = useParams()
  const router = useRouter()
  const lectureId = params.id as string
  const [lecture, setLecture] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasJoined, setHasJoined] = useState(false)

  // 강의 정보 조회

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`/api/lectures/${lectureId}`)
        if (response.ok) {
          const data = await response.json()
          setLecture(data.lecture)
        }
      } catch (error) {
        console.error('Error fetching lecture:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (lectureId) {
      fetchLecture()
    }
  }, [lectureId])

  // Zoom 참여 (기존 Google Meet 코드와 동일)

  const handleJoinZoom = () => {
    if (!lecture?.meeting_link) {
      alert('No hay enlace de Zoom.
      return
    }
    
    setHasJoined(true)
    // 새 탭에서 Zoom 열기 (기존 코드와 동일)

    window.open(lecture.meeting_link, '_blank')
  }

  if (loading) {
    return <div>Cargando...
  }

  if (!lecture) {
    return <div>No se puede encontrar la clase.
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{lecture.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Instructor
            <p className="font-semibold">{lecture.instructor?.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Horario
            <p className="font-semibold">
              {new Date(lecture.scheduled_at).toLocaleString('ko-KR')}
            </p>
          </div>

          {!hasJoined ? (
            <Button 
              onClick={handleJoinZoom}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Video className="w-6 h-6 mr-2" />
              Participar en Zoom
            </Button>
          ) : (
            <div className="text-center text-green-600">
              ✅ ¡Se ha participado en Zoom!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. 데이터베이스 스키마

```sql
-- lectures 테이블에 추가

ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS meeting_platform TEXT DEFAULT 'zoom',
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS meeting_password TEXT;
```

---

## 🔧 고급 방법: Zoom API 자동 생성 (선택사항)


---

## 📋 Zoom API 사전 준비 (나중에 필요할 때)

### 1. Zoom App 생성

1. **Zoom Marketplace 접속**
   - https://marketplace.zoom.us/ 접속
   - 로그인 (Zoom 계정)

2. **새 앱 생성**
   - "Develop" → "Build App"
   - 앱 타입: **"Server-to-Server OAuth"** 선택
   - 이유: 서버 간 통신이므로 가장 안전하고 편리함

3. **앱 정보 입력**
   - App Name: "Amiko Lecture Platform"
   - Company Name: 회사명
   - Developer Contact: 개발자 이메일

4. **권한 설정 (Scopes)**
   - 필수 권한:
     - `meeting:write` - 미팅 생성
     - `meeting:read` - 미팅 조회
     - `user:read` - 사용자 정보 조회

5. **인증 정보 발급**
   - Account ID
   - Client ID
   - Client Secret
   - ⚠️ **이 정보는 절대 공개하지 마세요!**

---

## 🔧 환경 변수 설정

`.env.local` 파일에 추가:

```env
# Zoom API 설정
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

---

## 💻 구현 코드

### 1. Zoom API 유틸리티 생성

`src/lib/zoom.ts` 파일 생성:

```typescript
import axios from 'axios'

interface ZoomMeeting {
  id: string
  join_url: string
  start_url: string
  password?: string
  topic: string
  start_time: string
  duration: number
}

interface CreateMeetingParams {
  topic: string
  startTime: string // ISO 8601 형식: 2025-12-15T19:00:00Z
  duration: number // 분 단위
  timezone?: string // 기본값: 'UTC'
  password?: string // 선택적 비밀번호
  settings?: {
    host_video?: boolean
    participant_video?: boolean
    join_before_host?: boolean
    mute_upon_entry?: boolean
  }
}

/**
 * Zoom Access Token 획득
 */
async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom API credentials are not configured')
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: accountId,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return response.data.access_token
  } catch (error: any) {
    console.error('Zoom Access Token 획득 실패:', error.response?.data || error.message)
    throw new Error('Failed to get Zoom access token')
  }
}

/**
 * Zoom 미팅 생성
 */
export async function createZoomMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken()

  const meetingData = {
    topic: params.topic,
    type: 2, // Scheduled meeting (2 = 예약된 미팅)
    start_time: params.startTime,
    duration: params.duration,
    timezone: params.timezone || 'UTC',
    password: params.password,
    settings: {
      host_video: params.settings?.host_video ?? true,
      participant_video: params.settings?.participant_video ?? true,
      join_before_host: params.settings?.join_before_host ?? false,
      mute_upon_entry: params.settings?.mute_upon_entry ?? false,
      waiting_room: false, // 대기실 비활성화 (선택적)
      approval_type: 0, // 자동 승인
    },
  }

  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      id: response.data.id.toString(),
      join_url: response.data.join_url,
      start_url: response.data.start_url,
      password: response.data.password,
      topic: response.data.topic,
      start_time: response.data.start_time,
      duration: response.data.duration,
    }
  } catch (error: any) {
    console.error('Zoom 미팅 생성 실패:', error.response?.data || error.message)
    throw new Error('Failed to create Zoom meeting')
  }
}

/**
 * Zoom 미팅 조회
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken()

  try {
    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return {
      id: response.data.id.toString(),
      join_url: response.data.join_url,
      start_url: response.data.start_url,
      password: response.data.password,
      topic: response.data.topic,
      start_time: response.data.start_time,
      duration: response.data.duration,
    }
  } catch (error: any) {
    console.error('Zoom 미팅 조회 실패:', error.response?.data || error.message)
    throw new Error('Failed to get Zoom meeting')
  }
}

/**
 * Zoom 미팅 삭제
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken()

  try {
    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
  } catch (error: any) {
    console.error('Zoom 미팅 삭제 실패:', error.response?.data || error.message)
    throw new Error('Failed to delete Zoom meeting')
  }
}
```

### 2. API Route 생성

`src/app/api/lectures/[id]/create-zoom-meeting/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createZoomMeeting } from '@/lib/zoom'
import { supabaseClient } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const lectureId = resolvedParams.id

    // 강의 정보 조회

    const { data: lecture, error: lectureError } = await supabaseClient
      .from('lectures')
      .select('*')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '강의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 Zoom 미팅이 있으면 재사용

    if (lecture.meeting_link && lecture.meeting_id) {
      return NextResponse.json({
        success: true,
        meeting: {
          id: lecture.meeting_id,
          join_url: lecture.meeting_link,
          password: lecture.meeting_password,
        },
      })
    }

    // Zoom 미팅 생성

    const zoomMeeting = await createZoomMeeting({
      topic: lecture.title,
      startTime: lecture.scheduled_at,
      duration: lecture.duration_minutes || 60,
      timezone: 'Asia/Seoul', // 또는 강사 시간대
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
      },
    })

    // 강의 테이블에 Zoom 정보 저장

    const { error: updateError } = await supabaseClient
      .from('lectures')
      .update({
        meeting_platform: 'zoom',
        meeting_link: zoomMeeting.join_url,
        meeting_id: zoomMeeting.id,
        meeting_password: zoomMeeting.password,
      })
      .eq('id', lectureId)

    if (updateError) {
      console.error('강의 업데이트 실패:', updateError)
    }

    return NextResponse.json({
      success: true,
      meeting: {
        id: zoomMeeting.id,
        join_url: zoomMeeting.join_url,
        password: zoomMeeting.password,
      },
    })
  } catch (error: any) {
    console.error('Zoom 미팅 생성 API 오류:', error)
    return NextResponse.json(
      { error: error.message || 'Zoom 미팅 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 3. 강의 등록 시 자동 생성


```typescript
// src/app/api/lectures/route.ts (POST)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, scheduled_at, duration_minutes, instructor_id } = body

    // 1. 강의 생성

    const { data: lecture, error: lectureError } = await supabaseClient
      .from('lectures')
      .insert({
        instructor_id,
        title,
        description,
        price,
        scheduled_at,
        duration_minutes,
        meeting_platform: 'zoom',
      })
      .select()
      .single()

    if (lectureError) {
      return NextResponse.json(
        { error: '강의 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 2. Zoom 미팅 자동 생성

    try {
      const zoomMeeting = await createZoomMeeting({
        topic: title,
        startTime: scheduled_at,
        duration: duration_minutes || 60,
        timezone: 'Asia/Seoul',
      })

      // 3. Zoom 정보 업데이트

      await supabaseClient
        .from('lectures')
        .update({
          meeting_link: zoomMeeting.join_url,
          meeting_id: zoomMeeting.id,
          meeting_password: zoomMeeting.password,
        })
        .eq('id', lecture.id)
    } catch (zoomError) {
      console.error('Zoom 미팅 생성 실패 (강의는 생성됨):', zoomError)
      // 강의는 생성되었지만 Zoom 미팅 생성 실패

      // 나중에 수동으로 생성 가능

    }

    return NextResponse.json({
      success: true,
      lecture,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 📦 필요한 패키지

```bash
npm install axios
```

---

## ✅ 장점

1. **자동화**: 강사가 강의 등록 시 자동으로 Zoom 미팅 생성
2. **편리함**: 강사가 수동으로 링크 입력할 필요 없음
3. **일관성**: 모든 강의가 동일한 방식으로 관리됨
4. **보안**: 비밀번호 자동 생성 및 관리

---

## ⚠️ 주의사항

1. **Zoom API Rate Limit**
   - 분당 요청 제한이 있으므로 캐싱 고려
   - Access Token은 재사용 가능 (만료 전까지)

2. **에러 처리**
   - Zoom API 실패 시에도 강의는 생성되도록
   - 나중에 수동으로 Zoom 미팅 생성 가능하도록

3. **비용**
   - Zoom API는 무료이지만, Zoom 계정 비용은 별도
   - 이미 결제하고 있으므로 문제없음

---

## ✅ 최종 추천

**간단한 링크 방식 (추천)
- 구현 시간: 30분~1시간
- 복잡도: 낮음
- 기존 코드 재사용 가능
- 강사가 직접 링크 관리 (유연함)

**Zoom API 방식 (나중에 필요하면)
- 구현 시간: 2-3시간
- 복잡도: 높음
- 자동화 가능
- 일관성 있음

****결론:** 먼저 간단한 링크 방식으로 구현하고, 나중에 필요하면 Zoom API를 추가하는 것을 추천합니다!

---

**작성일:** 2025-12-09
****업데이트:** 간단한 링크 방식으로 우선 구현 추천

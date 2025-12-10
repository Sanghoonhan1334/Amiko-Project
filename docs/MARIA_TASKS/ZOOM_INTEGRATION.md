# Guía de Integración de Zoom

## 🎯 Objetivo

Ya estamos pagando Zoom, por lo que este es el método para conectar Zoom a las clases.

## ✅ Método Recomendado: Método de Enlace Simple

**¡Es muy simple si se consulta el código de Google Meet existente!**

### Método de Implementación

1. **El instructor ingresa el enlace de Zoom al registrar la clase**
2. **Guardar en el campo `meeting_link` de la base de datos**
3. **Después de que el estudiante complete el pago → Hacer clic en el botón "Participar en Zoom"**
4. **Abrir Zoom en una nueva pestaña con `window.open(meeting_link, '_blank')`**

### Archivos de Referencia
- `src/app/call/[meetingId]/page.tsx` - Página de participación de Google Meet (se puede usar tal cual)
- `src/lib/meet-link-generator.ts` - Utilidad de generación de enlaces (para referencia)

---

## 🔧 Método Avanzado: Generación Automática con Zoom API (Opcional)

Si es necesario más tarde, se puede utilizar Zoom API para generar automáticamente las reuniones de clase.

---

## 💻 Código de Implementación Simple

### 1. Ingreso de Enlace de Zoom al Registrar Clase

```typescript
const lectureData = {
  title: 'Conversación Básica de Coreano',
  description: '...',
  price: 29.99,
  scheduled_at: '2025-12-15T19:00:00Z',
  duration_minutes: 60,
  meeting_platform: 'zoom',
  meeting_link: 'https:
  meeting_password: 'optional-password',
}
```

### 2. Página de Entrada al Aula (`/lectures/[id]/join`)

Consultar la página `/call/[meetingId]` existente:

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

  // Participar en Zoom (igual que el código de Google Meet existente)

  const handleJoinZoom = () => {
    if (!lecture?.meeting_link) {
      alert('No hay enlace de Zoom.
      return
    }
    
    setHasJoined(true)
    // Abrir Zoom en una nueva pestaña (igual que el código existente)

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

### 3. Esquema de Base de Datos

```sql
-- Agregar a la tabla lectures

ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS meeting_platform TEXT DEFAULT 'zoom',
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS meeting_password TEXT;
```

---



---




   - "Develop" → "Build App"

   - App Name: "Amiko Lecture Platform"


   - Account ID
   - Client ID
   - Client Secret

---



```env
# Configuración de Zoom API
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

---




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
  startTime: string
  duration: number
  timezone?: string
  password?: string
  settings?: {
    host_video?: boolean
    participant_video?: boolean
    join_before_host?: boolean
    mute_upon_entry?: boolean
  }
}

/**
 * Obtener Zoom Access Token
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
    console.error('Error al obtener Zoom Access Token:', error.response?.data || error.message)
    throw new Error('Failed to get Zoom access token')
  }
}

/**
 * Crear Reunión Zoom
 */
export async function createZoomMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken()

  const meetingData = {
    topic: params.topic,
    type: 2,
    start_time: params.startTime,
    duration: params.duration,
    timezone: params.timezone || 'UTC',
    password: params.password,
    settings: {
      host_video: params.settings?.host_video ?? true,
      participant_video: params.settings?.participant_video ?? true,
      join_before_host: params.settings?.join_before_host ?? false,
      mute_upon_entry: params.settings?.mute_upon_entry ?? false,
      waiting_room: false,
      approval_type: 0,
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
    console.error('Error al crear reunión Zoom:', error.response?.data || error.message)
    throw new Error('Failed to create Zoom meeting')
  }
}

/**
 * Consultar Reunión Zoom
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
    console.error('Error al consultar reunión Zoom:', error.response?.data || error.message)
    throw new Error('Failed to get Zoom meeting')
  }
}

/**
 * Eliminar Reunión Zoom
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
    console.error('Error al eliminar reunión Zoom:', error.response?.data || error.message)
    throw new Error('Failed to delete Zoom meeting')
  }
}
```


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

    const { data: lecture, error: lectureError } = await supabaseClient
      .from('lectures')
      .select('*')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: 'No se puede encontrar la clase.' },
        { status: 404 }
      )
    }

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

    const zoomMeeting = await createZoomMeeting({
      topic: lecture.title,
      startTime: lecture.scheduled_at,
      duration: lecture.duration_minutes || 60,
      timezone: 'Asia/Seoul',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
      },
    })

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
      console.error('Error al actualizar clase:', updateError)
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
    console.error('Error de API al crear reunión Zoom:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear reunión Zoom.' },
      { status: 500 }
    )
  }
}
```



```typescript
// src/app/api/lectures/route.ts (POST)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, scheduled_at, duration_minutes, instructor_id } = body

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
        { error: 'Error al crear clase.' },
        { status: 500 }
      )
    }

    try {
      const zoomMeeting = await createZoomMeeting({
        topic: title,
        startTime: scheduled_at,
        duration: duration_minutes || 60,
        timezone: 'Asia/Seoul',
      })

      await supabaseClient
        .from('lectures')
        .update({
          meeting_link: zoomMeeting.join_url,
          meeting_id: zoomMeeting.id,
          meeting_password: zoomMeeting.password,
        })
        .eq('id', lecture.id)
    } catch (zoomError) {
      console.error('Error al crear reunión Zoom (la clase fue creada):', zoomError)
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


```bash
npm install axios
```

---



---


1. **Zoom API Rate Limit**



---

## ✅ Recomendación Final

**Método de Enlace Simple (Recomendado)
- Tiempo de implementación: 30 minutos~1 hora
- Complejidad: Baja
- Se puede reutilizar código existente
- El instructor gestiona el enlace directamente (flexible)

**Método Zoom API (Si es necesario más tarde)
- Tiempo de implementación: 2-3 horas
- Complejidad: Alta
- Se puede automatizar
- Consistente

**Conclusión:** ¡Recomendamos implementar primero el método de enlace simple y agregar Zoom API más tarde si es necesario!

---

**Fecha de creación
**Actualización:** Recomendación de implementar primero el método de enlace simple

# Propuesta de Integración de Plataforma de Clases (Zoom/Google Meet)

## 🎯 Objetivo

Un instructor de coreano quiere dar clases, pero quiere usar **servicios externos como Zoom** en lugar de Agora, mientras proporcionamos **conexión mutua en nuestro sitio**.

---

## 💡 Propuesta: Método Híbrido (Recomendado)

### Idea Principal

**Nuestro sitio = Plataforma de reserva/pago/gestión**
**Zoom/Google Meet = Plataforma real de clases**

### Cómo Funciona

```
1. El instructor registra la clase
   └─> Ingresar información de clase en nuestro sitio (título, descripción, precio, enlace Zoom, etc.)

2. El estudiante paga la clase
   └─> Pago PayPal en nuestro sitio
   └─> Guardar registro de pago en tabla purchases

3. Después de completar el pago
   └─> Ir a la página "Entrada al Aula" de nuestro sitio
   └─> Mostrar información de clase, instructor, lista de participantes, etc.
   └─> Hacer clic en botón "Participar en Zoom" → Ir a enlace Zoom en nueva pestaña

4. Realización de clase
   └─> Realizar clase real en Zoom
   └─> Gestionar registro de clase, reseñas, regeneración, etc. en nuestro sitio
```

---

## ✅ Ventajas

### 1. **Implementación Simple
- No se requiere integración de API de Zoom/Google Meet
- Solo guardar el enlace y redirigir
- Utilizar el campo `meeting_link` existente

### 2. **Libertad del Instructor
- El instructor puede usar la plataforma que desee (Zoom, Google Meet, Microsoft Teams, etc.)
- El instructor genera/gestiona el enlace directamente
- Nosotros solo guardamos el enlace

### 3. **Valor de Nuestro Sitio
- ✅ Sistema de pago (PayPal)
- ✅ Reserva/gestión de clases
- ✅ Conexión estudiante-instructor
- ✅ Registro/reseñas de clases
- ✅ Integración con comunidad
- ✅ Sistema de notificaciones

### 4. **Escalabilidad
- Cambio mínimo de estructura incluso si se cambia a Agora más tarde
- Soporte simultáneo de múltiples plataformas

---

## 📋 Método de Implementación

### 1. Esquema de Base de Datos

```sql
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    category TEXT,
    thumbnail_url TEXT,
    
    meeting_platform TEXT DEFAULT 'zoom',
    meeting_link TEXT NOT NULL,
    meeting_id TEXT,
    meeting_password TEXT,
    
    scheduled_at TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lecture_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id),
    joined_at TIMESTAMP WITH TIME ZONE,
    attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lecture_id, user_id)
);
```

### 2. Flujo de UI

#### Lado del Instructor (Registro de Clase)
```
1. Comunidad > Aula > "Registrar Clase"
2. Ingresar información de clase:
   - Título, descripción, precio
   - Horario (fecha/hora)
   - Ingresar enlace Zoom (o botón "Generar Enlace Zoom")
3. Guardar → Mostrar en lista de clases
```

#### Lado del Estudiante (Compra/Participación en Clase)
```
1. Comunidad > Aula > Lista de clases
2. Ver detalles de clase
3. Botón "Pagar" → Pago PayPal
4. Pago completado → Página "Entrada al Aula"
5. Mostrar información de clase e instructor
6. Botón "Participar en Zoom" → Abrir Zoom en nueva pestaña
```

### 3. Ejemplos de Código

#### Página de Entrada al Aula (`/lectures/[id]/join`)

```typescript
// src/app/lectures/[id]/join/page.tsx

export default function LectureJoinPage({ params }: { params: { id: string } }) {
  const { lecture, participants, userPurchase } = useLectureData(params.id)
  
  const handleJoinZoom = () => {
    if (!lecture?.meeting_link) {
      alert('No hay enlace de clase.')
      return
    }
    
    window.open(lecture.meeting_link, '_blank')
    
    markAsJoined(lecture.id)
  }
  
  return (
    <div>
      <h1>{lecture.title}</h1>
      <p>Instructor: {lecture.instructor.name}</p>
      <p>Horario: {formatDate(lecture.scheduled_at)}</p>
      
      {/* Solo visible para estudiantes que completaron el pago */}
      {userPurchase && (
        <Button onClick={handleJoinZoom}>
          🎥 Participar en {lecture.meeting_platform === 'zoom' ? 'Zoom' : 'Google Meet'}
        </Button>
      )}
      
      {/* Lista de participantes */}
      <div>
        <h3>Participantes ({participants.length}/{lecture.max_participants})</h3>
        {participants.map(p => (
          <div key={p.id}>{p.user.name}</div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🔄 Integración con Código Actual

### Utilizar lo que ya existe





---

## 🎨 Propuesta de UI

### Categoría de Aula (Pestaña de Comunidad)

```
├─ Anuncios
├─ Tablón Libre
├─ K-POP
├─ ...
└─ 📚 Aula (NEW)
    ├─ Todas las Clases
    ├─ Clases de Coreano
    ├─ Clases de Español
    └─ Mis Clases (clases compradas)
```

### Tarjeta de Clase

```
┌─────────────────────────────┐
│ [Miniatura]                  │
│                              │
│ 📚 Conversación Básica de Coreano           │
│ 👤 Instructor: Prof. Kim            │
│ 💰 $29.99                    │
│ 📅 2025-12-15 19:00         │
│ 👥 5/10 participantes               │
│                              │
│ [Pagar] [Ver Detalles]        │
└─────────────────────────────┘
```

### Página de Entrada al Aula

```
┌─────────────────────────────┐
│  📚 Conversación Básica de Coreano          │
│                              │
│  Instructor: Prof. Kim              │
│  Horario: 2025-12-15 19:00     │
│  Participantes: 5/10              │
│                              │
│  ┌─────────────────────┐    │
│  │ 🎥 Participar en Zoom    │    │
│  └─────────────────────┘    │
│                              │
│  Lista de Participantes:                │
│  • Estudiante1                     │
│  • Estudiante2                     │
│  ...                         │
└─────────────────────────────┘
```

---

## 🚀 Etapas de Implementación

### Fase 1: Estructura Básica

### Fase 2: Conexión de Pago

### Fase 3: Entrada al Aula

### Fase 4: Funciones Adicionales

---

## 💭 Consideraciones

### 1. Generación de Enlace de Zoom

**✅ Opción A: Generación Automática con Zoom API** (Recomendado - Ya estamos pagando Zoom)
- Generación automática de reunión Zoom desde nuestro sitio
- Cuando el instructor registra una clase → Generación automática de reunión Zoom
- Guardado automático del enlace
- Más conveniente y profesional

**Método de implementación:
1. Crear app Server-to-Server OAuth en Zoom App Marketplace
2. Emitir Account ID, Client ID, Client Secret
3. Generación automática de reunión con Zoom API desde nuestro servidor
4. Guardar el enlace generado en la base de datos

**Opción B: Entrada Directa por el Instructor** (Alternativa)
- El instructor crea la reunión en Zoom y copia/pega el enlace
- Simple pero requiere trabajo manual

**Recomendación: Opción A (Generación Automática con Zoom API) - ¡Ya estamos pagando Zoom, así que es bueno aprovecharlo!**

### 2. Seguridad

- Solo los estudiantes que completaron el pago pueden ver el enlace de la clase
- Control de acceso con políticas RLS
- Guardar la contraseña de la clase por separado (si es necesario)

### 3. Escalabilidad

- Cambio mínimo de estructura incluso si se cambia a Agora más tarde
- Soporte de múltiples plataformas con el campo `meeting_platform`
- Gestión integrada en nuestro sitio

---

## ✅ Propuesta Final

**¡Recomendamos el método híbrido (nuestro sitio + plataforma externa)!**

**Razones:
1. ✅ Implementación simple (solo guardar enlace y redirigir)
2. ✅ Libertad del instructor (usar la plataforma que desee)
3. ✅ Valor de nuestro sitio (pago, gestión, comunidad)
4. ✅ Escalabilidad (posibilidad de cambiar a Agora más tarde)
5. ✅ Experiencia de usuario (gestionar todo en nuestro sitio)

**Dificultad de implementación:** ⭐⭐☆☆☆ (Media - se puede utilizar la estructura existente)

**Tiempo estimado de trabajo:** 1-2 días (cuando María trabaje)

---

**Fecha de creación

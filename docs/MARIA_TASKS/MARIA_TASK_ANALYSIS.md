# Análisis y Respuestas de Solicitudes de Trabajo para María

## 📋 Solicitudes

1. **Política + UI de "Acepto"
2. **Sistema de pago + crear pestaña de clases en comunidad

---

## ❓ Pregunta 1: Sistema de Pago de Consulta 1:1 por Videollamada

### ⚠️ **Importante: Situación Actual

**La función de videollamada 1:1 está actualmente en desarrollo y aún no está completa.
- Responsable del desarrollo: Usuario (yo mismo)
- Método de implementación: Implementación directa con **Agora**
- Estado: **En desarrollo** (incompleto)
- Fecha prevista de finalización: **Finales de enero de 2025**

**Por lo tanto:
- Puede ser difícil conectar el pago antes de que se complete la UI/función de videollamada
- Sin embargo, el sistema de pago en sí se puede preparar de antemano
- Una vez que la UI esté completa (después de finales de enero), solo hay que conectar el pago

---

### Análisis de la Situación Actual

✅ **Partes ya implementadas:
- `/api/video-call/start` - API de inicio de videollamada (solo estructura básica)
- `/payments/checkout` - UI de página de pago ✅
- `PayPalPaymentButton` - Componente de botón de pago PayPal ✅
- Tabla `bookings` - Almacenamiento de información de reserva ✅
- API de pago PayPal (`/api/paypal/create-order`, `/api/paypal/approve-order`) ✅

⚠️ **Método de funcionamiento actual:
- **Pago basado en cupones** (20 minutos = $1.99)
- Comprar cupones primero → Reservar consulta con cupones
- El flujo de reserva de consulta con pago directo de PayPal **aún no existe**

❌ **Partes que aún no existen:
- UI de videollamada completa (actualmente en desarrollo con Agora, prevista para finales de enero)
- Flujo de pago directo PayPal → Reserva de consulta

### Respuesta: **¡Es posible! Se puede preparar de antemano**

**Razones:
1. ✅ **La UI de pago ya existe** (`/payments/checkout`)
2. ✅ **El sistema de pago PayPal ya está implementado**
3. ✅ **El esquema de base de datos también está preparado** (`paypal-payment-schema.sql` creado recientemente)
4. ⚠️ **La UI de videollamada está en desarrollo con Agora** (prevista para finales de enero)

**Trabajo que se puede solicitar a María:

```
"Conecta para que la consulta 1:1 por videollamada se pueda pagar directamente con PayPal"

Actual:
- Comprar cupones → Reservar consulta con cupones

Solicitud:
- Pago directo PayPal → Reserva de consulta (sin cupones)
```

**Método de implementación:
1. Agregar botón "Pagar con PayPal" al componente `VideoCallStarter`
2. Después de completar el pago → Crear reserva en la tabla `bookings`
3. Al crear la reserva → Guardar registro de pago en la tabla `payments`
4. Utilizar la página `/payments/checkout` que ya existe

**Trabajo adicional necesario:
- Conectar el flujo de pago desde `VideoCallStarter`
- Iniciar consulta automáticamente o confirmar reserva después de completar el pago

**Conclusión:** ✅ **¡El sistema de pago se puede preparar de antemano incluso sin la UI!**

---

## ❓ Pregunta 2: Sistema de Pago del Aula de Comunidad

### Análisis de la Situación Actual

✅ **Partes ya implementadas:
- `CommunityTab` - Pestaña principal de comunidad
- Varias categorías (anuncios, tablón libre, K-POP, K-Drama, fanart, memes de ídolos, belleza, estudio de coreano, estudio de español, tablón de votación)
- Sistema de pago PayPal (reutilizable)

❌ **Partes que no existen:
- Categoría "Aula" o "Class"
- Flujo de pago de clases

### Respuesta: **¡Es totalmente posible! No parece que tomará mucho tiempo**

**Razones:
1. ✅ **La estructura de la pestaña de comunidad ya está bien hecha**
   - Solo hay que agregar categorías
   - Es fácil si se consulta la estructura de categorías existente

2. ✅ **El sistema de pago es reutilizable**
   - Utilizar el sistema de pago PayPal ya creado
   - Agregar `product_type: 'lecture'` o `'class'` a la tabla `purchases`

3. ✅ **La estructura es simple**
   - Ver lista de clases
   - Ver detalles de clase
   - Botón "Pagar"
   - Otorgar acceso a la clase después de completar el pago

**Trabajo que se puede solicitar a María:

```
"Agrega la categoría 'Aula' en la pestaña de comunidad y 
permite pagar las clases con PayPal"

Contenido de implementación:
1. Agregar categoría 'Aula' a CommunityTab
2. Página de lista/detalles de clases
3. Botón de pago PayPal
4. Otorgar acceso a la clase después de completar el pago
```

**Tiempo estimado de trabajo:
- Agregar categoría: 1-2 horas
- UI de lista/detalles de clases: 2-3 horas
- Conexión de pago: 2-3 horas (reutilizar sistema PayPal existente)
- **Total estimado: 5-8 horas** (posible en 1 día)

**Base de datos:
- Se necesita una tabla para almacenar información de clases (ej: `lectures` o `classes`)
- Utilizar la tabla `purchases` existente para pagos (`product_type: 'lecture'`)

**Conclusión:** ✅ **¡María puede hacerlo sin problemas y no parece que tomará mucho tiempo!**

---

## 📝 Resumen de Solicitudes para María

### 1. Conexión de Pago PayPal para Consulta 1:1 por Videollamada

**⚠️ Importante: Situación Actual
- La función de videollamada 1:1 está **actualmente en desarrollo directo por el usuario con Agora** y aún no está completa.
- Fecha prevista de finalización: **Finales de enero de 2025**
- Una vez que la UI de videollamada esté completa (después de finales de enero), entonces conecte el sistema de pago.
- No es urgente ahora, por lo que puede proceder como **trabajo de Fase 2**.

**Solicitud (después de completar la UI de videollamada):
```
Conecta para que la consulta 1:1 por videollamada se pueda pagar directamente con PayPal.

Actualmente hay que comprar cupones primero, pero
permita que el pago directo con PayPal → reserva de consulta inmediata sea posible.

Lo que ya existe:
- Página /payments/checkout ✅
- Componente PayPalPaymentButton ✅
- API PayPal (create-order, approve-order) ✅
- Esquema de base de datos (paypal-payment-schema.sql) ✅

Trabajo necesario (después de completar la UI de videollamada):
1. Agregar botón "Pagar con PayPal" a VideoCallStarter
2. Crear reserva en la tabla bookings después de completar el pago
3. Guardar registro de pago en la tabla payments
4. Iniciar consulta automáticamente o confirmar reserva después de completar el pago
```

**Archivos de Referencia:**
- `src/components/video/VideoCallStarter.tsx`
- `src/app/payments/checkout/page.tsx`
- `src/components/payments/PayPalPaymentButton.tsx`
- `database/paypal-payment-schema.sql` (referencia de esquema)

---

### 2. Aula de Comunidad + Sistema de Pago

**Solicitud:
```
Agrega la categoría 'Aula' en la pestaña de comunidad y 
permite pagar las clases con PayPal.

Contenido de implementación:
1. Agregar categoría 'Aula' a CommunityTab
   - Consultar estructura de categorías existente (announcement, free, kpop, etc.)
   
2. Página de lista/detalles de clases
   - Título de clase, descripción, precio, información del instructor
   - Botón "Pagar"
   
3. Conexión de pago PayPal
   - Reutilizar PayPalPaymentButton existente
   - Guardar en la tabla purchases con product_type: 'lecture'
   
4. Otorgar acceso a la clase después de completar el pago
   - Mostrar lista de clases compradas por el usuario
   - Permitir acceso al contenido de la clase
```

**Archivos de Referencia:**
- `src/components/main/app/community/CommunityTab.tsx`
- `src/components/payments/PayPalPaymentButton.tsx`
- `database/paypal-payment-schema.sql`

**Adicional Necesario:**
- Tabla para almacenar información de clases (ej: tabla `lectures`)
- Tabla de mapeo clase-usuario (ej: usar `user_lectures` o `purchases`)

---

## 🎯 Recomendación de Prioridades

### Fase 1 (hasta diciembre - urgente)
1. ✅ **Política + UI de "Acepto"** (trabajo de María)
2. ✅ **Aula de comunidad + pago** (trabajo de María, se puede hacer rápidamente)

### Fase 2 (después de completar UI de videollamada - el usuario completa primero)
3. **Conexión de pago PayPal para consulta 1:1 por videollamada** (trabajo de María)

**Orden de trabajo:
1. **Usuario**: Completar UI/función de videollamada 1:1 (implementación con Agora, **previsto para finales de enero**)
2. **María**: Después de completar videollamada (después de finales de enero) → Conectar pago PayPal

**Razones:
- El aula es una función independiente, por lo que se puede implementar rápidamente
- **La videollamada está siendo desarrollada directamente por el usuario con Agora, prevista para finales de enero**
- **Una vez completada, María solo tiene que conectar el pago**
- El sistema de pago ya está preparado, solo se necesita el trabajo de conexión
- No es urgente ahora, por lo que proceder con Fase 2

---

## 💡 Propuesta Adicional

### Esquema de Base de Datos del Aula (se puede proporcionar a María)

```sql
-- Tabla de Clases

CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    category TEXT, -- 'korean', 'spanish', 'culture', etc.
    thumbnail_url TEXT,
    content_url TEXT, -- URL de contenido de clase o JSONB
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utilizar la tabla purchases existente para pagos

-- product_type: 'lecture'

-- product_data: { lecture_id: '...' }

```

¡Si se proporciona este esquema a María, puede trabajar más rápido!

---

**Fecha de creación:** 2025-12-09

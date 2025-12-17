# Especificaciones de Integración del Sistema de Pagos

## Resumen Ejecutivo

Este documento describe los tipos de productos que deben integrarse con el sistema de pagos de Amiko. El sistema debe soportar tres tipos principales de transacciones.

---

## 1. Sistema de Cupones (Coupons)

### Descripción
Sistema de cupones para videollamadas y consultas. Los usuarios reciben 1 cupón gratis cada 3 días, y pueden comprar cupones adicionales si desean practicar más conversación.

### Especificaciones Técnicas

**Tipo de Producto**: `coupon`

**Nota Importante**: 
- Los usuarios reciben **1 cupón gratis cada 3 días** automáticamente
- Los cupones de pago son para usuarios que quieren **practicar más** comprando cupones adicionales

**Estructura de Datos**:
- **Tipo de cupón**: `ako` (unidad base)
- **Precio**: 1 AKO = $1.99 USD = 20 minutos de tiempo de videollamada
- **Moneda**: USD

**Paquetes Disponibles**:
| Cantidad | Precio Total | Minutos | Descuento | Precio Unitario |
|----------|--------------|---------|-----------|-----------------|
| 1 AKO    | $1.99        | 20 min  | 0%        | $1.99          |
| 5 AKO    | $9.45        | 100 min | 5%        | $1.89          |
| 10 AKO   | $17.90       | 200 min | 10%       | $1.79          |
| 20 AKO   | $33.80       | 400 min | 15%       | $1.69          |

**Tabla de Base de Datos**: `coupons`
**Tabla de Registro**: `purchases` (con `product_type = 'coupon'`)

**Flujo de Integración**:
1. Usuario selecciona un paquete de cupones (opcional - porque también reciben cupones gratis)
2. Se crea un registro en `purchases` con `product_type = 'coupon'`
3. Se incluye en `product_data`:
   - `coupon_minutes`: minutos totales
   - `coupon_count`: cantidad de cupones
   - `source`: debe ser 'purchase' (para distinguir de cupones gratuitos que tienen source='event' o similar)
4. Al confirmar el pago, se crea un registro en `coupons` con los minutos disponibles
5. Los cupones expiran 1 año después de la compra

**Nota sobre Cupones Gratuitos**:
- Los cupones gratuitos (1 cada 3 días) se crean automáticamente en la tabla `coupons` con `source` diferente de 'purchase'
- El sistema debe distinguir entre cupones gratuitos y cupones comprados para reportes/estadísticas

---

## 2. Suscripción VIP (VIP Subscription)

### Descripción
Sistema de suscripción premium que ofrece funcionalidades avanzadas a los usuarios.

### Especificaciones Técnicas

**Tipo de Producto**: `vip_subscription`

**Estructura de Datos**:
- **Tipos de Plan**:
  - `monthly` - Suscripción mensual
  - `yearly` - Suscripción anual
  - `lifetime` - Suscripción de por vida
- **Moneda**: USD
- **Renovación Automática**: Sí (configurable por usuario)

**Tabla de Base de Datos**: `vip_subscriptions`
**Tabla de Registro**: `purchases` (con `product_type = 'vip_subscription'`)

**Estados de Suscripción**:
- `active` - Activa
- `cancelled` - Cancelada
- `expired` - Expirada
- `suspended` - Suspendida

**Métodos de Pago Soportados**:
- PayPal
- Stripe
- Cupón (si aplica)
- Admin (asignación manual)

**Flujo de Integración**:
1. Usuario selecciona un plan VIP (mensual, anual o de por vida)
2. Se crea un registro en `purchases` con `product_type = 'vip_subscription'`
3. Se incluye en `product_data`:
   - `plan_type`: tipo de plan
   - `price`: precio del plan
   - `duration_months`: duración en meses (null para lifetime)
4. Al confirmar el pago, se crea un registro en `vip_subscriptions`
5. Se establece `start_date` y `end_date` (null para lifetime)
6. Si está habilitada, se configura la renovación automática

---

## 3. Sistema de Cursos/Lecturas (Lectures/Courses)

### Descripción
Sistema de cursos en línea donde los usuarios pueden inscribirse. Cada curso puede tener su propio precio y un límite de participantes.

### Especificaciones Técnicas

**Tipo de Producto**: `lecture`

**Estructura de Datos**:
- **Precio Variable**: Cada curso puede tener un precio diferente
- **Precio del Curso Inicial**: ₩80,000 KRW (≈ $55 USD) por persona
  - Este es el precio del primer curso que se implementará
  - Futuros cursos pueden tener precios diferentes
- **Límite de Participantes**: Variable por curso (ejemplo: máximo 10 personas para el curso inicial)
- **Moneda**: USD (se almacena en USD, pero puede especificarse en KRW y convertirse según el tipo de cambio actual)

**Tabla de Base de Datos**: Se requiere crear tabla `lectures` con la siguiente estructura sugerida:
```sql
CREATE TABLE public.lectures (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_krw NUMERIC(10, 2),
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    instructor_id UUID,
    schedule_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Tabla de Registro**: `purchases` (con `product_type = 'lecture'`)

**Tabla de Inscripciones**: Se requiere crear tabla `lecture_enrollments`:
```sql
CREATE TABLE public.lecture_enrollments (
    id UUID PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id),
    user_id UUID REFERENCES public.users(id),
    purchase_id UUID REFERENCES public.purchases(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled'))
);
```

**Flujo de Integración**:
1. Usuario selecciona un curso específico
2. Sistema verifica disponibilidad (número actual de participantes < máximo)
3. Se crea un registro en `purchases` con:
   - `product_type = 'lecture'`
   - `amount`: precio del curso en USD (convertido desde KRW si es necesario)
   - `product_data`: incluye `lecture_id`, `lecture_title`, `instructor_name`, `price_krw` (opcional)
4. Al confirmar el pago:
   - Se actualiza `current_participants` en `lectures`
   - Se crea un registro en `lecture_enrollments`
   - Se vincula el `purchase_id` con la inscripción
5. Si el curso alcanza el límite máximo, se marca como "sold out"

**Curso Inicial**:
- **Precio**: ₩80,000 KRW (≈ $55 USD al tipo de cambio actual)
- **Límite de Participantes**: 10 personas máximo
- Este es el primer curso que se implementará, futuros cursos pueden tener precios y límites diferentes

**Consideraciones Especiales**:
- Cada curso tiene un precio independiente
- El sistema debe validar que hay espacio disponible antes de permitir el pago
- Si el curso está completo, el usuario no puede proceder con el pago
- Los precios pueden estar en KRW pero se almacenan como USD en la base de datos

---

## Estructura de la Tabla `purchases`

### Modificación Requerida

La tabla `purchases` debe actualizarse para incluir el nuevo tipo de producto:

```sql
ALTER TABLE public.purchases 
ALTER COLUMN product_type 
TYPE TEXT 
CHECK (product_type IN ('coupon', 'vip_subscription', 'lecture'));
```

### Campos Relevantes

- `product_type`: Tipo de producto (`coupon`, `vip_subscription`, `lecture`)
- `amount`: Monto de la transacción (USD)
- `currency`: Moneda (típicamente 'USD')
- `product_data`: JSONB que contiene información específica del producto
- `status`: Estado del pago (`pending`, `paid`, `failed`, `canceled`, `refunded`)

### Ejemplo de `product_data` por Tipo

**Cupón**:
```json
{
  "coupon_minutes": 100,
  "coupon_count": 5,
  "package_id": 2,
  "source": "purchase"
}
```
Nota: Los cupones gratuitos (1 cada 3 días) tienen `source` diferente, por ejemplo: "daily_reward" o "attendance"

**VIP Subscription**:
```json
{
  "plan_type": "monthly",
  "duration_months": 1,
  "price": 9.99,
  "features": ["ad_removal", "priority_support"]
}
```

**Lecture**:
```json
{
  "lecture_id": "uuid-del-curso",
  "lecture_title": "Título del Curso",
  "instructor_name": "Nombre del Instructor",
  "schedule_date": "2025-12-20T10:00:00Z",
  "max_participants": 10,
  "current_participants": 5,
  "price_krw": 80000,
  "price_usd": 55
}
```
Nota: El curso inicial tiene precio fijo de ₩80,000 KRW (≈ $55 USD)

---

## Proveedores de Pago Soportados

- **PayPal**: Integración completa
- **Stripe**: Integración disponible
- **Toss**: Planificado para futuro

---

## Endpoints de API Requeridos

### 1. Crear Orden de Pago
- **Endpoint**: `POST /api/paypal/create-order` (o equivalente para otros proveedores)
- **Body**: Incluye `product_type`, `product_id`, `amount`, `currency`

### 2. Webhook de Confirmación de Pago
- **Endpoint**: `POST /api/paypal/webhook` (o equivalente)
- **Responsabilidades**:
  - Actualizar estado en `purchases`
  - Procesar el producto según su tipo
  - Crear registros en tablas correspondientes (`coupons`, `vip_subscriptions`, `lecture_enrollments`)

### 3. Verificar Disponibilidad (para Cursos)
- **Endpoint**: `GET /api/lectures/{lecture_id}/availability`
- **Retorna**: Disponibilidad actual, precio, límite de participantes

---

## Notas para el CTO

1. **Sistema de Cupones Gratuitos**: Los usuarios reciben automáticamente 1 cupón cada 3 días (fuera del sistema de pagos). El sistema de compra de cupones es complementario para usuarios que quieren más práctica. Se debe distinguir entre cupones gratuitos y comprados usando el campo `source` en la tabla `coupons`.

2. **Flexibilidad de Precios**: El sistema de cursos debe soportar precios variables. El primer curso tiene precio fijo de ₩80,000 KRW (≈ $55 USD), pero el sistema debe estar preparado para cursos con precios diferentes en el futuro.

3. **Gestión de Capacidad**: Para los cursos, es crítico verificar la disponibilidad antes de procesar el pago para evitar sobreventa. El curso inicial tiene un límite de 10 participantes.

4. **Conversión de Moneda**: El precio del curso inicial es ₩80,000 KRW. Se debe convertir a USD al momento de la transacción usando el tipo de cambio actual (aproximadamente $55 USD). El sistema debe almacenar tanto el precio en KRW como en USD para referencia.

5. **Integridad de Datos**: Las transacciones deben ser atómicas - si falla la creación del producto (cupón, VIP, inscripción), el pago debe revertirse o marcarse como pendiente de resolución manual.

6. **Historial**: Todos los cambios de estado deben registrarse para auditoría y soporte al cliente.

7. **Sistema de Cupones Gratuitos**: Implementar lógica separada para otorgar 1 cupón cada 3 días automáticamente (no requiere pago). Estos cupones deben tener un `source` diferente en la tabla `coupons` para distinguirlos de los cupones comprados.

---

## Preguntas para Aclarar

1. ¿Se requiere un sistema de lista de espera para cursos completos?
2. ¿Los cursos permiten reembolsos y cómo se manejan?
3. ¿Hay descuentos o códigos promocionales para cursos?
4. ¿Los precios de cursos se actualizan dinámicamente o son fijos al momento de la compra?
5. ¿Se requiere integración con calendario para notificar a los participantes?

---

**Documento creado**: 2025-12-12
**Versión**: 1.0
**Autor**: Sistema de Documentación Amiko

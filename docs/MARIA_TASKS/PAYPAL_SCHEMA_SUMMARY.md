# Resumen del Esquema del Sistema de Pago PayPal

## 📌 Archivos Creados

1. **`paypal-payment-schema.sql`** - Script de creación de esquema completo
2. **`paypal-test-data.sql`** - Script de inserción de datos de prueba
3. **`PAYPAL_SCHEMA_GUIDE.md`** - Documento de guía detallada

---

## ✅ 1. Lista de Tablas que se Deben Crear en Supabase

### Tablas Requeridas (5)

| Nombre de Tabla
|---------|------|------|
| `users` | Existente o crear
| `consultants` | Existente o crear
| `bookings` | **Actualización necesaria**
| `payments` | **Crear nuevo**
| `purchases` | **Crear nuevo**

---

## 📋 2. Nombre de Campos, Tipos y Relaciones de Cada Tabla

### 2.1. Tabla `bookings` (Actualización)

**Campos que se necesitan agregar:

```sql
payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
    
payment_method TEXT DEFAULT 'paypal'

payment_id TEXT  -- PayPal Order ID
```

**Claves Foráneas:
- `user_id` → `users(id)` (CASCADE)
- `consultant_id` → `consultants(id)` (SET NULL)

### 2.2. Tabla `payments` (Crear Nuevo)

**Campos Principales:

| Nombre de Campo
|--------|------|------|------|
| `id` | UUID | Clave primaria
| `order_id` | TEXT | Número de pedido interno
| `payment_id` | TEXT | PayPal Order ID | UNIQUE |
| `user_id` | UUID | ID de usuario
| `booking_id` | UUID | ID de reserva
| `amount` | INTEGER | Monto de pago (centavos)
| `currency` | TEXT | Moneda
| `status` | TEXT | Estado de pago
| `payment_method` | TEXT | Método de pago
| `paypal_data` | JSONB | Respuesta completa de PayPal

**Claves Foráneas:
- `user_id` → `users(id)` (CASCADE)
- `booking_id` → `bookings(id)` (SET NULL)

### 2.3. Tabla `purchases` (Crear Nuevo)

**Campos Principales:

| Nombre de Campo
|--------|------|------|------|
| `id` | UUID | Clave primaria
| `user_id` | UUID | ID de usuario
| `provider` | TEXT | Proveedor de pago
| `payment_id` | TEXT | PayPal Order ID | UNIQUE |
| `order_id` | TEXT | Número de pedido interno
| `amount` | DECIMAL(10,2) | Monto de pago (USD)
| `currency` | TEXT | Moneda
| `country` | TEXT | País de pago
| `status` | TEXT | Estado de compra
| `product_type` | TEXT | Tipo de producto
| `product_data` | JSONB | Información detallada del producto
| `paypal_data` | JSONB | Respuesta completa de PayPal

**Claves Foráneas:
- `user_id` → `users(id)` (CASCADE)

---








---



```sql
-- Email: test@amiko.com


INSERT INTO public.users (id, email, full_name)
SELECT id, email, 'Usuario de Prueba'
FROM auth.users
WHERE email = 'test@amiko.com'
ON CONFLICT (id) DO NOTHING;
```




```sql
INSERT INTO public.bookings (
    user_id, consultant_id, order_id, topic, 
    start_at, end_at, duration, price, currency,
    status, payment_status, payment_method
)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.consultants LIMIT 1),
    'order-test-001',
    'Reserva de Consulta de Prueba',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    60,
    50.00,
    'USD',
    'pending',
    'pending',
    'paypal'
WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings WHERE order_id = 'order-test-001'
);

INSERT INTO public.payments (
    order_id, payment_id, user_id, booking_id,
    amount, currency, status, payment_method, paypal_data
)
SELECT 
    'order-test-001',
    'PAYPAL-TEST-001',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.bookings WHERE order_id = 'order-test-001' LIMIT 1),
    5000,
    'USD',
    'completed',
    'paypal',
    '{"id": "PAYPAL-TEST-001", "status": "COMPLETED"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE payment_id = 'PAYPAL-TEST-001'
);
```

---




```
1. Abrir Supabase Dashboard > SQL Editor
2. Copiar y ejecutar paypal-payment-schema.sql
3. Copiar y ejecutar paypal-test-data.sql (opcional)
4. Verificar datos
```



```bash
supabase migration new paypal_payment_schema
# Copiar SQL al archivo creado
supabase db push
```

---

## ⚠️ Puntos Importantes

### 1. Modificación de Código Necesaria

La lógica para guardar realmente en la tabla `purchases` está faltando en el archivo **`src/app/api/paypal/create-order/route.ts`**.

**Código Actual (líneas 73-86):
```typescript
const purchaseData = {
  orderId,
  paymentId: paypalData.id,
  amount: amount / 100,
  productType: productType || 'coupon',
  productData: productData || {},
  paypalData: paypalData
};

return NextResponse.json({
  orderId: paypalData.id,
  purchaseData
});
```

**Modificación Necesaria:
```typescript
const { data: purchase, error: purchaseError } = await supabase
  .from('purchases')
  .insert({
    user_id: body.userId,
    provider: 'paypal',
    payment_id: paypalData.id,
    order_id: orderId,
    amount: amount / 100,
    currency: 'USD',
    country: body.country || null,
    status: 'pending',
    product_type: productType || 'coupon',
    product_data: productData || {},
    paypal_data: paypalData
  })
  .select()
  .single();

if (purchaseError) {
  console.error('[PayPal] Failed to create purchase record:', purchaseError);
}

return NextResponse.json({
  orderId: paypalData.id,
  purchaseId: purchase?.id
});
```

### 2. Configuración del Cliente Supabase

Para usar el cliente Supabase en la API `create-order`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 📊 Flujo de Datos

```
1. create-order
   └─> Guardar en tabla purchases con estado pending
   
2. approve-order
   ├─> Guardar en tabla payments con estado completed
   └─> Actualizar tabla bookings (payment_status = 'paid')
   
3. webhook
   └─> Actualizar tabla purchases (cambio de status)
```

---

## ✅ Lista de Verificación

- [ ] Ejecución de `paypal-payment-schema.sql` completada
- [ ] Verificar agregación de campos `payment_status`, `payment_method`, `payment_id` a tabla `bookings`
- [ ] Verificar creación de tabla `payments`
- [ ] Verificar creación de tabla `purchases`
- [ ] Verificar creación de índices
- [ ] Verificar políticas RLS
- [ ] Inserción de datos de prueba (opcional)
- [ ] Agregar lógica de guardado de Supabase a API `create-order`
- [ ] Probar flujo de pago PayPal

---

**Fecha de creación
**Versión

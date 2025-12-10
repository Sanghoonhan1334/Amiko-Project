# Guía del Esquema del Sistema de Pago PayPal en Supabase

## 📋 Tabla de Contenidos

1. [Lista de Tablas
2. [Estructura de Tablas
3. [Método de Ejecución
4. [Datos de Prueba
5. [Migración vs Ejecución Manual

---

## 1. Lista de Tablas

Tablas de Supabase necesarias para el sistema de pago PayPal:

### Tablas Requeridas (5)

1. **`users`** - Información de usuario (puede existir ya)
2. **`consultants`** - Información de consultor (puede existir ya)
3. **`bookings`** - Información de reserva (se necesitan campos payment_status, payment_method, payment_id)
4. **`payments`** - Registro de pago PayPal (se necesita crear nuevo)
5. **`purchases`** - Registro de compra (cupones, suscripción VIP, etc.) (se necesita crear nuevo)

---

## 2. Estructura de Tablas

### 2.1. Tabla `bookings` (Se Necesita Actualización)

**Campos que se Necesitan Agregar/Modificar:

```sql
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paypal';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_id TEXT;
```

**Estructura Completa:

| Nombre de Campo
|--------|------|------|----------|
| `id` | UUID | Clave primaria
| `user_id` | UUID | ID de usuario
| `consultant_id` | UUID | ID de consultor
| `order_id` | TEXT | Número de pedido interno
| `topic` | TEXT | Tema de consulta
| `description` | TEXT | Descripción detallada
| `start_at` | TIMESTAMPTZ | Hora de inicio
| `end_at` | TIMESTAMPTZ | Hora de fin
| `duration` | INTEGER | Tiempo de consulta (minutos)
| `price` | DECIMAL(10,2) | Precio (USD)
| `currency` | TEXT | Moneda
| `status` | TEXT | Estado de reserva
| **`payment_status`** | TEXT | **Estado de pago**
| **`payment_method`** | TEXT | **Método de pago**
| **`payment_id`** | TEXT | **PayPal Order ID** | |
| `meeting_link` | TEXT | Enlace de videoconferencia
| `notes` | TEXT | Notas
| `created_at` | TIMESTAMPTZ | Hora de creación
| `updated_at` | TIMESTAMPTZ | Hora de actualización

### 2.2. Tabla `payments` (Crear Nuevo)

**Propósito:** Guardar cuando se aprueba el pago PayPal (`/api/paypal/approve-order`)

| Nombre de Campo
|--------|------|------|----------|
| `id` | UUID | Clave primaria
| `order_id` | TEXT | Número de pedido interno
| `payment_id` | TEXT | PayPal Order ID | UNIQUE, NOT NULL |
| `user_id` | UUID | ID de usuario
| `booking_id` | UUID | ID de reserva
| `amount` | INTEGER | Monto de pago (centavos)
| `currency` | TEXT | Moneda
| `status` | TEXT | Estado de pago
| `payment_method` | TEXT | Método de pago
| `paypal_data` | JSONB | Respuesta completa de API PayPal
| `created_at` | TIMESTAMPTZ | Hora de creación
| `updated_at` | TIMESTAMPTZ | Hora de actualización

**Valores de Estado:** `pending`, `completed`, `failed`, `cancelled`, `refunded`

### 2.3. Tabla `purchases` (Crear Nuevo)

**Propósito:** Registro de compra (cupones, suscripción VIP, etc.) - Guardar como pending en `create-order`, actualizar en `webhook`

| Nombre de Campo
|--------|------|------|----------|
| `id` | UUID | Clave primaria
| `user_id` | UUID | ID de usuario
| `provider` | TEXT | Proveedor de pago
| `payment_id` | TEXT | PayPal Order ID | UNIQUE, NOT NULL |
| `order_id` | TEXT | Número de pedido interno
| `amount` | DECIMAL(10,2) | Monto de pago (USD)
| `currency` | TEXT | Moneda
| `country` | TEXT | País de pago
| `status` | TEXT | Estado de compra
| `product_type` | TEXT | Tipo de producto
| `product_data` | JSONB | Información detallada del producto
| `paypal_data` | JSONB | Respuesta completa de API PayPal
| `created_at` | TIMESTAMPTZ | Hora de creación
| `updated_at` | TIMESTAMPTZ | Hora de actualización

**Valores de Proveedor:** `paypal`, `toss`, `stripe`
**Valores de Estado:** `pending`, `paid`, `failed`, `canceled`, `refunded`
**Tipos de Producto:** `coupon`, `vip_subscription`, `booking`

---

## 3. Método de Ejecución

### Método 1: Supabase Dashboard (Recomendado - Configuración Inicial)

1. **Acceder a Supabase Dashboard
   - Acceder a https://app.supabase.com
   - Seleccionar proyecto

2. **Abrir SQL Editor
   - Hacer clic en "SQL Editor" en el menú izquierdo
   - Hacer clic en "New query"

3. **Ejecutar Archivo de Esquema
   - Copiar contenido del archivo `database/paypal-payment-schema.sql`
   - Pegar en SQL Editor
   - Hacer clic en el botón "Run"

4. **Insertar Datos de Prueba (Opcional)
   - Copiar contenido del archivo `database/paypal-test-data.sql`
   - Pegar en SQL Editor
   - Hacer clic en el botón "Run"

### Método 2: Supabase CLI (Migración)

```bash
# Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# Iniciar sesión en Supabase
supabase login

# Vincular proyecto
supabase link --project-ref your-project-ref

# Crear archivo de migración
supabase migration new paypal_payment_schema

# Copiar SQL al archivo de migración creado
# supabase/migrations/YYYYMMDDHHMMSS_paypal_payment_schema.sql

# Ejecutar migración
supabase db push
```

---

## 4. Datos de Prueba

### 4.1. Trabajo Previo Requerido

**⚠️ Importante:** Antes de insertar datos de prueba:

1. **Crear Usuario de Prueba en Supabase Auth
   - Dashboard > Authentication > Users
   - Hacer clic en "Add user"
   - Email: `test@amiko.com`
   - Password: Establecer contraseña temporal

2. **Agregar Perfil a la Tabla public.users
   ```sql
   INSERT INTO public.users (id, email, full_name)
   SELECT id, email, 'Usuario de Prueba
   FROM auth.users
   WHERE email = 'test@amiko.com'
   ON CONFLICT (id) DO NOTHING;
   ```

### 4.2. Ejecutar Datos de Prueba

Ejecutar archivo `database/paypal-test-data.sql`

**Datos que se Crean:
- ✅ 1 consultor de prueba
- ✅ 1 reserva de prueba (order-test-001)
- ✅ 1 registro de pago de prueba (PAYPAL-TEST-001)
- ✅ 1 registro de compra de prueba (compra de cupón)

---

## 5. Migración vs Ejecución Manual

### ✅ **Ejecución Manual Recomendada** (Configuración Inicial)

**Razones:
1. ✅ **Simplicidad**: Se puede ejecutar directamente en Supabase Dashboard
2. ✅ **Verificación inmediata**: Se puede verificar el resultado inmediatamente
3. ✅ **Fácil depuración**: Se puede corregir inmediatamente si ocurre un error
4. ✅ **Trabajo único**: Es configuración inicial, no se necesita gestión de migración

**Orden de Ejecución:
```
1. Ejecutar paypal-payment-schema.sql
2. Ejecutar paypal-test-data.sql (opcional)
3. Verificar datos
```

### ⚠️ **Cuando Usar Migración** (Colaboración en Equipo o Producción)

**Cuándo usar:
- Cuando se necesita gestionar cambios de esquema con versiones en equipo
- Al desplegar en entorno de producción
- Al gestionar múltiples entornos (dev, staging, prod)

**Ventajas:
- Gestión de versiones posible
- Rollback posible
- Seguimiento de historial de cambios

---

## 6. Diagrama de Relaciones de Datos

```
users (1) ──< (N) bookings
                │
                │ (1:1 o 1:0)
                │
                └──> payments
                
users (1) ──< (N) purchases
```

**Explicación de Relaciones:
- `bookings.user_id` → `users.id` (CASCADE)
- `payments.user_id` → `users.id` (CASCADE)
- `payments.booking_id` → `bookings.id` (SET NULL)
- `purchases.user_id` → `users.id` (CASCADE)

---

## 7. Mapeo de Campos Usados en el Código

### 7.1. `/api/paypal/create-order`

**Entrada:
- `amount` (centavos
- `orderId` → `purchases.order_id`
- `orderName`
- `customerName`
- `customerEmail`
- `bookingId` → `purchases.product_data.booking_id` (opcional
- `productType` → `purchases.product_type`
- `productData` → `purchases.product_data`

**Ubicación de Guardado:** Tabla `purchases` (estado pending)

### 7.2. `/api/paypal/approve-order`

**Entrada:
- `orderId` (PayPal Order ID)

**Ubicación de Guardado:
- Tabla `payments` (estado completed)
- Actualizar tabla `bookings` (payment_status = 'paid')

### 7.3. `/api/paypal/webhook`

**Entrada:
- Evento webhook de PayPal

**Actualización:
- Tabla `purchases` (actualización de status)

---

## 8. Consultas de Verificación

### 8.1. Verificar Existencia de Tablas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'bookings', 'payments', 'purchases', 'consultants');
```

### 8.2. Verificar Índices

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'payments', 'purchases');
```

### 8.3. Verificar Políticas RLS

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'payments', 'purchases');
```

---

## 9. Resolución de Problemas

### Problema: "relation already exists"
**Solución:** Usar `CREATE TABLE IF NOT EXISTS` (ya aplicado)

### Problema: "foreign key constraint"
**Solución:** La tabla referenciada (users) debe crearse primero

### Problema: "permission denied"
**Solución:** Ejecutar con Service Role Key en Supabase Dashboard o verificar políticas RLS

---

## 10. Próximos Pasos

1. ✅ Creación de esquema completada
2. ✅ Inserción de datos de prueba (opcional)
3. 🔄 Probar flujo de pago PayPal
4. 🔄 Probar endpoint de webhook
5. 🔄 Despliegue en producción

---

**Fecha de creación
**Versión

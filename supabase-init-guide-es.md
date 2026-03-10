# Guía de Inicialización de Supabase para el Proyecto AMIKO

## 📋 Resumen

Esta guía explica cómo inicializar la base de datos de Supabase para el proyecto AMIKO.

El script `supabase-init-es.sql` creará las siguientes tablas:

1. **users** - Perfiles de usuario (extensión de auth.users)
2. **consultants** - Información de consultores
3. **bookings** - Información de reservas
4. **payments** - Registros de pagos PayPal
5. **purchases** - Registros de compras (cupones, suscripciones VIP, etc.)
6. **coupons** - Cupones
7. **coupon_usage** - Historial de uso de cupones
8. **vip_subscriptions** - Suscripciones VIP
9. **vip_features** - Lista de funciones VIP

## 🚀 Cómo Ejecutar (3 Pasos)

### Paso 1: Acceder a la Consola de Supabase
1. Accede a https://app.supabase.com
2. Selecciona tu proyecto
3. Haz clic en **"SQL Editor"** en el menú izquierdo

### Paso 2: Ejecutar el Script
1. Haz clic en el botón **"New query"**
2. Copia y pega todo el contenido del archivo `supabase-init-es.sql`
3. Haz clic en el botón **"Run"** (o Ctrl+Enter / Cmd+Enter)
4. Verifica el mensaje de ejecución completada

### Paso 3: Crear Usuario de Prueba y Verificar Datos
1. Ve a **"Authentication" > "Users"** en el menú izquierdo
2. Haz clic en el botón **"Add user"**
3. Ingresa la siguiente información:
   - **Email**: `test@amiko.com`
   - **Password**: `test123456` (o la contraseña que desees)
   - **Auto Confirm User**: Marca esta casilla
4. Haz clic en **"Create user"**
5. Ejecuta el script `supabase-init-es.sql` nuevamente para crear datos de prueba

## 📁 Ubicación de Archivos

```
AMIKO-Project-main/
├── supabase-init-es.sql          # Script de inicialización principal (usa este archivo)
└── supabase-init-guide-es.md     # Este documento guía
```

## ✅ Verificaciones Después de la Ejecución

### Verificar Creación de Tablas
Ejecuta la siguiente consulta en SQL Editor para verificar que las tablas se crearon:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'consultants', 
    'bookings', 
    'payments', 
    'purchases', 
    'coupons', 
    'coupon_usage', 
    'vip_subscriptions', 
    'vip_features'
)
ORDER BY table_name;
```

### Verificar Usuario de Prueba
```sql
SELECT id, email, full_name, is_admin 
FROM public.users 
WHERE email = 'test@amiko.com';
```

### Verificar Registro de Pago de Prueba
```sql
SELECT id, payment_id, order_id, amount, status, product_type
FROM public.purchases
WHERE payment_id LIKE 'PAYPAL-TEST-%';
```

## 🔗 Diagrama de Relaciones entre Tablas

```
auth.users (1) ──< (1) public.users
                        │
                        ├──< (N) consultants
                        │
                        ├──< (N) bookings ──> (N) consultants
                        │        │
                        │        └──> (0..1) payments
                        │
                        ├──< (N) payments
                        │
                        ├──< (N) purchases
                        │
                        ├──< (N) coupons
                        │        │
                        │        └──< (N) coupon_usage ──> bookings
                        │
                        └──< (N) vip_subscriptions
```

## 📊 Descripción de Campos Principales

### Tabla users
- `id`: Relación 1:1 con auth.users(id)
- `email`: Dirección de correo electrónico (UNIQUE)
- `full_name`, `name`: Nombre del usuario
- `is_admin`: Si es administrador o no
- `is_korean`: Si es coreano o no

### Tabla bookings
- `user_id`: Usuario que hizo la reserva
- `consultant_id`: Consultor
- `order_id`: Número de pedido interno (UNIQUE)
- `status`: Estado de la reserva (pending, confirmed, cancelled, completed, no_show)
- `payment_status`: Estado del pago (pending, paid, failed, refunded)
- `payment_id`: ID de Orden PayPal

### Tabla payments
- `amount`: INTEGER (en centavos, ej: $1.99 = 199)
- `payment_id`: ID de Orden PayPal (UNIQUE)
- `booking_id`: Reserva relacionada (puede ser NULL)

### Tabla purchases
- `amount`: DECIMAL(10,2) (en USD, ej: 1.99)
- `product_type`: Tipo de producto (coupon, vip_subscription, booking)
- `product_data`: JSONB (información detallada del producto)
- `status`: Estado de la compra (pending, paid, failed, canceled, refunded)

### Tabla coupons
- `amount`: Cantidad de cupones (en unidades AKO)
- `used_amount`: Cantidad de cupones usados
- `type`: Tipo de cupón (video_call, consultation, ako)

## 🔒 Políticas RLS (Row Level Security)

Todas las tablas tienen RLS habilitado con las siguientes políticas:

- **Política de Usuario**: Los usuarios solo pueden ver/modificar sus propios datos
- **Política del Sistema**: El servidor puede crear/modificar datos (payments, purchases, etc.)
- **Política de Administrador**: Los administradores pueden gestionar todos los datos

## 🧪 Cómo Probar

### 1. Probar Inicio de Sesión
- Email: `test@amiko.com`
- Password: La contraseña que configuraste al crear el usuario

### 2. Probar Flujo de Pago
- Realiza un pago de prueba en el entorno PayPal Sandbox
- Verifica que se cree un registro en la tabla `purchases`

### 3. Probar Flujo de Reserva
- Crea un perfil de consultor → Crea una reserva → Realiza el pago
- Verifica la integración entre las tablas `bookings` y `payments`

## ⚠️ Precauciones

1. **Ejecución Múltiple**: El script usa `IF NOT EXISTS`, por lo que es seguro ejecutarlo varias veces.
2. **Usuario de Prueba**: El usuario de prueba debe crearse primero en Supabase Auth.
3. **Políticas RLS**: En producción, modifica las políticas RLS según sea necesario.
4. **Eliminación de Datos**: Si hay datos existentes, ten cuidado con el orden de eliminación debido a las restricciones de claves foráneas.

## 🔧 Solución de Problemas

### Error "relation already exists"
- Es normal. Significa que la tabla ya existe.
- `IF NOT EXISTS` permite continuar de forma segura.

### Error "foreign key constraint"
- Las tablas referenciadas deben crearse primero.
- El script las crea en el orden correcto, así que ejecuta el script completo desde el principio.

### Error "permission denied"
- Usa Service Role Key o verifica las políticas RLS.
- Al ejecutar desde Supabase Dashboard, se aplican automáticamente los permisos de Service Role.

## 📞 Soporte

Si encuentras problemas, verifica lo siguiente:
1. Configuración del proyecto Supabase
2. Mensajes de error en SQL Editor
3. Estado de creación de tablas (usa las consultas de verificación anteriores)

---

**Fecha de Creación**: 2024-12-19  
**Versión**: 1.0.0

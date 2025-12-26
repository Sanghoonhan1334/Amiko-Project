# Resumen de Cambios (PR: feature/payments-paypal-maria → develop)

## Nuevas Funcionalidades Principales

### 1. Configuración de Privacidad del Perfil
- **Funcionalidad de selección de privacidad para información académica/profesional**
  - Los usuarios pueden elegir si desean hacer pública su información académica (universidad, carrera, año) o información profesional (ocupación, empresa, experiencia) a otros usuarios
  - Configuración fácil mediante interruptores en la página de edición de perfil
  - La información se muestra u oculta en el perfil de otros usuarios según la configuración de privacidad
  - Archivos relacionados:
    - `src/components/main/app/me/MyTab.tsx` - UI de configuración de privacidad agregada
    - `src/components/common/UserProfileModal.tsx` - Lógica de visualización según configuración de privacidad
    - `src/app/api/profile/route.ts` - Guardado/consulta de campos de configuración de privacidad
    - `src/app/api/user/[id]/route.ts` - Retorno de información de configuración de privacidad
    - `database/add-community-notification-settings.sql` - Esquema de base de datos agregado

### 2. Sistema de Notificaciones Push
- **Notificaciones de Me Gusta (envío inmediato)**
  - Cuando se da "me gusta" a una publicación, se envía una notificación push inmediata al autor
  - Puede activarse/desactivarse en la configuración de notificaciones
  - Archivos relacionados:
    - `src/app/api/posts/[id]/reactions/route.ts` - Lógica de envío de notificaciones agregada a la API de me gusta

- **Notificaciones de Resumen Diario (cada día a las 8:30 AM hora de México)**
  - Envío diario a las 8:30 AM hora de México con resumen de nuevos me gusta y publicaciones del día anterior
  - El envío se determina según la configuración de notificaciones de cada usuario
  - Archivos relacionados:
    - `src/app/api/notifications/daily-digest/route.ts` - API de resumen diario
    - `vercel.json` - Configuración de trabajo cron (UTC 14:30 = 08:30 CST hora de México)
    - `database/add-community-notification-settings.sql` - Campos de configuración de notificaciones agregados

### 3. Mejoras en la UI de Configuración de Notificaciones
- Interruptores agregados para notificaciones de me gusta, publicaciones y resumen diario
- Sincronización en tiempo real con la base de datos
  - Archivos relacionados:
    - `src/components/main/app/me/MyTab.tsx` - UI de configuración de notificaciones agregada
    - `src/app/api/notifications/settings/route.ts` - API de configuración de notificaciones actualizada

## Correcciones de Errores y Mejoras

### 1. Correcciones Relacionadas con Autenticación
- Eliminación del requisito de "contraseña actual" al restablecer contraseña
- Cambio a método de código de verificación por correo electrónico para restablecer contraseña
- Resolución del problema de contraseña después de eliminar y recrear cuenta
  - Archivos relacionados:
    - `src/app/reset-password/page.tsx`
    - `src/app/api/auth/reset-password/confirm/route.ts`
    - `src/app/forgot-password/page.tsx`
    - `src/app/api/auth/signup/route.ts`

### 2. Mejoras en el Centro de Verificación
- Foto de perfil obligatoria y validación reforzada
- Validación de presentación personal mínima de 20 caracteres agregada
- Prevención de progreso y visualización de errores cuando los campos obligatorios no están completados
- Selector de código de país agregado (centro de verificación local)
  - Archivos relacionados:
    - `src/app/verification/page.tsx`
    - `src/app/verification-center/page.tsx`

### 3. Mejoras en la UI
- Ocultación de UI relacionada con historias (comentado para uso futuro)
- Eliminación de botones flotantes en la página del centro de verificación
- Ajuste de espaciado en el diseño de la página de perfil
  - Archivos relacionados:
    - `src/components/main/app/me/MyTab.tsx`
    - `src/components/common/ScrollToTop.tsx`
    - `src/components/common/GlobalChatButton.tsx`
    - `src/components/common/DarkModeToggle.tsx`
    - `src/components/common/PaletteSwitcher.tsx`

### 4. Mejoras en Mensajes de Error
- Corrección del mensaje de error "algunos datos no se pudieron limpiar" al eliminar cuenta
- Mejora en el manejo del error "User not found" al limpiar sesiones huérfanas
  - Archivos relacionados:
    - `src/app/api/account/route.ts`
    - `src/app/api/auth/cleanup-orphaned-session/route.ts`

### 5. Mejoras en el Servicio de Correo Electrónico
- Corrección del asunto del correo de restablecimiento de contraseña
- Separación de plantillas de correo (verificación de registro / restablecimiento de contraseña)
  - Archivos relacionados:
    - `src/lib/emailService.ts`
    - `src/app/api/verify/start/route.ts`

### 6. Mejoras en la Verificación por WhatsApp
- Activación del uso de plantillas de mensajes de WhatsApp
- Normalización y validación reforzada de códigos de país
  - Archivos relacionados:
    - `src/lib/smsService.ts`
    - `src/lib/twilioService.ts`
    - `src/app/api/verify/start/route.ts`
    - `database/fix-verification-codes-type-constraint.sql`

## Cambios en la Base de Datos

### 1. Extensión de la Tabla de Configuración de Notificaciones
- Agregados los siguientes campos a la tabla `notification_settings`:
  - `like_notifications_enabled` (BOOLEAN, valor por defecto: TRUE)
  - `post_notifications_enabled` (BOOLEAN, valor por defecto: TRUE)
  - `daily_digest_enabled` (BOOLEAN, valor por defecto: TRUE)
  - `daily_digest_time` (TIME, valor por defecto: '08:30:00')
  - Archivos relacionados:
    - `database/add-community-notification-settings.sql`

### 2. Campos de Configuración de Privacidad del Perfil Agregados
- Agregados los siguientes campos a la tabla `users`:
  - `academic_info_public` (BOOLEAN, valor por defecto: FALSE)
  - `job_info_public` (BOOLEAN, valor por defecto: FALSE)
  - Archivos relacionados:
    - `database/add-community-notification-settings.sql` (Nota: el esquema real se agregó por separado)

### 3. Extensión del Tipo de Código de Verificación
- Agregado 'wa' (WhatsApp) a la columna `type` de la tabla `verification_codes`
  - Archivos relacionados:
    - `database/fix-verification-codes-type-constraint.sql`

## Cambios en la API

### 1. API de Perfil
- `GET /api/profile` - Retorno de información de configuración de privacidad agregado
- `POST /api/profile` - Soporte para guardar campos de configuración de privacidad
- `GET /api/user/[id]` - Retorno de información de configuración de privacidad agregado

### 2. API de Notificaciones
- `POST /api/notifications/send-push` - Uso de API existente
- `GET /api/notifications/daily-digest` - Nueva API de resumen diario agregada
- `PUT /api/notifications/settings` - Soporte para campos de configuración de notificaciones de comunidad agregado

### 3. API de Me Gusta
- `POST /api/posts/[id]/reactions` - Lógica de envío de notificaciones agregada al agregar me gusta

## Configuración del Entorno

### 1. Trabajo Cron de Vercel
- Envío de notificaciones de resumen diario todos los días a las 14:30 UTC (08:30 CST hora de México)
  - Archivos relacionados:
    - `vercel.json`

### 2. Variables de Entorno (Opcional)
- `CRON_SECRET` - Clave secreta para seguridad del trabajo cron

## Elementos Necesarios para Migración

**Nota:** Los cambios de base de datos ya fueron aplicados. Los siguientes scripts SQL fueron ejecutados previamente:
- `database/add-community-notification-settings.sql` ✅
- `database/fix-verification-codes-type-constraint.sql` ✅

## Recomendaciones para Pruebas

1. Verificar el funcionamiento del interruptor de configuración de privacidad del perfil
2. Verificar el envío inmediato de notificaciones de me gusta
3. Verificar el funcionamiento del trabajo cron de notificaciones de resumen diario (se puede llamar manualmente para pruebas)
4. Verificar el guardado/carga de configuración de notificaciones
5. Verificar el flujo de restablecimiento de contraseña

## Scripts de Utilidad para Tokens FCM

Para generar el apk debug
1. npm run build
2. npx cap sync android
3. npx cap run android
4. Ver logcat adb logcat -v time | grep -Ei "Capacitor|Firebase|FCM|Push|WebView|ERROR|WARN|token|supabase|CAPACITOR_SERVER_URL" 
5. Verificar token en base de datos
SELECT native_token, endpoint, updated_at
FROM public.push_subscriptions
--WHERE user_id = 'b82eb2f2-4074-4717-91d7-1da71e9b48ba'
ORDER BY updated_at DESC
LIMIT 5;
6. Prueba para el push notification FCM_SERVICE_ACCOUNT_JSON_PATH=./service-account-clean.json node scripts/send-fcm.js --token="d9XvOLFXTDWNNNESapMVe9:APA91bEuzScJKxyvo1qW9sn67KckZxNL4m6w3JV7PDVLi-4FS3IXRL0Iq72Rj-2-8LKFcBoRLshYH44XXuv6d76dUAAyaCGQQnFSr6SGfRoyH1IUcgLNa10" --title="아니온 하세이오" --body="배경 조사"
7. Se ha creado un archivo que localiza el id del usuario que desees y envia la prueba
node scripts/get-user-token.js domgarmining@gmail.com
8. Test node scripts/test-push-api.js

## Scripts de Utilidad para Tokens FCM

### Verificar tokens de un usuario:
```bash
node scripts/check-tokens.js --user-id="b82eb2f2-4074-4717-91d7-1da71e9b48ba"
```

### Limpiar tokens antiguos (mantener solo el más reciente):
```bash
node scripts/clean-tokens.js --user-id="b82eb2f2-4074-4717-91d7-1da71e9b48ba"
```

### Limpieza periódica de tokens huérfanos (para todos los usuarios):
```bash
npm run cleanup:tokens
# o
node scripts/cleanup-orphaned-tokens.js
```

### Probar notificaciones push de comentarios:
```bash
npm run test:comment-push -- --post-id="POST_ID" --user-id="USER_ID" --token="AUTH_TOKEN"
# o
node scripts/test-comment-push.js --post-id="POST_ID" --user-id="USER_ID" --token="AUTH_TOKEN"
```

### Encontrar datos de prueba (posts y usuarios):
```bash
npm run find:test-data
# o
node scripts/find-test-data.js
```

**Ejemplo de uso:**
```bash
# 1. Obtener un token de autenticación (desde el navegador o app)
# 2. Encontrar IDs de posts y usuarios en la base de datos
# 3. Ejecutar el test
npm run test:comment-push -- --post-id="123e4567-e89b-12d3-a456-426614174000" --user-id="b82eb2f2-4074-4717-91d7-1da71e9b48ba" --token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Para obtener un token de autenticación:**
1. Inicia sesión en la app/web
2. Abre las herramientas de desarrollo del navegador
3. Ve a Application/Storage > Local Storage
4. Busca la clave `supabase.auth.token`
5. Copia el valor del token JWT

## Sistema Automático de Limpieza de Tokens

### ✅ Limpieza Automática Activada

El sistema ahora limpia automáticamente los tokens antiguos cuando:

1. **Registro de nuevo token**: Al registrar un nuevo token FCM (después de reinstalar la app), automáticamente elimina todos los tokens anteriores del usuario
2. **Error FCM "UNREGISTERED"**: Cuando FCM devuelve "UNREGISTERED", elimina todos los tokens del usuario
3. **Aplicación tanto nativa como web**: Funciona para tokens nativos (Android/iOS) y suscripciones web push

### 🔄 Flujo Automático:

```
Usuario desinstala app → FCM marca tokens como "UNREGISTERED"
↓
Usuario reinstala app → App obtiene nuevo token
↓
Usuario hace login → Nuevo token se registra automáticamente
↓
Sistema detecta tokens antiguos → Elimina automáticamente tokens viejos
↓
Base de datos queda limpia con solo el token válido
```

### ⏰ Limpieza Periódica (Opcional)

Para una limpieza adicional, puedes ejecutar el script de limpieza periódica:

```bash
# Ejecutar manualmente
npm run cleanup:tokens

# O configurar como cron job (ejecutar diariamente a las 2 AM)
0 2 * * * cd /path/to/project && npm run cleanup:tokens
```

Este script revisa todos los usuarios y mantiene solo el token más reciente para cada uno.

## Cómo Funciona:
### Al enviar una notificación push:
- El sistema intenta enviar a todos los tokens almacenados del usuario
- Si FCM devuelve "UNREGISTERED" para cualquier token, significa que la app fue desinstalada o el token es inválido
- El sistema elimina automáticamente TODOS los tokens del usuario

### Cuando la app es reinstalada:
- La app obtiene un nuevo token FCM
- El listener de registro en push-notifications.ts envía el nuevo token a /api/notifications/subscribe
- La API de subscribe hace upsert del nuevo token

### Actualización de tokens:
- FCM actualiza periódicamente los tokens
- La app recibe nuevos tokens a través del listener de registro
- Los nuevos tokens se registran automáticamente en el servidor

## ✅ Notificaciones Push Implementadas

### 1. **Comentarios en posts** ✅
- **API**: `POST /api/posts/[id]/comments`
- **Tipo**: `comment`
- **Mensaje**: `"{Usuario} comentó en tu post '{Título}'"`
- **Funciona**: Cuando alguien comenta en tu post

### 2. **Likes en posts** ✅
- **API**: `POST /api/posts/[id]/reactions`
- **Tipo**: `like`
- **Mensaje**: `"{Usuario} dio like a tu post '{Título}'"`
- **Funciona**: Cuando alguien da like a tu post

### 3. **Nueva noticia publicada** ✅
- **API**: `POST /api/news`
- **Tipo**: `new_news`
- **Mensaje**: `"Nueva noticia: '{Título}'"`
- **Funciona**: Cuando el administrador publica una nueva noticia (todos los usuarios reciben la notificación)

### 4. **Cuando se publica un nuevo post en el tablón** ✅
- **API**: `POST /api/posts`
- **Tipo**: `new_post`
- **Mensaje**: `"Nuevo post: '{Título}'"`
- **Funciona**: Cuando se publica un nuevo post en el tablón (todos los usuarios con notificaciones de posts activadas reciben la notificación)

### 5. **Próximas implementaciones:**
- ❌ **Comentarios en historias**
- ❌ **Likes en historias**
- ❌ **Nuevos seguidores**
- ❌ **Menciones**
- ❌ **Mensajes directos**


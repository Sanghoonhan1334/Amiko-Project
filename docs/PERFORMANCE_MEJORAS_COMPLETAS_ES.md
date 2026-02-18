# Informe Completo de Mejoras de Rendimiento (ES)

**Proyecto:** Amiko  
**Fecha:** 2026-02-17  
**Objetivo:** Reducir latencia percibida, eliminar polling excesivo, priorizar Realtime y optimizar carga de imágenes/datos.

---

## 1) Resumen Ejecutivo

Se aplicó una optimización integral en frontend + backend + SQL para mejorar la velocidad de respuesta del producto.

### Resultados clave
- Se redujo drásticamente el polling innecesario en componentes críticos.
- Se migró tiempo real de suscripción clásica a **Broadcast por topics** en Supabase Realtime.
- Chat y notificaciones quedaron en esquema **Realtime-first con fallback**.
- Se añadió caché de conversión de URLs de imágenes para evitar trabajo repetido por render.
- Se creó migración SQL robusta para normalizar rutas de imágenes a URLs completas, tolerando diferencias de esquema entre entornos.
- Se redujo trabajo en cliente en layout global (se eliminó script pesado de mutación del `<head>`).

---

## 2) Problemas Detectados Inicialmente

1. **Polling agresivo** en varios puntos de la app (intervalos de 1s, 5s, 10s, etc.).
2. **Consumo de red alto** por refrescos frecuentes de datos no críticos.
3. **Realtime subutilizado** o no aplicado de forma uniforme.
4. **Conversión de rutas de imagen en tiempo de render** repetida muchas veces.
5. **Lógica de notificaciones** que pedía payload completo cuando solo se requería contador.

---

## 3) Mejoras Implementadas (Detalle)

## 3.1 Realtime y Chat

### A) Migración a topics privados de Broadcast
Se implementó infraestructura SQL de Realtime basada en topics:
- `room:<room_id>:messages`
- `room:<room_id>:participants`
- `user:<user_id>:notifications`

Archivo SQL:
- [database/enable-realtime-topic-broadcast.sql](database/enable-realtime-topic-broadcast.sql)

Incluye:
- Policies RLS sobre `realtime.messages` para restringir suscripción/publicación por usuario/sala.
- Triggers de broadcast para `chat_messages`, `chat_room_participants`, `notifications`.

### B) Chat en modo Realtime-first
Archivo:
- [src/components/main/app/community/ChatRoomClient.tsx](src/components/main/app/community/ChatRoomClient.tsx)

Cambios aplicados:
- Realtime habilitado por defecto.
- Suscripción por topic privado de sala (`room:<id>:messages`).
- Fallback a polling solo cuando corresponde (error o usuario no autenticado).
- Intervalo de fallback optimizado (más bajo costo).

### C) Estabilización y UX de Chat (Actualización Feb-2026)

Archivos clave:
- [src/components/main/app/community/ChatRoomClient.tsx](src/components/main/app/community/ChatRoomClient.tsx)
- [src/components/common/GlobalChatButton.tsx](src/components/common/GlobalChatButton.tsx)

Mejoras aplicadas:
- **Eliminación de errores 400/406 en perfiles de chat**:
	- Se removieron columnas no válidas en consultas de `user_profiles`.
	- Se reemplazó `.single()` por `.maybeSingle()` en lecturas opcionales (perfil/puntos) para evitar ruido cuando no existe fila.
- **Cache de mensajes por sala**:
	- Cache persistente en `localStorage` (con fallback a `sessionStorage`).
	- TTL extendido para mejorar experiencia de reingreso sin recargar historial completo.
	- Persistencia de cursor por sala para carga incremental eficiente.
- **Carga incremental real (no full reload)**:
	- Carga inicial limitada a los **últimos 20 mensajes**.
	- Refresco y polling orientados a traer solo mensajes nuevos (delta), no toda la conversación.
- **Lazy load de historial al subir**:
	- Al acercarse al tope del scroll, se cargan 20 mensajes anteriores.
	- Se conserva la posición visual de scroll para evitar “saltos” de interfaz.
	- Se añadieron flags de control para evitar múltiples cargas simultáneas.
- **Mejora de descubribilidad de historial**:
	- Botón con ícono de flecha hacia arriba para “Ver mensajes anteriores”.
	- Loader visible durante la carga de mensajes antiguos.
	- Mensaje de estado al llegar al inicio del historial.
- **Fix de cierre del chat (`X`)**:
	- El cierre ahora es inmediato (UX responsive).
	- La actualización de estado de lectura se ejecuta en background y ya no bloquea el cierre.

---

## 3.2 Notificaciones

Archivo:
- [src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx)

Cambios aplicados:
- Integración Realtime por topic privado de usuario.
- Reemplazo de lógica pesada para contador por endpoint liviano de unread count con filtro por tipo.

Archivo API:
- [src/app/api/notifications/unread-count/route.ts](src/app/api/notifications/unread-count/route.ts)

Cambios aplicados:
- Soporte de query `types` para contar solo tipos relevantes sin descargar lista completa.

---

## 3.3 Polling y Frecuencia de Refresco

### Ajustes principales
- Header: chequeo de verificación reducido de alta frecuencia a intervalo largo.
- Hero: eliminado polling de modo oscuro; quedó observación reactiva por `MutationObserver`.
- Community tests: refresco periódico reducido a 5 minutos.
- Fortune quiz: refresco de participantes reducido (10s -> 60s) manteniendo refresh por foco.

Archivos representativos:
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
- [src/components/landing/Hero.tsx](src/components/landing/Hero.tsx)
- [src/app/community/tests/page.tsx](src/app/community/tests/page.tsx)
- [src/app/quiz/fortune/page.tsx](src/app/quiz/fortune/page.tsx)

---

## 3.4 React Query y Caching de Datos

Archivo:
- [src/hooks/useUnreadCounts.ts](src/hooks/useUnreadCounts.ts)

Cambios aplicados:
- Se desactivó auto-refetch periódico para evitar tráfico innecesario.
- Se aumentó `staleTime` para favorecer cache-hit.
- Se eliminó uso forzado de `no-store` donde no era necesario.

---

## 3.5 Optimización de Imágenes

### A) Caché de URL pública en cliente
Se agregó cache en memoria para evitar convertir repetidamente rutas de Storage a URL pública.

Archivos:
- [src/components/main/app/community/ChatRoomClient.tsx](src/components/main/app/community/ChatRoomClient.tsx)
- [src/components/main/app/community/FreeBoardList.tsx](src/components/main/app/community/FreeBoardList.tsx)

### B) Normalización de rutas a URLs completas en BD
Archivo:
- [database/migrate-image-urls-to-full-paths.sql](database/migrate-image-urls-to-full-paths.sql)

Qué hace:
- Convierte rutas relativas a URLs completas en tablas de usuario/chat/contenido.
- Respeta URLs ya completas.
- Maneja variantes de esquema (`ARRAY` vs `jsonb`) y tablas opcionales inexistentes sin romper ejecución.
- Incluye queries de verificación.

---

## 3.6 Layout Global y Trabajo en Cliente

Archivo:
- [src/app/layout.tsx](src/app/layout.tsx)

Cambio aplicado:
- Se eliminó script runtime que mutaba meta tags/favicon de forma masiva tras hidratar.

Beneficio:
- Menos trabajo en main thread durante carga inicial.
- Menor costo en navegación/rehidratación.

---

## 4) Estimación de Impacto

Impacto esperado (aproximado, según patrón de uso real):
- **Reducción de llamadas redundantes**: alta (especialmente en chat/notifications/tests/fortune).
- **Mejora de latencia percibida**: alta en chat y notificaciones (actualización inmediata por Realtime).
- **Menor uso de CPU en cliente**: medio-alto (menos polling + menos mutaciones runtime + menos conversiones repetidas).
- **Menor payload de notificaciones**: alto (contador por endpoint dedicado filtrado).

---

## 5) Scripts SQL Entregados

1. Realtime por topics:
- [database/enable-realtime-topic-broadcast.sql](database/enable-realtime-topic-broadcast.sql)

2. Migración de imágenes a URL completa (robusta multi-esquema):
- [database/migrate-image-urls-to-full-paths.sql](database/migrate-image-urls-to-full-paths.sql)

---

## 6) Validaciones y Estado

Validado en código:
- Integración de Realtime en chat y notificaciones.
- Endpoint de unread count con filtro por tipos.
- Reducción de intervalos críticos.
- Caché de URL de imagen en componentes de alto tráfico.
- Chat con carga inicial paginada (20), lazy-load hacia arriba y cache persistente por sala.
- Eliminación de errores de red ruidosos en lectura de perfiles (`400/406`) dentro del flujo de chat.
- Cierre de modal de chat con respuesta inmediata en botón `X`.

Observaciones:
- Existen advertencias/lints no relacionadas (fuera de alcance de esta optimización puntual), principalmente por uso de `<img>` en varias pantallas y algunos warnings preexistentes.

---

## 7) Recomendaciones de Siguiente Iteración (Prioridad)

### Prioridad Alta
1. Migrar imágenes above-the-fold de páginas principales a `next/image` (Home/Header/Chat/Stories primero).
2. Consolidar endpoints de unread para chat+notifications en un endpoint agregado (una sola llamada).
3. Revisar consultas de quiz/feeds con patrón repetitivo para batch o memoización adicional.

### Prioridad Media
4. Instrumentar métricas de rendimiento (TTFB, LCP, INP, número de requests por vista).
5. Añadir budget de performance en CI (límite de bundle y alertas de regresión).

### Prioridad Baja
6. Refinar cargas de fuentes para evitar advertencias de custom fonts y asegurar estrategia consistente.

---

## 8) Checklist de Deploy / Go-Live

- [x] Ejecutar SQL de Realtime en Supabase.
- [x] Ejecutar SQL de migración de imágenes.
- [ ] Verificar en consola estado `SUBSCRIBED` para topics privados.
- [ ] Probar chat en tiempo real entre dos usuarios.
- [x] Verificar carga inicial de chat con límite (20 mensajes) sin recarga total.
- [x] Verificar lazy-load al subir scroll (carga incremental de historial).
- [x] Verificar cierre inmediato del chat desde botón `X`.
- [ ] Probar badge de notificaciones (alta, lectura individual, lectura global).
- [ ] Medir requests/min antes y después en entorno real.

---

## 9) Nota para Cliente (No técnica)

Se optimizó el sistema para que dependa menos de “consultas repetidas” y más de “actualizaciones instantáneas”. Esto reduce espera, consumo de datos y carga del navegador, mejorando la respuesta percibida en chat, notificaciones y pantallas comunitarias.

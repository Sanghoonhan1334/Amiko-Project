# Documentos de Tareas para María

Este folder contiene las solicitudes de trabajo y documentos relacionados para María.

## 📋 Solicitudes de Trabajo

1. **Política + UI de "Acepto"** (hasta diciembre)
2. **Sistema de pago + crear pestaña de clases en comunidad**

---

## 📁 Lista de Documentos

### 1. Análisis y Solicitudes de Trabajo
- **`MARIA_TASK_ANALYSIS.md`** - Análisis y respuestas de solicitudes de trabajo para María
  - Sistema de pago de consulta 1:1 por videollamada (Fase 2)
  - Aula de comunidad + sistema de pago (Fase 1)
  - Prioridades y orden de trabajo

### 2. Propuesta de Plataforma de Clases
- **`LECTURE_PLATFORM_PROPOSAL.md`** - Propuesta de integración de plataforma de clases
  - Método híbrido (nuestro sitio + Zoom)
  - Método de implementación y esquema de base de datos
  - Flujo de UI

### 3. Guía de Integración de Zoom
- **`ZOOM_INTEGRATION.md`** - Guía de integración de Zoom
  - Método de enlace simple (recomendado)
  - Generación automática con Zoom API (opcional)
  - Ejemplos de código de implementación

### 4. Esquema del Sistema de Pago PayPal
- **`paypal-payment-schema.sql`** - Script de creación de esquema completo
- **`PAYPAL_SCHEMA_GUIDE.md`** - Documento de guía detallada
- **`PAYPAL_SCHEMA_SUMMARY.md`** - Documento de resumen
- **`paypal-test-data.sql`** - Script de inserción de datos de prueba

---

## 🚀 Inicio Rápido

### 1. Crear Esquema de Base de Datos
```bash
# Ejecutar en Supabase Dashboard > SQL Editor
paypal-payment-schema.sql
```

### 2. Insertar Datos de Prueba (Opcional)
```bash
# Ejecutar en Supabase Dashboard > SQL Editor
paypal-test-data.sql
```

### 3. Orden de Trabajo
1. **Fase 1 (hasta diciembre - urgente)**
   - Política + UI de "Acepto"
   - Aula de comunidad + sistema de pago

2. **Fase 2 (después de completar UI de videollamada - después de finales de enero)**
   - Conexión de pago PayPal para consulta 1:1 por videollamada
   - Nota: El usuario está desarrollando directamente con Agora (previsto completar a finales de enero)

---

## 📝 Archivos de Referencia

Referencia de código existente:
- `src/app/call/[meetingId]/page.tsx` - Página de participación de Google Meet (referencia para Zoom)
- `src/app/payments/checkout/page.tsx` - Página de pago
- `src/components/payments/PayPalPaymentButton.tsx` - Botón de pago PayPal
- `src/components/main/app/community/CommunityTab.tsx` - Pestaña de comunidad

---

**Fecha de creación:** 2025-12-09

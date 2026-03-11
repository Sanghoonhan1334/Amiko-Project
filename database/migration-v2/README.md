# Migration V2 — Scripts para producción

Scripts SQL que deben ejecutarse en **Supabase producción** para sincronizar con los cambios de desarrollo.

## Orden de ejecución

| # | Archivo | Descripción |
|---|---------|-------------|
| 001 | `001-fix-vc-rls-security.sql` | Corrige RLS peligrosos en `vc_paypal_orders` y `vc_bookings` + CHECK constraints en `duration_minutes` |

## Instrucciones

1. Ejecutar los scripts **en orden numérico** en la consola SQL de Supabase (producción).
2. Cada script es idempotente (usa `IF NOT EXISTS`, `DROP IF EXISTS`).
3. Verificar que no haya errores antes de pasar al siguiente.

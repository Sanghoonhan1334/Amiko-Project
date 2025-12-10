-- =====================================================
-- Datos de Prueba del Sistema de Pago PayPal
-- Amiko Project - Test Data for PayPal Payment System
-- Date: 2025-12-09
-- =====================================================
-- 
-- Nota: Este script es para pruebas.
-- Deben existir usuarios y reservas reales para que funcione correctamente.
-- =====================================================

-- =====================================================
-- 1. Verificar/Crear Usuario de Prueba
-- =====================================================
-- Nota: Primero se debe crear el usuario en Supabase Auth.
-- Este script solo agrega datos a la tabla public.users.

-- Verificar usuario de prueba
DO $$
DECLARE
    test_user_id UUID;
BEGIN

    SELECT id INTO test_user_id 
    FROM public.users 
    WHERE email = 'test@amiko.com'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️  No hay usuario de prueba.';
        RAISE NOTICE 'Primero cree el usuario en Supabase Auth y agregue el perfil a public.users.';
        RAISE NOTICE 'O modifique la declaración INSERT a continuación para usar un user_id real.';
    ELSE
        RAISE NOTICE '✅ Usuario de prueba encontrado: %', test_user_id;
    END IF;
END $$;

-- =====================================================
-- 2. Crear Consultor de Prueba (Opcional)
-- =====================================================

INSERT INTO public.consultants (
    user_id,
    name,
    specialty,
    description,
    hourly_rate,
    currency,
    languages,
    is_active
)
SELECT 
    (SELECT id FROM public.users LIMIT 1), -- Configurar el primer usuario como consultor
    'Consultor de Prueba',
    'Educación de Coreano',
    'Perfil de consultor para pruebas.',
    50.00,
    'USD',
    ARRAY['Korean', 'English'],
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.consultants WHERE name = 'Consultor de Prueba'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Crear Reserva de Prueba
-- =====================================================

INSERT INTO public.bookings (
    user_id,
    consultant_id,
    order_id,
    topic,
    description,
    start_at,
    end_at,
    duration,
    price,
    currency,
    status,
    payment_status,
    payment_method
)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.consultants LIMIT 1),
    'order-test-001',
    'Reserva de Consulta de Prueba',
    'Reserva para prueba de pago PayPal.',
    NOW() + INTERVAL '1 day', -- Mañana
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour', -- Mañana + 1 hora
    60, -- 60 minutos
    50.00, -- $50
    'USD',
    'pending',
    'pending',
    'paypal'
WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings WHERE order_id = 'order-test-001'
)
RETURNING id, order_id;

-- =====================================================
-- 4. Crear Registro de Pago de Prueba
-- =====================================================

INSERT INTO public.payments (
    order_id,
    payment_id,
    user_id,
    booking_id,
    amount,
    currency,
    status,
    payment_method,
    paypal_data
)
SELECT 
    'order-test-001',
    'PAYPAL-TEST-001',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.bookings WHERE order_id = 'order-test-001' LIMIT 1),
    5000, -- $50.00 (en centavos)
    'USD',
    'completed',
    'paypal',
    jsonb_build_object(
        'id', 'PAYPAL-TEST-001',
        'status', 'COMPLETED',
        'purchase_units', jsonb_build_array(
            jsonb_build_object(
                'reference_id', 'order-test-001',
                'amount', jsonb_build_object(
                    'currency_code', 'USD',
                    'value', '50.00'
                ),
                'payments', jsonb_build_object(
                    'captures', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'CAPTURE-TEST-001',
                            'status', 'COMPLETED',
                            'amount', jsonb_build_object(
                                'currency_code', 'USD',
                                'value', '50.00'
                            )
                        )
                    )
                )
            )
        ),
        'create_time', NOW()::text,
        'update_time', NOW()::text
    )
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE payment_id = 'PAYPAL-TEST-001'
)
RETURNING id, order_id, payment_id, status;

-- =====================================================
-- 5. Crear Registro de Compra de Prueba (Compra de Cupón)
-- =====================================================

INSERT INTO public.purchases (
    user_id,
    provider,
    payment_id,
    order_id,
    amount,
    currency,
    country,
    status,
    product_type,
    product_data,
    paypal_data
)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    'paypal',
    'PAYPAL-PURCHASE-TEST-001',
    'order-coupon-test-001',
    1.99, -- $1.99 (cupón de 20 minutos)
    'USD',
    'US',
    'paid',
    'coupon',
    jsonb_build_object(
        'coupon_minutes', 20,
        'coupon_count', 1
    ),
    jsonb_build_object(
        'id', 'PAYPAL-PURCHASE-TEST-001',
        'status', 'COMPLETED',
        'purchase_units', jsonb_build_array(
            jsonb_build_object(
                'reference_id', 'order-coupon-test-001',
                'amount', jsonb_build_object(
                    'currency_code', 'USD',
                    'value', '1.99'
                )
            )
        )
    )
WHERE NOT EXISTS (
    SELECT 1 FROM public.purchases WHERE payment_id = 'PAYPAL-PURCHASE-TEST-001'
)
RETURNING id, order_id, payment_id, status, product_type;

-- =====================================================
-- 6. Consultas de Verificación de Datos
-- =====================================================

-- Verificar datos creados
DO $$
DECLARE
    user_count INTEGER;
    booking_count INTEGER;
    payment_count INTEGER;
    purchase_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO booking_count FROM public.bookings;
    SELECT COUNT(*) INTO payment_count FROM public.payments;
    SELECT COUNT(*) INTO purchase_count FROM public.purchases;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación de Datos de Prueba';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Número de usuarios: %', user_count;
    RAISE NOTICE 'Número de reservas: %', booking_count;
    RAISE NOTICE 'Número de registros de pago: %', payment_count;
    RAISE NOTICE 'Número de registros de compra: %', purchase_count;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 7. Consultas de Muestra (Para Referencia)
-- =====================================================


-- SELECT 
--     p.id as payment_id,
--     p.order_id,
--     p.payment_id as paypal_order_id,
--     p.amount
--     p.status,
--     p.created_at,
--     b.topic,
--     b.start_at,
--     u.email as user_email
-- FROM public.payments p
-- LEFT JOIN public.bookings b ON p.booking_id = b.id
-- LEFT JOIN public.users u ON p.user_id = u.id
-- ORDER BY p.created_at DESC
-- LIMIT 10;


-- SELECT 
--     p.id,
--     p.order_id,
--     p.payment_id,
--     p.amount,
--     p.status,
--     p.product_type,
--     p.product_data,
--     u.email
-- FROM public.purchases p
-- LEFT JOIN public.users u ON p.user_id = u.id
-- ORDER BY p.created_at DESC
-- LIMIT 10;

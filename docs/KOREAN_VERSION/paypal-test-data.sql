

DO $$
DECLARE
    test_user_id UUID;
BEGIN

    SELECT id INTO test_user_id 
    FROM public.users 
    WHERE email = 'test@amiko.com'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️  No hay usuario de prueba. / 테스트 사용자가 없습니다.';
        RAISE NOTICE 'Primero cree el usuario en Supabase Auth y agregue el perfil a public.users. / 먼저 Supabase Auth에서 사용자를 생성하고 public.users에 프로필을 추가하세요.';
        RAISE NOTICE '또는 아래 INSERT 문을 수정하여 실제 user_id를 사용하세요.';
    ELSE
        RAISE NOTICE '✅ Usuario de prueba encontrado: % / 테스트 사용자 발견: %', test_user_id;
    END IF;
END $$;


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
    (SELECT id FROM public.users LIMIT 1), -- 첫 번째 사용자를 상담사로 설정
    '테스트 상담사',
    '한국어 교육',
    '테스트용 상담사 프로필입니다.',
    50.00,
    'USD',
    ARRAY['Korean', 'English'],
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.consultants WHERE name = '테스트 상담사'
)
ON CONFLICT DO NOTHING;


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
    '테스트 상담 예약',
    'PayPal 결제 테스트를 위한 예약입니다.',
    NOW() + INTERVAL '1 day', -- 내일
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour', -- 내일 + 1시간
    60, -- 60분
    50.00, -- $50
    'USD',
    'pending',
    'pending',
    'paypal'
WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings WHERE order_id = 'order-test-001'
)
RETURNING id, order_id;


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
    5000, -- $50.00 (센트 단위)
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
    1.99, -- $1.99 (20분 쿠폰)
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
    RAISE NOTICE '테스트 데이터 확인';
    RAISE NOTICE '========================================';
    RAISE NOTICE '사용자 수: %', user_count;
    RAISE NOTICE '예약 수: %', booking_count;
    RAISE NOTICE '결제 기록 수: %', payment_count;
    RAISE NOTICE '구매 기록 수: %', purchase_count;
    RAISE NOTICE '========================================';
END $$;






-- =====================================================
-- Script de Inicialización de Supabase para el Proyecto AMIKO
-- =====================================================
-- Este script puede ejecutarse de una vez en Supabase Console > SQL Editor.
-- 
-- Tablas que se crearán:
-- 1. users (extensión de auth.users)
-- 2. consultants (consultores)
-- 3. bookings (reservas)
-- 4. payments (registros de pagos PayPal)
-- 5. purchases (registros de compras: cupones, suscripciones VIP, etc.)
-- 6. coupons (cupones)
-- 7. vip_subscriptions (suscripciones VIP)
-- 8. vip_features (funciones VIP)
--
-- Cómo ejecutar:
-- 1. Accede a Supabase Dashboard > SQL Editor
-- 2. Copia y pega todo el contenido de este archivo
-- 3. Haz clic en el botón "Run"
-- =====================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Tabla de Usuarios (Users Table) - Extensión de auth.users
-- =====================================================
-- Tabla de perfiles de usuario relacionada 1:1 con auth.users(id)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    one_line_intro TEXT,
    language TEXT DEFAULT 'ko',
    is_admin BOOLEAN DEFAULT FALSE,
    is_korean BOOLEAN DEFAULT FALSE,
    main_profile_image TEXT,
    profile_image TEXT,
    profile_images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. Tabla de Consultores (Consultants Table)
-- =====================================================
-- Tabla que almacena información de consultores
-- Relación 1:N con users (un usuario puede tener múltiples perfiles de consultor)
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    languages TEXT[] DEFAULT ARRAY['English'],
    availability JSONB DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Tabla de Reservas (Bookings Table)
-- =====================================================
-- Tabla que almacena información de reservas de consultas
-- Conectada con users y consultants para gestionar reservas
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
    order_id TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    payment_id TEXT,
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. Tabla de Pagos (Payments Table)
-- =====================================================
-- Tabla que almacena registros de pagos PayPal
-- Conectada con bookings para rastrear pagos de reservas
-- amount se almacena como INTEGER (en centavos)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    paypal_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. Tabla de Compras (Purchases Table)
-- =====================================================
-- Tabla que almacena registros de compras de productos (cupones, suscripciones VIP, etc.)
-- Gestionada por separado de payments para soportar diversos flujos de pago
-- amount se almacena como DECIMAL (en USD)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'toss', 'stripe')),
    payment_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
    product_type TEXT NOT NULL CHECK (product_type IN ('coupon', 'vip_subscription', 'booking')),
    product_data JSONB DEFAULT '{}',
    paypal_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. Tabla de Cupones (Coupons Table)
-- =====================================================
-- Tabla que gestiona cupones AKO
-- Integrada con purchases para crear cupones al comprar
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video_call', 'consultation', 'ako')),
    amount INTEGER NOT NULL,
    used_amount INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'gift', 'promotion', 'admin', 'event')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. Tabla de Uso de Cupones (Coupon Usage Table)
-- =====================================================
-- Tabla que rastrea el historial de uso de cupones
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount_used INTEGER NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. Tabla de Suscripciones VIP (VIP Subscriptions Table)
-- =====================================================
-- Tabla que almacena información de suscripciones VIP
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method TEXT CHECK (payment_method IN ('paypal', 'stripe', 'coupon', 'admin')),
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    features JSONB DEFAULT '{}',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. Tabla de Funciones VIP (VIP Features Table)
-- =====================================================
-- Lista de funciones disponibles para suscriptores VIP
CREATE TABLE IF NOT EXISTS public.vip_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Creación de Índices
-- =====================================================

-- Índices de users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Índices de consultants
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_specialty ON public.consultants(specialty);
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);
CREATE INDEX IF NOT EXISTS idx_consultants_languages ON public.consultants USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_consultants_availability ON public.consultants USING GIN(availability);

-- Índices de bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);

-- Índices de payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);

-- Índices de purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON public.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON public.purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON public.purchases(provider);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- Índices de coupons
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_user_active ON public.coupons(user_id, is_active);

-- Índices de coupon_usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_booking_id ON public.coupon_usage(booking_id);

-- Índices de vip_subscriptions
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON public.vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_plan_type ON public.vip_subscriptions(plan_type);

-- =====================================================
-- Función y Triggers para actualización automática de updated_at
-- =====================================================

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a cada tabla
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultants_updated_at ON public.consultants;
CREATE TRIGGER update_consultants_updated_at 
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vip_subscriptions_updated_at ON public.vip_subscriptions;
CREATE TRIGGER update_vip_subscriptions_updated_at 
    BEFORE UPDATE ON public.vip_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Habilitar RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_features ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Creación de Políticas RLS
-- =====================================================

-- Políticas de users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- Políticas de consultants
DROP POLICY IF EXISTS "Anyone can view active consultants" ON public.consultants;
CREATE POLICY "Anyone can view active consultants" ON public.consultants
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Consultants can view own profile" ON public.consultants;
CREATE POLICY "Consultants can view own profile" ON public.consultants
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultants can update own profile" ON public.consultants;
CREATE POLICY "Consultants can update own profile" ON public.consultants
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create consultant profile" ON public.consultants;
CREATE POLICY "Users can create consultant profile" ON public.consultants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas de bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "System can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE USING (true);

-- Políticas de purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create purchases" ON public.purchases;
CREATE POLICY "System can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.purchases;
CREATE POLICY "System can update purchases" ON public.purchases
    FOR UPDATE USING (true);

-- Políticas de coupons
DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
CREATE POLICY "Users can view own coupons" ON public.coupons
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create coupons" ON public.coupons;
CREATE POLICY "System can create coupons" ON public.coupons
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update coupons" ON public.coupons;
CREATE POLICY "System can update coupons" ON public.coupons
    FOR UPDATE USING (true);

-- Políticas de coupon_usage
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create coupon usage" ON public.coupon_usage;
CREATE POLICY "System can create coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (true);

-- Políticas de vip_subscriptions
DROP POLICY IF EXISTS "Users can view own vip subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can view own vip subscriptions" ON public.vip_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own vip subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can create own vip subscriptions" ON public.vip_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas de vip_features
DROP POLICY IF EXISTS "Anyone can view vip features" ON public.vip_features;
CREATE POLICY "Anyone can view vip features" ON public.vip_features
    FOR SELECT USING (is_active = true);

-- Políticas de administrador (aplicadas a todas las tablas)
DO $$
BEGIN
    -- Política de administrador para bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'bookings' 
        AND policyname = 'Admins can manage all bookings'
    ) THEN
        CREATE POLICY "Admins can manage all bookings" ON public.bookings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- Política de administrador para payments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'payments' 
        AND policyname = 'Admins can manage all payments'
    ) THEN
        CREATE POLICY "Admins can manage all payments" ON public.payments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- Política de administrador para purchases
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'purchases' 
        AND policyname = 'Admins can manage all purchases'
    ) THEN
        CREATE POLICY "Admins can manage all purchases" ON public.purchases
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- Política de administrador para consultants
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultants' 
        AND policyname = 'Admins can manage all consultants'
    ) THEN
        CREATE POLICY "Admins can manage all consultants" ON public.consultants
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;
END $$;

-- =====================================================
-- Inserción de Datos de Prueba
-- =====================================================

-- Nota: El usuario de prueba debe crearse primero en Supabase Auth.
-- El script siguiente asume que ya existe un usuario en auth.users.

-- Crear perfil de usuario de prueba (si existe usuario en auth.users)
-- Para pruebas reales, sigue estos pasos:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. Haz clic en "Add user"
-- 3. Configura: Email: test@amiko.com, Password: test123456
-- 4. El script siguiente creará automáticamente el perfil en public.users

DO $$
DECLARE
    test_user_id UUID;
    test_user_exists BOOLEAN;
BEGIN
    -- Buscar usuario de prueba en auth.users
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@amiko.com'
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Verificar si existe perfil en public.users
        SELECT EXISTS(SELECT 1 FROM public.users WHERE id = test_user_id) INTO test_user_exists;

        IF NOT test_user_exists THEN
            -- Crear perfil de usuario de prueba
            INSERT INTO public.users (id, email, full_name, name, language, is_admin)
            VALUES (test_user_id, 'test@amiko.com', 'Usuario de Prueba', 'Usuario de Prueba', 'ko', false)
            ON CONFLICT (id) DO NOTHING;

            RAISE NOTICE '✅ Perfil de usuario de prueba creado exitosamente: %', test_user_id;
        ELSE
            RAISE NOTICE 'ℹ️ El perfil de usuario de prueba ya existe: %', test_user_id;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Para crear el usuario de prueba, primero créalo en Supabase Auth:';
        RAISE NOTICE '   1. Dashboard > Authentication > Users > Add user';
        RAISE NOTICE '   2. Email: test@amiko.com, Password: test123456';
        RAISE NOTICE '   3. Ejecuta este script nuevamente.';
    END IF;
END $$;

-- Crear registro de pago de prueba (si existe usuario)
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
    'PAYPAL-TEST-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
    'order-test-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
    1.99,
    'USD',
    'US',
    'paid',
    'coupon',
    '{"coupon_minutes": 20, "coupon_count": 1}'::jsonb,
    '{"id": "PAYPAL-TEST", "status": "COMPLETED"}'::jsonb
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
AND NOT EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE payment_id LIKE 'PAYPAL-TEST-%'
    LIMIT 1
);

-- =====================================================
-- Mensaje de Finalización
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ ¡Inicialización de Base de Datos del Proyecto AMIKO Completada!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  ✓ users (usuarios)';
    RAISE NOTICE '  ✓ consultants (consultores)';
    RAISE NOTICE '  ✓ bookings (reservas)';
    RAISE NOTICE '  ✓ payments (registros de pagos)';
    RAISE NOTICE '  ✓ purchases (registros de compras)';
    RAISE NOTICE '  ✓ coupons (cupones)';
    RAISE NOTICE '  ✓ coupon_usage (historial de uso de cupones)';
    RAISE NOTICE '  ✓ vip_subscriptions (suscripciones VIP)';
    RAISE NOTICE '  ✓ vip_features (funciones VIP)';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '  1. Crear usuario de prueba en Supabase Auth';
    RAISE NOTICE '     - Dashboard > Authentication > Users > Add user';
    RAISE NOTICE '     - Email: test@amiko.com';
    RAISE NOTICE '     - Password: test123456';
    RAISE NOTICE '  2. Ejecutar este script nuevamente para crear datos de prueba';
    RAISE NOTICE '  3. Probar flujo de inicio de sesión y pago';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- Esquema Integrado del Sistema de Pago PayPal
-- Amiko Project - PayPal Payment Integration
-- Date: 2025-12-09
-- =====================================================
-- 
-- Este esquema soporta los siguientes flujos de pago PayPal:
-- 1. create-order: Crear pedido (guardar en tabla purchases con estado pending)
-- 2. approve-order: Aprobar pedido (guardar en tabla payments, actualizar tabla bookings)
-- 3. webhook: Procesar webhook de PayPal (actualizar tabla purchases)
--
-- Método de Ejecución:
-- 1. Ejecutar en Supabase Dashboard > SQL Editor
-- 2. O ejecutar migración con Supabase CLI
-- =====================================================

-- Activar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Tabla de Usuarios (Users Table)
-- =====================================================
-- Nota: Se asume integración con Supabase Auth
-- Se omite si ya existe (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    one_line_intro TEXT,
    language TEXT DEFAULT 'ko',
    is_admin BOOLEAN DEFAULT FALSE,
    is_korean BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. Tabla de Consultores (Consultants Table)
-- =====================================================
-- Información de consultor vinculada a reservas

CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    languages TEXT[] DEFAULT ARRAY['English'],
    available_hours JSONB DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Tabla de Reservas (Bookings Table)
-- =====================================================
-- Información de reserva de consulta (vinculada a pago)

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
    order_id TEXT UNIQUE NOT NULL, -- Número de pedido interno (ej: order-1234567890-abc123)
    topic TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- En minutos
    price DECIMAL(10, 2) NOT NULL, -- En USD
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')), -- Estado de pago
    payment_method TEXT DEFAULT 'paypal', -- Método de pago
    payment_id TEXT, -- PayPal Order ID (conectado con payment_id de la tabla payments)
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. Tabla de Pagos (Payments Table)
-- =====================================================
-- Registro de pago PayPal (guardado en approve-order)

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL, -- Número de pedido interno (conectado con bookings.order_id)
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID (ej: 5O190127TN364715T)
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- En centavos (ej: 199 = $1.99)
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    paypal_data JSONB, -- Almacenar datos completos de respuesta de API PayPal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. Tabla de Registro de Compras (Purchases Table)
-- =====================================================
-- Registro de compra de productos (cupones, suscripción VIP, etc.) (guardado como pending en create-order, actualizado en webhook)

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'toss', 'stripe')),
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID
    order_id TEXT NOT NULL, -- Número de pedido interno
    amount DECIMAL(10, 2) NOT NULL, -- En USD
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT, -- País de pago (opcional)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
    product_type TEXT NOT NULL CHECK (product_type IN ('coupon', 'vip_subscription', 'booking')), -- Tipo de producto
    product_data JSONB DEFAULT '{}', -- Información detallada del producto (ej: {coupon_minutes: 20, coupon_count: 1})
    paypal_data JSONB, -- Datos completos de respuesta de API PayPal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. Creación de Índices (Optimización de Rendimiento)
-- =====================================================


CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);


CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);


CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);


CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);


CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);


CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON public.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON public.purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON public.purchases(provider);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider_status ON public.purchases(provider, status);


CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- =====================================================
-- 7. Función de Actualización Automática de Tiempo
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Aplicar Triggers de Actualización
-- =====================================================


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

-- =====================================================
-- 9. Activar RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. Crear Políticas RLS
-- =====================================================


DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);


DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "System can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE USING (true);


DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create purchases" ON public.purchases;
CREATE POLICY "System can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.purchases;
CREATE POLICY "System can update purchases" ON public.purchases
    FOR UPDATE USING (true);


DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Admins can manage all users'
    ) THEN
        CREATE POLICY "Admins can manage all users" ON public.users
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;


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
END $$;

-- =====================================================
-- 11. Inserción de Datos de Muestra para Pruebas
-- =====================================================

-- Crear 1 usuario de prueba (se asume que ya existe en auth.users)
-- Nota: Debe haber un usuario en auth.users real
DO $$
DECLARE
    test_user_id UUID;
BEGIN

    SELECT id INTO test_user_id 
    FROM public.users 
    WHERE email = 'test@amiko.com'
    LIMIT 1;


    IF test_user_id IS NULL THEN


        RAISE NOTICE 'Para crear un usuario de prueba, primero cree el usuario en Supabase Auth.';
    END IF;
END $$;

-- Insertar 1 registro de datos de pago de prueba
-- Nota: Deben existir user_id y booking_id reales
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
    (SELECT id FROM public.bookings LIMIT 1),
    199, -- $1.99
    'USD',
    'completed',
    'paypal',
    '{"id": "PAYPAL-TEST-001", "status": "COMPLETED"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE payment_id = 'PAYPAL-TEST-001'
)
ON CONFLICT (payment_id) DO NOTHING;

-- =====================================================
-- 12. Consultas de Validación de Esquema
-- =====================================================

-- Verificar existencia de tablas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'bookings', 'payments', 'purchases', 'consultants');
    
    RAISE NOTICE 'Número de tablas creadas: %', table_count;
END $$;

-- =====================================================
-- Mensaje de Finalización
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ ¡Esquema del sistema de pago PayPal creado!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - users (Usuario)';
    RAISE NOTICE '  - consultants (Consultor)';
    RAISE NOTICE '  - bookings (Reserva)';
    RAISE NOTICE '  - payments (Registro de pago)';
    RAISE NOTICE '  - purchases (Registro de compra)';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '  1. Crear usuario de prueba en Supabase Auth';
    RAISE NOTICE '  2. Proceder con pago de prueba';
    RAISE NOTICE '  3. Verificar datos';
END $$;

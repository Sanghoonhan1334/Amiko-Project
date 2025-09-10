-- 샘플 데이터 삽입 (Sample Data Insertion)
-- PayPal 전용 Amiko Project

-- 1. 샘플 사용자 (Supabase Auth와 연동되므로 실제 사용자는 Auth를 통해 생성)
-- 테스트용으로 직접 삽입 (실제 운영에서는 Auth를 통해 생성)

-- 2. 샘플 상담사 데이터 (Sample Consultants Data)
INSERT INTO public.consultants (
    name, 
    specialty, 
    description, 
    hourly_rate, 
    languages, 
    availability,
    profile_image_url
) VALUES 
(
    'Sarah Johnson',
    'Korean Language & Culture',
    'Native Korean speaker with 5+ years of teaching experience. Specialized in conversational Korean and cultural understanding.',
    25.00,
    ARRAY['English', 'Korean'],
    '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
),
(
    'David Kim',
    'Business Korean',
    'Business consultant specializing in Korean business culture and language. Helps professionals navigate Korean corporate environment.',
    35.00,
    ARRAY['English', 'Korean'],
    '{"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "18:00"}}',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
),
(
    'Min-jung Park',
    'Korean Literature & History',
    'Korean literature professor with deep knowledge of Korean history and culture. Perfect for advanced learners.',
    30.00,
    ARRAY['English', 'Korean'],
    '{"monday": {"start": "14:00", "end": "22:00"}, "tuesday": {"start": "14:00", "end": "22:00"}, "wednesday": {"start": "14:00", "end": "22:00"}, "thursday": {"start": "14:00", "end": "22:00"}, "friday": {"start": "14:00", "end": "22:00"}}',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
),
(
    'James Lee',
    'Korean Cooking & Lifestyle',
    'Korean-American chef teaching Korean cooking and lifestyle. Learn Korean through food and daily life.',
    28.00,
    ARRAY['English', 'Korean'],
    '{"saturday": {"start": "10:00", "end": "18:00"}, "sunday": {"start": "10:00", "end": "18:00"}}',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
),
(
    'Elena Rodriguez',
    'Korean for Spanish Speakers',
    'Bilingual Korean-Spanish speaker. Specialized in teaching Korean to Spanish speakers.',
    22.00,
    ARRAY['English', 'Korean', 'Spanish'],
    '{"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "16:00"}}',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
);

-- 3. 샘플 쿠폰 패키지 (Sample Coupon Packages) - ChargingTab에서 사용
-- 실제 쿠폰은 사용자가 구매할 때 생성되므로 여기서는 참고용

-- 4. 샘플 VIP 구독 패키지 (Sample VIP Subscription Packages) - ChargingTab에서 사용
-- 실제 VIP 구독은 사용자가 구매할 때 생성되므로 여기서는 참고용

-- 5. 시스템 알림 메시지 (System Notification Messages) - 선택사항
INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
) VALUES 
(
    NULL, -- 시스템 전체 알림
    'system',
    'Welcome to Amiko!',
    'Welcome to Amiko! Start your Korean learning journey with our expert consultants.',
    '{"is_system": true}'
);

-- 6. 기본 알림 설정 (Default Notification Settings) - 사용자 생성 시 자동으로 생성되도록 함수 만들 예정
-- 실제 사용자는 회원가입 시 자동으로 생성됨

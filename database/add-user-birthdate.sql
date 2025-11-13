-- Adds birth date and age verification flags to users table for child privacy compliance
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS age_verified boolean DEFAULT false;

COMMENT ON COLUMN public.users.birth_date IS 'User birth date for age verification (stored as YYYY-MM-DD)';
COMMENT ON COLUMN public.users.age_verified IS 'Indicates whether the user has passed age verification checks';


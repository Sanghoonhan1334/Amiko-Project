-- =====================================================
-- Migration: 01-extend-profiles-and-otp
-- Description: profiles 테이블 확장 및 OTP 로그 테이블 생성
-- Date: 2024-01-15
-- =====================================================

-- profiles 확장(없으면 추가, 있으면 무시)
alter table profiles
  add column if not exists country text,
  add column if not exists is_korean boolean,
  add column if not exists phone_e164 text unique,
  add column if not exists wa_verified_at timestamptz,
  add column if not exists sms_verified_at timestamptz,
  add column if not exists email_verified_at timestamptz,
  add column if not exists kakao_linked_at timestamptz;

-- OTP 로그(간단 버전)
create table if not exists otp_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  channel text check (channel in ('wa','sms','email')) not null,
  target text not null,
  status text not null, -- sent|verified|failed|expired
  created_at timestamptz default now()
);

-- 인덱스 생성
create index if not exists idx_otp_attempts_user on otp_attempts(user_id);
create index if not exists idx_otp_attempts_target on otp_attempts(target);
create index if not exists idx_otp_attempts_created_at on otp_attempts(created_at);

-- RLS 정책 설정 (필요시)
-- alter table otp_attempts enable row level security;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
profiles 테이블 확장 필드:

1. country: 사용자 국가 (한국, 멕시코, 브라질 등)
2. is_korean: 한국인 여부 (boolean)
3. phone_e164: 국제 표준 전화번호 형식 (+82-10-1234-5678)
4. wa_verified_at: WhatsApp 인증 완료 시간
5. sms_verified_at: SMS 인증 완료 시간
6. email_verified_at: 이메일 인증 완료 시간
7. kakao_linked_at: 카카오 계정 연동 시간

OTP 로그 테이블:

1. id: 고유 식별자 (UUID)
2. user_id: 사용자 ID (auth.users 참조)
3. channel: 인증 채널 (wa, sms, email)
4. target: 인증 대상 (전화번호, 이메일 등)
5. status: 인증 상태 (sent, verified, failed, expired)
6. created_at: 생성 시간

인덱스:
- user_id: 사용자별 OTP 기록 조회
- target: 특정 대상의 OTP 기록 조회
- created_at: 시간순 정렬 및 만료된 OTP 정리
*/

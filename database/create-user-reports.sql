-- Table for user-to-user reports (accounts, posts, comments)
create table if not exists public.user_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  context_type text, -- e.g. 'profile', 'post', 'comment'
  context_id text, -- optional reference id
  reason text,
  details text,
  status text default 'pending', -- pending, reviewing, resolved, dismissed
  created_at timestamptz default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  resolution_notes text,
  ip_address text,
  user_agent text
);

create index if not exists user_reports_reporter_idx on public.user_reports(reporter_id);
create index if not exists user_reports_reported_idx on public.user_reports(reported_user_id);
create index if not exists user_reports_status_idx on public.user_reports(status);


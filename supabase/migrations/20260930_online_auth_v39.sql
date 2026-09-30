-- Ludo by DaniLabs online accounts + sessions (v39)
-- Apply after v38, or on a database where the v38 online tables already exist.

create table if not exists public.online_accounts (
  user_id text primary key,
  username text not null unique check (char_length(username) between 4 and 24 and username !~ '[^a-z0-9_]'),
  display_name text not null check (char_length(display_name) between 1 and 24),
  password_salt text not null check (char_length(password_salt)=32),
  password_hash text not null check (char_length(password_hash)=128),
  recovery_hash text not null check (char_length(recovery_hash)=64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_sessions (
  token_hash text primary key check (char_length(token_hash)=64),
  user_id text not null references public.online_accounts(user_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.online_auth_limits (
  key_hash text primary key check (char_length(key_hash)=64),
  attempts smallint not null default 1 check (attempts between 1 and 100),
  window_start timestamptz not null default now()
);

create index if not exists online_sessions_user_idx on public.online_sessions(user_id);
create index if not exists online_sessions_expiry_idx on public.online_sessions(expires_at);
create index if not exists online_auth_limits_window_idx on public.online_auth_limits(window_start);

alter table public.online_accounts enable row level security;
alter table public.online_sessions enable row level security;
alter table public.online_auth_limits enable row level security;

revoke all on table public.online_accounts from anon, authenticated;
revoke all on table public.online_sessions from anon, authenticated;
revoke all on table public.online_auth_limits from anon, authenticated;

grant select,insert,update,delete on table public.online_accounts to service_role;
grant select,insert,update,delete on table public.online_sessions to service_role;
grant select,insert,update,delete on table public.online_auth_limits to service_role;

-- Server-only cleanup jobs may periodically remove:
-- delete from public.online_sessions where expires_at < now();
-- delete from public.online_auth_limits where window_start < now() - interval '1 day';

-- Ludo by DaniLabs online backend (v38)
-- Browser clients never receive the Supabase secret key. All access goes through /api/online/*.

create table if not exists public.online_profiles (
  user_id text primary key,
  username text not null unique check (char_length(username) between 4 and 64 and username !~ '[^a-z0-9_]'),
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 24),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code)=6 and code !~ '[^A-Z0-9]'),
  host_id text not null,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  max_players smallint not null check (max_players between 2 and 4),
  variant text not null default 'classic' check (variant in ('classic','quick','rush')),
  state jsonb,
  version bigint not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_members (
  room_id uuid not null references public.online_rooms(id) on delete cascade,
  user_id text not null,
  seat smallint not null check (seat between 0 and 3),
  color text not null check (color in ('red','green','yellow','blue')),
  ready boolean not null default false,
  username text not null,
  display_name text not null default 'Player',
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id),
  unique (room_id,seat),
  unique (room_id,color)
);

create table if not exists public.online_friends (
  pair_key text primary key,
  requester_id text not null,
  addressee_id text not null,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create index if not exists online_members_user_idx on public.online_members(user_id,joined_at desc);
create index if not exists online_rooms_status_idx on public.online_rooms(status,updated_at desc);
create index if not exists online_friends_requester_idx on public.online_friends(requester_id,created_at desc);
create index if not exists online_friends_addressee_idx on public.online_friends(addressee_id,created_at desc);

alter table public.online_profiles enable row level security;
alter table public.online_rooms enable row level security;
alter table public.online_members enable row level security;
alter table public.online_friends enable row level security;

revoke all on table public.online_profiles from anon, authenticated;
revoke all on table public.online_rooms from anon, authenticated;
revoke all on table public.online_members from anon, authenticated;
revoke all on table public.online_friends from anon, authenticated;

grant select,insert,update,delete on table public.online_profiles to service_role;
grant select,insert,update,delete on table public.online_rooms to service_role;
grant select,insert,update,delete on table public.online_members to service_role;
grant select,insert,update,delete on table public.online_friends to service_role;

-- Optional cleanup:
-- delete from public.online_rooms where updated_at < now() - interval '7 days';

-- Persistent profiles, social graph, invitations and verified online history.
alter table public.online_profiles add column if not exists player_id text;
alter table public.online_profiles add column if not exists avatar text not null default 'avatar-1';
create unique index if not exists online_profiles_player_id_uidx on public.online_profiles(player_id) where player_id is not null;

create table if not exists public.online_blocks (
 blocker_id text not null references public.online_accounts(user_id) on delete cascade,
 blocked_id text not null references public.online_accounts(user_id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);
create table if not exists public.online_invites (
 id uuid primary key default gen_random_uuid(),
 sender_id text not null references public.online_accounts(user_id) on delete cascade,
 recipient_id text not null references public.online_accounts(user_id) on delete cascade,
 room_id uuid not null references public.online_rooms(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled','expired')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 minutes'),
 check(sender_id<>recipient_id)
);
create unique index if not exists online_invites_pending_uidx on public.online_invites(sender_id,recipient_id,room_id) where status='pending';

create table if not exists public.online_match_results (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null unique references public.online_rooms(id) on delete cascade,
 game text not null check(game in ('classic','color-cards')),
 mode text not null,
 status text not null check(status in ('completed','abandoned','forfeited')),
 winner_id text,
 final_scores jsonb not null default '{}'::jsonb,
 completed_at timestamptz not null default now()
);
create table if not exists public.online_match_participants (
 result_id uuid not null references public.online_match_results(id) on delete cascade,
 user_id text not null references public.online_accounts(user_id) on delete cascade,
 seat smallint not null,
 color text not null,
 display_name text not null,
 score integer,
 won boolean not null default false,
 primary key(result_id,user_id)
);
create index if not exists online_match_participants_user_idx on public.online_match_participants(user_id,result_id);

alter table public.online_blocks enable row level security;
alter table public.online_invites enable row level security;
alter table public.online_match_results enable row level security;
alter table public.online_match_participants enable row level security;
revoke all on table public.online_blocks,public.online_invites,public.online_match_results,public.online_match_participants from anon,authenticated;
grant select,insert,update,delete on table public.online_blocks,public.online_invites,public.online_match_results,public.online_match_participants to service_role;

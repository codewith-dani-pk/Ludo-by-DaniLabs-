-- v51 free-entry Classic Ludo tournaments and limited-time events.
create table if not exists public.online_admins(user_id text primary key references public.online_accounts(user_id) on delete cascade,role text not null default 'admin' check(role in ('admin')),created_at timestamptz not null default now());

create table if not exists public.live_events(
 id uuid primary key default gen_random_uuid(),slug text not null unique,title text not null,description text not null default '',artwork text,
 starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'draft' check(status in ('draft','published','cancelled')),
 eligible_games text[] not null default '{}',mission_keys text[] not null default '{}',reward_summary jsonb not null default '{}'::jsonb,
 created_by text not null references public.online_accounts(user_id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(ends_at>starts_at)
);

create table if not exists public.tournaments(
 id uuid primary key default gen_random_uuid(),event_id uuid references public.live_events(id) on delete set null,title text not null,description text not null default '',artwork text,
 game text not null default 'classic' check(game='classic'),requested_size smallint not null check(requested_size in (4,8,16)),bracket_size smallint check(bracket_size in (4,8,16)),
 registration_deadline timestamptz not null,start_at timestamptz not null,timezone text not null default 'UTC',
 ready_seconds integer not null default 300 check(ready_seconds between 30 and 3600),reconnect_grace_seconds integer not null default 90 check(reconnect_grace_seconds between 30 and 600),
 rewards jsonb not null default '{"champion":{"coins":500,"badge":"badge-champion"},"runner_up":{"coins":250,"badge":"badge-finalist"}}'::jsonb,
 status text not null default 'draft' check(status in ('draft','published','registration_closed','running','completed','cancelled')),
 created_by text not null references public.online_accounts(user_id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(start_at>=registration_deadline)
);
create table if not exists public.tournament_registrations(
 tournament_id uuid not null references public.tournaments(id) on delete cascade,user_id text not null references public.online_accounts(user_id) on delete cascade,registered_at timestamptz not null default now(),seed integer,
 primary key(tournament_id,user_id),unique(tournament_id,seed)
);
create table if not exists public.tournament_matches(
 id uuid primary key default gen_random_uuid(),tournament_id uuid not null references public.tournaments(id) on delete cascade,round_no smallint not null,slot_no smallint not null,
 player1_id text references public.online_accounts(user_id),player2_id text references public.online_accounts(user_id),winner_id text references public.online_accounts(user_id),
 room_id uuid unique references public.online_rooms(id) on delete set null,result_id uuid unique references public.online_match_results(id) on delete set null,
 status text not null default 'pending' check(status in ('pending','ready','playing','completed','forfeited','no_show','bye','cancelled')),
 player1_ready_at timestamptz,player2_ready_at timestamptz,ready_deadline timestamptz,reconnect_deadline timestamptz,outcome text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tournament_id,round_no,slot_no),check(player1_id is null or player1_id<>player2_id)
);
create table if not exists public.tournament_badges(user_id text not null references public.online_accounts(user_id) on delete cascade,badge_id text not null,tournament_id uuid not null references public.tournaments(id) on delete cascade,granted_at timestamptz not null default now(),primary key(user_id,badge_id,tournament_id));
create table if not exists public.admin_audit_log(id uuid primary key default gen_random_uuid(),admin_id text not null references public.online_accounts(user_id),action text not null,entity_type text not null,entity_id uuid,details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());

create index if not exists tournaments_status_time_idx on public.tournaments(status,registration_deadline,start_at);
create index if not exists tournament_matches_player1_idx on public.tournament_matches(player1_id,status);
create index if not exists tournament_matches_player2_idx on public.tournament_matches(player2_id,status);
create index if not exists live_events_status_time_idx on public.live_events(status,starts_at,ends_at);

alter table public.online_admins enable row level security;alter table public.live_events enable row level security;alter table public.tournaments enable row level security;alter table public.tournament_registrations enable row level security;alter table public.tournament_matches enable row level security;alter table public.tournament_badges enable row level security;alter table public.admin_audit_log enable row level security;
revoke all on table public.online_admins,public.live_events,public.tournaments,public.tournament_registrations,public.tournament_matches,public.tournament_badges,public.admin_audit_log from anon,authenticated;
grant select,insert,update,delete on table public.online_admins,public.live_events,public.tournaments,public.tournament_registrations,public.tournament_matches,public.tournament_badges,public.admin_audit_log to service_role;

create or replace function public.register_tournament(p_tournament uuid,p_user text) returns integer language plpgsql security definer as $$
declare t public.tournaments%rowtype;n integer;
begin
 select * into t from public.tournaments where id=p_tournament for update;
 if t.id is null then raise exception 'tournament not found';end if;
 if t.status<>'published' or now()>=t.registration_deadline then raise exception 'registration is closed';end if;
 if exists(select 1 from public.tournament_registrations where tournament_id=p_tournament and user_id=p_user) then raise exception 'already registered';end if;
 select count(*) into n from public.tournament_registrations where tournament_id=p_tournament;
 if n>=t.requested_size then raise exception 'tournament is full';end if;
 insert into public.tournament_registrations(tournament_id,user_id) values(p_tournament,p_user);return n+1;
end $$;

create or replace function public.claim_tournament_reward(p_tournament uuid,p_user text,p_place text,p_coins integer,p_badge text) returns integer language plpgsql security definer as $$
declare b integer;
begin
 select public.reward_credit(p_user,'tournament:'||p_tournament::text||':'||p_user,p_coins,'tournament',p_tournament::text) into b;
 if coalesce(p_badge,'')<>'' then insert into public.tournament_badges(user_id,badge_id,tournament_id) values(p_user,p_badge,p_tournament) on conflict do nothing;end if;
 return b;
end $$;
revoke execute on function public.register_tournament(uuid,text),public.claim_tournament_reward(uuid,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.register_tournament(uuid,text),public.claim_tournament_reward(uuid,text,text,integer,text) to service_role;

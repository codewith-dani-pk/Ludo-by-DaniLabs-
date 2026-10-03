-- v50 server-owned rewards, earned coins, cosmetics and leaderboard support.
create table if not exists public.reward_wallets(user_id text primary key references public.online_accounts(user_id) on delete cascade,balance integer not null default 0 check(balance>=0),updated_at timestamptz not null default now());
create table if not exists public.reward_ledger(id uuid primary key default gen_random_uuid(),user_id text not null references public.online_accounts(user_id) on delete cascade,tx_key text not null unique,amount integer not null,kind text not null,reference text,created_at timestamptz not null default now());
create index if not exists reward_ledger_user_idx on public.reward_ledger(user_id,created_at desc);

create table if not exists public.daily_reward_claims(user_id text not null references public.online_accounts(user_id) on delete cascade,reward_date date not null,streak_day smallint not null check(streak_day between 1 and 7),coins integer not null check(coins>=0),created_at timestamptz not null default now(),primary key(user_id,reward_date));

create table if not exists public.mission_event_keys(event_key text primary key,created_at timestamptz not null default now());
create table if not exists public.mission_progress(user_id text not null references public.online_accounts(user_id) on delete cascade,mission_key text not null,period_key text not null,progress integer not null default 0 check(progress>=0),claimed boolean not null default false,updated_at timestamptz not null default now(),primary key(user_id,mission_key,period_key));

create table if not exists public.cosmetic_inventory(user_id text not null references public.online_accounts(user_id) on delete cascade,item_id text not null,acquired_at timestamptz not null default now(),primary key(user_id,item_id));
create table if not exists public.cosmetic_loadouts(user_id text primary key references public.online_accounts(user_id) on delete cascade,avatar text not null default 'avatar-1',frame text not null default 'frame-none',board text not null default 'board-royal',pawn text not null default 'pawn-classic',card_back text not null default 'cards-royal',updated_at timestamptz not null default now());

alter table public.online_match_results add column if not exists reward_events jsonb not null default '{}'::jsonb;
alter table public.online_match_results add column if not exists rewards_processed boolean not null default false;

alter table public.mission_event_keys enable row level security;
alter table public.reward_wallets enable row level security;alter table public.reward_ledger enable row level security;alter table public.daily_reward_claims enable row level security;alter table public.mission_progress enable row level security;alter table public.cosmetic_inventory enable row level security;alter table public.cosmetic_loadouts enable row level security;
revoke all on table public.mission_event_keys from anon,authenticated;
grant select,insert,update,delete on table public.mission_event_keys to service_role;
revoke all on table public.reward_wallets,public.reward_ledger,public.daily_reward_claims,public.mission_progress,public.cosmetic_inventory,public.cosmetic_loadouts from anon,authenticated;
grant select,insert,update,delete on table public.reward_wallets,public.reward_ledger,public.daily_reward_claims,public.mission_progress,public.cosmetic_inventory,public.cosmetic_loadouts to service_role;

create or replace function public.reward_credit(p_user text,p_tx_key text,p_amount integer,p_kind text,p_reference text default null) returns integer language plpgsql security definer as $$
declare b integer;
begin
 if p_amount=0 then raise exception 'zero amount'; end if;
 insert into public.reward_wallets(user_id,balance) values(p_user,0) on conflict(user_id) do nothing;
 perform 1 from public.reward_wallets where user_id=p_user for update;
 if exists(select 1 from public.reward_ledger where tx_key=p_tx_key) then select balance into b from public.reward_wallets where user_id=p_user;return b;end if;
 update public.reward_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user and balance+p_amount>=0 returning balance into b;
 if b is null then raise exception 'insufficient coins';end if;
 insert into public.reward_ledger(user_id,tx_key,amount,kind,reference) values(p_user,p_tx_key,p_amount,p_kind,p_reference);
 return b;
end $$;

create or replace function public.claim_daily_reward(p_user text,p_day date,p_streak smallint,p_coins integer) returns integer language plpgsql security definer as $$
declare b integer;
begin
 insert into public.daily_reward_claims(user_id,reward_date,streak_day,coins) values(p_user,p_day,p_streak,p_coins);
 select public.reward_credit(p_user,'daily:'||p_user||':'||p_day::text,p_coins,'daily',p_day::text) into b;return b;
exception when unique_violation then raise exception 'daily reward already claimed';
end $$;

create or replace function public.purchase_cosmetic(p_user text,p_item text,p_price integer) returns integer language plpgsql security definer as $$
declare b integer;
begin
 if exists(select 1 from public.cosmetic_inventory where user_id=p_user and item_id=p_item) then raise exception 'item already owned';end if;
 select public.reward_credit(p_user,'shop:'||p_user||':'||p_item,-p_price,'cosmetic',p_item) into b;
 insert into public.cosmetic_inventory(user_id,item_id) values(p_user,p_item);return b;
end $$;

create or replace function public.claim_mission_reward(p_user text,p_mission text,p_period text,p_target integer,p_coins integer) returns integer language plpgsql security definer as $$
declare b integer;n integer;
begin
 select progress into n from public.mission_progress where user_id=p_user and mission_key=p_mission and period_key=p_period for update;
 if n is null or n<p_target then raise exception 'mission not complete';end if;
 update public.mission_progress set claimed=true,updated_at=now() where user_id=p_user and mission_key=p_mission and period_key=p_period and claimed=false;
 if not found then raise exception 'mission already claimed';end if;
 select public.reward_credit(p_user,'mission:'||p_user||':'||p_mission||':'||p_period,p_coins,'mission',p_mission) into b;return b;
end $$;

revoke execute on function public.reward_credit(text,text,integer,text,text) from public,anon,authenticated;
revoke execute on function public.claim_daily_reward(text,date,smallint,integer) from public,anon,authenticated;
revoke execute on function public.purchase_cosmetic(text,text,integer) from public,anon,authenticated;
revoke execute on function public.claim_mission_reward(text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.reward_credit(text,text,integer,text,text),public.claim_daily_reward(text,date,smallint,integer),public.purchase_cosmetic(text,text,integer),public.claim_mission_reward(text,text,text,integer,integer) to service_role;

revoke execute on function public.reward_credit(text,text,integer,text,text) from public,anon,authenticated;
revoke execute on function public.claim_daily_reward(text,date,smallint,integer) from public,anon,authenticated;
revoke execute on function public.purchase_cosmetic(text,text,integer) from public,anon,authenticated;
revoke execute on function public.claim_mission_reward(text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.reward_credit(text,text,integer,text,text),public.claim_daily_reward(text,date,smallint,integer),public.purchase_cosmetic(text,text,integer),public.claim_mission_reward(text,text,text,integer,integer) to service_role;

create or replace function public.apply_mission_progress(p_user text,p_mission text,p_period text,p_delta integer,p_event_key text) returns boolean language plpgsql security definer as $$
begin
 if p_delta<=0 then return false;end if;
 insert into public.mission_event_keys(event_key) values(p_event_key) on conflict do nothing;
 if not found then return false;end if;
 insert into public.mission_progress(user_id,mission_key,period_key,progress) values(p_user,p_mission,p_period,p_delta)
 on conflict(user_id,mission_key,period_key) do update set progress=public.mission_progress.progress+excluded.progress,updated_at=now();
 return true;
end $$;
revoke execute on function public.apply_mission_progress(text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.apply_mission_progress(text,text,text,integer,text) to service_role;

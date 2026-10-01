-- v44: canonical game variants + online action/reconnect metadata
alter table public.online_rooms drop constraint if exists online_rooms_variant_check;
alter table public.online_rooms add constraint online_rooms_variant_check
  check (variant in ('classic','color-cards'));
-- State version remains the optimistic concurrency key. Action IDs are retained
-- inside authoritative state (bounded to the latest 100) for retry deduplication.

alter table public.online_members add column if not exists last_seen_at timestamptz not null default now();
alter table public.online_rooms add column if not exists options jsonb not null default '{}'::jsonb;

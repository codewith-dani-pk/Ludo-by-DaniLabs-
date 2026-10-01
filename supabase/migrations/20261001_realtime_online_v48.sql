-- Realtime multiplayer phase.
-- Realtime channels carry notifications only; authoritative/private match state stays behind /api/online.
alter table public.online_members add column if not exists avatar text not null default 'avatar-1';
alter table public.online_rooms add column if not exists expires_at timestamptz;
update public.online_rooms set expires_at=coalesce(expires_at,created_at + interval '24 hours') where expires_at is null;
create index if not exists online_rooms_expiry_idx on public.online_rooms(expires_at);

-- Do NOT grant anon/authenticated SELECT on online_rooms: state contains private Color Cards data.
-- Supabase Realtime Broadcast is used only as a wake-up signal; clients then fetch their privacy-filtered view.

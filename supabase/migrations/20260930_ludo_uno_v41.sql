-- Enable UNO rooms alongside Ludo variants.
-- Apply this migration to the same Supabase project used by the online API.

alter table public.online_rooms
  drop constraint if exists online_rooms_variant_check;

alter table public.online_rooms
  add constraint online_rooms_variant_check
  check (variant in ('classic','quick','rush','uno'));

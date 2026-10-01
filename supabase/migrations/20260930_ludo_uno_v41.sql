-- Enable Classic Ludo and Color Cards private rooms.
-- Legacy values remain accepted so existing rows are not invalidated.
alter table public.online_rooms drop constraint if exists online_rooms_variant_check;
alter table public.online_rooms add constraint online_rooms_variant_check
check (variant in ('classic','color-cards','quick','rush','uno'));

-- Piron Talent | migration 0019 | city list widened to every province and the capital (owner request 2026-10-14)
-- Run after 0018_push.sql. The list must match src/lib/cities.ts.
begin;
alter table public.profiles drop constraint profiles_city_check;
alter table public.profiles add constraint profiles_city_check check (city is null or city in (
 'Phnom Penh','Siem Reap','Battambang','Sihanoukville','Kampong Cham','Kampot',
 'Banteay Meanchey','Kampong Chhnang','Kampong Speu','Kampong Thom','Kandal','Kep','Koh Kong','Kratie','Mondulkiri',
 'Oddar Meanchey','Pailin','Preah Vihear','Prey Veng','Pursat','Ratanakiri','Stung Treng','Svay Rieng','Takeo','Tboung Khmum',
 'Other'));
commit;

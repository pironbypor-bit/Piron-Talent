-- Piron Work | migration 0054 | Home in three pages, step 3: the professional card
-- The card is made from the profile automatically. This table only holds what the person changed.
-- A null column means "follow the profile". The on/off switch is profiles.is_available (the same switch as
-- "I offer a service"), so there is a single publish control. Card text is public, like the profile.
begin;

create table public.provider_cards (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 title text check (title is null or char_length(title) between 1 and 60),
 services text check (services is null or char_length(services) between 1 and 100),
 price_from text check (price_from is null or char_length(price_from) between 1 and 40),
 city text check (city is null or char_length(city) between 1 and 40),
 about text check (about is null or char_length(about) between 1 and 280),
 updated_at timestamptz not null default now()
);
create trigger provider_cards_updated before update on public.provider_cards for each row execute function public.touch_updated_at();
alter table public.provider_cards enable row level security;
create policy provider_cards_read on public.provider_cards for select to anon, authenticated using (true);
create policy provider_cards_insert on public.provider_cards for insert to authenticated with check (user_id = (select auth.uid()));
create policy provider_cards_update on public.provider_cards for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy provider_cards_delete on public.provider_cards for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.provider_cards from anon, authenticated;
grant select on public.provider_cards to anon, authenticated;
grant insert, update, delete on public.provider_cards to authenticated;

commit;

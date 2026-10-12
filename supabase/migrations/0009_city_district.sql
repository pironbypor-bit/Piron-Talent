-- Piron Talent | migration 0009 | city as a fixed list, district for Phnom Penh, public directory index
-- Run after 0008_request_source.sql in the Supabase SQL editor.
-- The list must match src/lib/cities.ts.
begin;

-- 1. Normalise what people typed so far, then lock the list.
update public.profiles set city = 'Phnom Penh' where city is not null and (city ilike '%phnom%' or city ilike 'pp' or city ilike '%ភ្នំពេញ%');
update public.profiles set city = 'Siem Reap' where city is not null and (city ilike '%siem%' or city ilike '%សៀមរាប%');
update public.profiles set city = 'Battambang' where city is not null and (city ilike '%battam%' or city ilike '%បាត់ដំបង%');
update public.profiles set city = 'Sihanoukville' where city is not null and (city ilike '%sihanouk%' or city ilike '%kampong som%' or city ilike '%ព្រះសីហនុ%');
update public.profiles set city = 'Kampong Cham' where city is not null and (city ilike '%kampong cham%' or city ilike '%កំពង់ចាម%');
update public.profiles set city = 'Kampot' where city is not null and (city ilike '%kampot%' or city ilike '%កំពត%');
update public.profiles set city = 'Other' where city is not null and city not in ('Phnom Penh','Siem Reap','Battambang','Sihanoukville','Kampong Cham','Kampot','Other');

alter table public.profiles
 add constraint profiles_city_check check (city is null or city in ('Phnom Penh','Siem Reap','Battambang','Sihanoukville','Kampong Cham','Kampot','Other')),
 add column district text check (district is null or length(district) <= 60);

-- 2. The directory and the Services tab filter on city and availability.
create index profiles_city_available_idx on public.profiles(city, is_available) where is_available;

commit;

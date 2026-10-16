-- Piron Work | migration 0053 | Home in three pages: the feature switch (starts at Only me)
-- Plan: docs/piron-home-three-pages-plan.html. The switch controls the three-button strip on Home and the
-- Professionals and Bookings pages. Set to Everyone in Piron Work Space > Features when it is ready.
begin;

insert into public.feature_flags(key, title, description, mode) values
 ('home_pages', 'Home in three pages: Posts, Professionals, Bookings', 'The three buttons at the top of Home, the Professionals catalogue with Book, and the Bookings page. Under construction, starts as Only me.', 'owner')
on conflict (key) do nothing;

commit;

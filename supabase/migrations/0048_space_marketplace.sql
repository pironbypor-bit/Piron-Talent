-- Piron Work | migration 0048 | Piron Work Space step 3: Marketplace health (owner only)
begin;

-- Internal: the funnel for posts created since a time. Not callable by app roles.
create function public.space_funnel(p_since timestamptz) returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
  'projects', (select count(*) from public.posts p where p.kind = 'need_help' and p.created_at >= p_since),
  'with_quote', (select count(*) from public.posts p where p.kind = 'need_help' and p.created_at >= p_since and exists (select 1 from public.quotes q where q.post_id = p.id)),
  'accepted', (select count(*) from public.project_jobs j join public.posts p on p.id = j.post_id where p.created_at >= p_since),
  'delivered', (select count(*) from public.project_jobs j join public.posts p on p.id = j.post_id where p.created_at >= p_since and j.status in ('delivered', 'confirmed')),
  'confirmed', (select count(*) from public.project_jobs j join public.posts p on p.id = j.post_id where p.created_at >= p_since and j.status = 'confirmed'),
  'cancelled', (select count(*) from public.project_jobs j join public.posts p on p.id = j.post_id where p.created_at >= p_since and j.status = 'cancelled'));
$$;
revoke execute on function public.space_funnel(timestamptz) from public, anon, authenticated;

create function public.space_marketplace() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return jsonb_build_object(
  'funnel_all', public.space_funnel('-infinity'),
  'funnel_30d', public.space_funnel(now() - interval '30 days'),
  'hours_to_first_quote', (select round((percentile_cont(0.5) within group (order by extract(epoch from (fq.first_at - p.created_at)) / 3600))::numeric, 1)
    from (select q.post_id, min(q.created_at) as first_at from public.quotes q where q.post_id is not null group by q.post_id) fq
    join public.posts p on p.id = fq.post_id),
  'avg_stars', (select round(avg(stars)::numeric, 2) from public.reviews),
  'reviews', (select count(*) from public.reviews),
  'quotes_waiting_2d', (select count(*) from public.quotes q where q.post_id is not null and q.status = 'pending' and q.created_at < now() - interval '2 days'),
  'no_quote_3d', (select count(*) from public.posts p where p.kind = 'need_help' and p.status = 'published' and p.created_at < now() - interval '3 days'
    and not exists (select 1 from public.quotes q where q.post_id = p.id)),
  'stuck', coalesce((select jsonb_agg(to_jsonb(s) order by s.days desc) from (
    select j.id, j.post_id, p.title, j.status,
     extract(day from now() - case when j.status = 'delivered' then coalesce(j.delivered_at, j.created_at) else j.created_at end)::int as days,
     (select display_name from public.profiles c where c.id = j.customer_id) as customer,
     (select display_name from public.profiles v where v.id = j.provider_id) as provider
    from public.project_jobs j join public.posts p on p.id = j.post_id
    where (j.status = 'accepted' and j.created_at < now() - interval '7 days')
       or (j.status = 'delivered' and coalesce(j.delivered_at, j.created_at) < now() - interval '3 days')
    order by 5 desc limit 10) s), '[]'::jsonb),
  'categories', coalesce((select jsonb_agg(jsonb_build_object('name', c.name,
      'posts', (select count(*) from public.posts p where p.category_id = c.id and p.kind = 'need_help' and p.created_at > now() - interval '90 days'),
      'providers', (select count(*) from public.profiles pr where pr.primary_category_id = c.id and pr.is_available and pr.paused_at is null)) order by c.name)
    from public.categories c where c.active), '[]'::jsonb),
  'cities', coalesce((select jsonb_agg(jsonb_build_object('city', x.city, 'posts', x.posts, 'providers', x.providers) order by x.posts + x.providers desc)
    from (select coalesce(k.city, 'Not set') as city,
      (select count(*) from public.posts p where coalesce(p.city, 'Not set') = coalesce(k.city, 'Not set') and p.kind = 'need_help' and p.created_at > now() - interval '90 days') as posts,
      (select count(*) from public.profiles pr where coalesce(pr.city, 'Not set') = coalesce(k.city, 'Not set') and pr.is_available and pr.paused_at is null) as providers
     from (select distinct city from (select city from public.posts union all select city from public.profiles) u) k) x
    where x.posts + x.providers > 0), '[]'::jsonb));
end;$$;
revoke execute on function public.space_marketplace() from public, anon;
grant execute on function public.space_marketplace() to authenticated;

commit;

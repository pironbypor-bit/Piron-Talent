-- Piron Talent | migration 0007 | reports and disputes: filing from the app, admin queues
-- Run after 0006_phase2_core.sql in the Supabase SQL editor.
-- Rules kept: RLS default deny; every state change goes through a security-definer function; admins
-- are checked with public.assert_admin().
begin;

-- 1. Reports: a note and who closed it. Admins can read every report.
alter table public.reports
 add column note text,
 add column resolved_by uuid references public.profiles(id),
 add column resolved_at timestamptz;
create index reports_open_idx on public.reports(created_at desc) where status in ('open','reviewing');
create policy reports_read_admin on public.reports for select to authenticated using (public.is_admin());

-- Anyone signed in can report a post, comment, job, message or person. One open report per target per person.
create function public.file_report(p_type text, p_id uuid, p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid; v_exists boolean;
begin
 if v_me is null then raise exception 'not allowed' using errcode='42501'; end if;
 if p_type not in ('post','comment','user','job','message') then raise exception 'bad target' using errcode='check_violation'; end if;
 if length(trim(coalesce(p_reason,''))) < 3 then raise exception 'reason is required' using errcode='check_violation'; end if;
 v_exists := case p_type
  when 'post' then exists(select 1 from public.posts where id=p_id)
  when 'comment' then exists(select 1 from public.post_comments where id=p_id)
  when 'user' then exists(select 1 from public.profiles where id=p_id)
  when 'job' then exists(select 1 from public.jobs where id=p_id)
  when 'message' then exists(select 1 from public.messages where id=p_id)
 end;
 if not v_exists then raise exception 'target not found' using errcode='no_data_found'; end if;
 if p_type='user' and p_id=v_me then raise exception 'cannot report yourself' using errcode='check_violation'; end if;
 select id into v_id from public.reports where reporter_id=v_me and target_type=p_type and target_id=p_id and status in ('open','reviewing');
 if v_id is not null then return v_id; end if;
 insert into public.reports(reporter_id, target_type, target_id, reason) values (v_me, p_type, p_id, left(trim(p_reason), 1000)) returning id into v_id;
 return v_id;
end;$$;

create function public.admin_set_report_status(p_id uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform public.assert_admin();
 if p_status not in ('reviewing','resolved','dismissed') then raise exception 'bad status' using errcode='check_violation'; end if;
 update public.reports set status=p_status, note=coalesce(nullif(trim(p_note),''), note),
  resolved_by=case when p_status in ('resolved','dismissed') then (select auth.uid()) else null end,
  resolved_at=case when p_status in ('resolved','dismissed') then now() else null end
  where id=p_id and status in ('open','reviewing');
 if not found then raise exception 'report not found or already closed' using errcode='no_data_found'; end if;
end;$$;

-- 2. Disputes on a Phase 2 job. The job's accepted quote is the dispute anchor (disputes.quote_id), so the
--    existing party checks keep working. Either party may open one while the job is accepted or delivered,
--    or within 14 days of confirmation.
create function public.open_dispute(p_job uuid, p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record; v_other uuid; v_id uuid;
begin
 select j1.*, p.title into j from public.project_jobs j1 join public.posts p on p.id=j1.post_id where j1.id=p_job;
 if j.id is null or (j.customer_id <> v_me and j.provider_id <> v_me) then raise exception 'not allowed' using errcode='42501'; end if;
 if j.status = 'cancelled' then raise exception 'job is cancelled' using errcode='check_violation'; end if;
 if j.status = 'confirmed' and j.confirmed_at < now() - interval '14 days' then raise exception 'too late to dispute' using errcode='check_violation'; end if;
 if length(trim(coalesce(p_reason,''))) < 3 then raise exception 'reason is required' using errcode='check_violation'; end if;
 select id into v_id from public.disputes where quote_id=j.quote_id and status in ('open','reviewing');
 if v_id is not null then return v_id; end if;
 v_other := case when v_me = j.customer_id then j.provider_id else j.customer_id end;
 insert into public.disputes(quote_id, opened_by, against_id, reason) values (j.quote_id, v_me, v_other, left(trim(p_reason), 2000)) returning id into v_id;
 perform public.notify(v_other, 'Dispute opened', j.title, '/app/post/' || j.post_id);
 return v_id;
end;$$;

create function public.admin_resolve_dispute(p_id uuid, p_status public.dispute_status, p_resolution text) returns void
language plpgsql security definer set search_path='' as $$
declare d record; v_post uuid; v_title text;
begin
 perform public.assert_admin();
 if p_status not in ('reviewing','resolved','dismissed') then raise exception 'bad status' using errcode='check_violation'; end if;
 update public.disputes set status=p_status, resolution=coalesce(nullif(trim(p_resolution),''), resolution),
  resolved_by=case when p_status in ('resolved','dismissed') then (select auth.uid()) else null end
  where id=p_id returning * into d;
 if d.id is null then raise exception 'dispute not found' using errcode='no_data_found'; end if;
 if p_status in ('resolved','dismissed') then
  select j.post_id, p.title into v_post, v_title from public.project_jobs j join public.posts p on p.id=j.post_id where j.quote_id=d.quote_id;
  perform public.notify(d.opened_by, 'Dispute ' || p_status::text, v_title, '/app/post/' || v_post);
  perform public.notify(d.against_id, 'Dispute ' || p_status::text, v_title, '/app/post/' || v_post);
 end if;
end;$$;

-- Browser code may call only these entry points.
revoke execute on function public.file_report(text, uuid, text) from public, anon;
revoke execute on function public.admin_set_report_status(uuid, text, text) from public, anon;
revoke execute on function public.open_dispute(uuid, text) from public, anon;
revoke execute on function public.admin_resolve_dispute(uuid, public.dispute_status, text) from public, anon;
grant execute on function public.file_report(text, uuid, text) to authenticated;
grant execute on function public.admin_set_report_status(uuid, text, text) to authenticated;
grant execute on function public.open_dispute(uuid, text) to authenticated;
grant execute on function public.admin_resolve_dispute(uuid, public.dispute_status, text) to authenticated;

commit;

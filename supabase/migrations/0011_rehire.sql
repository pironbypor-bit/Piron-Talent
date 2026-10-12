-- Piron Talent | migration 0011 | one-tap rehire: a post invited to one provider, private for 24 hours
-- Run after 0010_email_notifications.sql in the Supabase SQL editor.
begin;

alter table public.posts
 add column invited_provider_id uuid references public.profiles(id),
 add column opens_at timestamptz;   -- null: visible to everyone now; future: only the author, the invited provider and admins
create index posts_invited_idx on public.posts(invited_provider_id) where invited_provider_id is not null;

-- Visibility: a post that has not opened yet is private to its author and the invited provider.
drop policy posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (
 author_id = (select auth.uid())
 or (status = 'published' and (opens_at is null or opens_at <= now() or invited_provider_id = (select auth.uid())))
);
drop policy posts_read_public on public.posts;
create policy posts_read_public on public.posts for select to anon using (status = 'published' and (opens_at is null or opens_at <= now()));

-- The invited provider hears about it at once (in-app, and by email through 0010).
create function public.notify_invite() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.invited_provider_id is not null and new.invited_provider_id <> new.author_id then
  perform public.notify(new.invited_provider_id, 'Project invitation', new.title, '/app/post/' || new.id);
 end if;
 return new;
end;$$;
create trigger posts_notify_invite after insert on public.posts for each row execute function public.notify_invite();

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $$
 select case p_title
  when 'New quote' then 'សម្រង់តម្លៃថ្មី'
  when 'Quote accepted' then 'សម្រង់តម្លៃត្រូវបានទទួលយក'
  when 'Quote declined' then 'សម្រង់តម្លៃត្រូវបានបដិសេធ'
  when 'Work delivered' then 'ការងារបានប្រគល់'
  when 'Job confirmed' then 'ការងារបានបញ្ជាក់'
  when 'Job cancelled' then 'ការងារត្រូវបានលុបចោល'
  when 'New review' then 'ការវាយតម្លៃថ្មី'
  when 'New message' then 'សារថ្មី'
  when 'New comment' then 'មតិថ្មី'
  when 'New application' then 'ការដាក់ពាក្យថ្មី'
  when 'Dispute opened' then 'វិវាទត្រូវបានបើក'
  when 'Dispute resolved' then 'វិវាទបានដោះស្រាយ'
  when 'Dispute dismissed' then 'វិវាទត្រូវបានបដិសេធ'
  when 'Dispute reviewing' then 'វិវាទកំពុងពិនិត្យ'
  when 'Identity checked' then 'អត្តសញ្ញាណបានត្រួតពិនិត្យ'
  when 'Identity check rejected' then 'អត្តសញ្ញាណត្រូវបានបដិសេធ'
  when 'Project invitation' then 'ការអញ្ជើញឱ្យធ្វើគម្រោង'
  else p_title end
$$;

commit;

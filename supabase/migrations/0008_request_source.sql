-- Piron Talent | migration 0008 | where a pilot request or application came from (segment pages, ads)
-- Run after 0007_reports_disputes.sql in the Supabase SQL editor.
begin;
alter table public.project_requests add column source text check (source is null or source ~ '^[a-z0-9-]{1,40}$');
alter table public.provider_applications add column source text check (source is null or source ~ '^[a-z0-9-]{1,40}$');
create index project_requests_source_idx on public.project_requests(source, created_at desc) where source is not null;
create index provider_applications_source_idx on public.provider_applications(source, created_at desc) where source is not null;
commit;

-- Piron Work | migration 0034 | company files: managers can always see their own company folder
-- Run after 0033_company_documents.sql. Without this, deleting a document row first made the storage object
-- invisible to the select rule, so the file itself could not be removed from the bucket.
begin;
grant execute on function public.can_use_company_path(text) to anon;
drop policy company_files_read on storage.objects;
create policy company_files_read on storage.objects for select to anon, authenticated
 using (bucket_id = 'company-files' and (public.can_read_company_file(name) or public.can_use_company_path(name)));
commit;

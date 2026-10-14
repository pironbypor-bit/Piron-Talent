-- Piron Talent | migration 0016 | identity level 2: MRZ checksum, duplicate ID number, live-capture flag
-- Run after 0015_reliability_signals.sql in the Supabase SQL editor.
-- A person still approves every check. These are hints for the reviewer, computed on the database so the
-- browser cannot fake them (except the live-capture flag, which is the browser's own observation).
begin;

alter table public.identity_checks
 add column mrz_line text check (mrz_line is null or length(mrz_line) <= 60),
 add column id_live boolean,
 add column selfie_live boolean,
 add column checks jsonb not null default '{}'::jsonb;

create index identity_checks_number_idx on public.identity_checks (id_type, upper(regexp_replace(id_number, '[^A-Za-z0-9]', '', 'g')));

-- ICAO 9303 check digit: weights 7,3,1 repeating; digits count as their value, A-Z as 10..35, filler '<' as 0.
create function public.mrz_check_digit(p text) returns integer language plpgsql immutable set search_path='' as $$
declare s integer := 0; c text; v integer; w integer[] := array[7,3,1]; i integer;
begin
 for i in 1..length(p) loop
  c := substr(p, i, 1);
  v := case when c between '0' and '9' then c::integer when c between 'A' and 'Z' then ascii(c) - 55 else 0 end;
  s := s + v * w[((i - 1) % 3) + 1];
 end loop;
 return s % 10;
end;$$;

-- Before insert: normalise the MRZ line, judge the number format, verify the MRZ check digits against the typed
-- details, and list other accounts that submitted the same ID number. Result lands in checks:
--  format_ok           true/false/null (null when the ID type has no known format)
--  mrz                 'ok' | 'bad_checksum' | 'mismatch' | 'unreadable' | null (no line given)
--  duplicate_user_ids  other user ids with the same type and number, any status
create function public.identity_checks_compute() returns trigger language plpgsql security definer set search_path='' as $$
declare v_num text; v_mrz text; v_doc text; v_result text; v_dups uuid[]; v_format boolean; v_bad boolean := false; v_pn text;
begin
 v_num := upper(regexp_replace(coalesce(new.id_number, ''), '[^A-Za-z0-9]', '', 'g'));
 v_format := case new.id_type
  when 'national_id' then v_num ~ '^[0-9]{9}$'
  when 'passport' then v_num ~ '^[A-Z]{1,2}[0-9]{6,8}$'
  else null end;

 v_mrz := upper(regexp_replace(coalesce(new.mrz_line, ''), '[[:space:]]', '', 'g'));
 new.mrz_line := nullif(v_mrz, '');
 if v_mrz = '' then
  v_result := null;
 elsif length(v_mrz) = 44 and v_mrz ~ '^[A-Z0-9<]+$' then
  -- Passport (TD3), second line: number 1-9 cd 10, birth 14-19 cd 20, expiry 22-27 cd 28, personal no 29-42 cd 43, composite cd 44.
  v_doc := rtrim(substr(v_mrz, 1, 9), '<');
  v_pn := substr(v_mrz, 29, 14);
  v_bad := public.mrz_check_digit(substr(v_mrz, 1, 9))::text <> substr(v_mrz, 10, 1)
        or public.mrz_check_digit(substr(v_mrz, 14, 6))::text <> substr(v_mrz, 20, 1)
        or public.mrz_check_digit(substr(v_mrz, 22, 6))::text <> substr(v_mrz, 28, 1)
        or (v_pn <> repeat('<', 14) and public.mrz_check_digit(v_pn)::text <> substr(v_mrz, 43, 1))
        or (v_pn = repeat('<', 14) and substr(v_mrz, 43, 1) not in ('<', '0'))
        or public.mrz_check_digit(substr(v_mrz, 1, 10) || substr(v_mrz, 14, 7) || substr(v_mrz, 22, 22))::text <> substr(v_mrz, 44, 1);
  if v_bad then v_result := 'bad_checksum';
  elsif v_doc <> v_num or (new.date_of_birth is not null and substr(v_mrz, 14, 6) <> to_char(new.date_of_birth, 'YYMMDD')) then v_result := 'mismatch';
  else v_result := 'ok'; end if;
 elsif length(v_mrz) = 30 and v_mrz ~ '^[A-Z0-9<]+$' then
  -- ID card (TD1), first line: document code 1-2, state 3-5, number 6-14, cd 15, optional 16-30.
  v_doc := rtrim(substr(v_mrz, 6, 9), '<');
  if public.mrz_check_digit(substr(v_mrz, 6, 9))::text <> substr(v_mrz, 15, 1) then v_result := 'bad_checksum';
  elsif v_doc <> v_num then v_result := 'mismatch';
  else v_result := 'ok'; end if;
 else
  v_result := 'unreadable';
 end if;

 select coalesce(array_agg(distinct c.user_id), '{}'::uuid[]) into v_dups
 from public.identity_checks c
 where v_num <> '' and c.user_id <> new.user_id and c.id_type = new.id_type
   and upper(regexp_replace(c.id_number, '[^A-Za-z0-9]', '', 'g')) = v_num;

 new.checks := jsonb_build_object('format_ok', v_format, 'mrz', v_result, 'duplicate_user_ids', to_jsonb(v_dups));
 return new;
end;$$;

create trigger identity_checks_compute before insert on public.identity_checks for each row execute function public.identity_checks_compute();

commit;

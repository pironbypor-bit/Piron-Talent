-- Piron Work | migration 0056 | the booking notices: group, Khmer title, and quiet quote notice during a booking
-- Patches three existing functions in place (read the live definition, add the new lines, replace).
begin;

do $p$
declare d text;
begin
 -- 1. group: bookings belong to Projects and quotes
 d := pg_get_functiondef('public.notification_group(text)'::regprocedure);
 d := replace(d, '''Project invitation'', ''New application'')', '''Project invitation'', ''New application'', ''Booking request'', ''Booking accepted'', ''Booking declined'', ''Booking changed'', ''Booking cancelled'', ''Booking expired'')');
 execute d;
 -- 2. Khmer titles, inserted before the final else
 d := pg_get_functiondef('public.notification_title_km(text)'::regprocedure);
 d := replace(d, 'else p_title end',
  'when ''Booking request'' then ''សំណើកក់'' when ''Booking accepted'' then ''ការកក់ត្រូវបានទទួលយក'' when ''Booking declined'' then ''ការកក់ត្រូវបានបដិសេធ'' '
  || 'when ''Booking changed'' then ''ការកក់ត្រូវបានកែប្រែ'' when ''Booking cancelled'' then ''ការកក់ត្រូវបានលុបចោល'' when ''Booking expired'' then ''ការកក់ផុតកំណត់'' else p_title end');
 execute d;
 -- 3. no "New quote" notice to the customer when the quote is the one made by a booking
 d := pg_get_functiondef('public.notify_quote()'::regprocedure);
 d := replace(d, 'if new.post_id is null then return new; end if;', 'if new.post_id is null or current_setting(''piron.booking'', true) = ''1'' then return new; end if;');
 execute d;
end
$p$;

commit;

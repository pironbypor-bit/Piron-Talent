-- Piron Work | migration 0041 | Khmer titles for the notifications added in 0037 to 0040 (email and phone push)
-- Run after 0040_payout_accounts.sql. Patches the latest function in place instead of repeating all of it.
do $$
declare d text;
begin
 select pg_get_functiondef('public.notification_title_km(text)'::regprocedure) into d;
 if position('Shift scheduled' in d) = 0 then
  d := replace(d, 'else p_title end',
   'when ''Shift scheduled'' then ''បានកំណត់វេនការងារ'' '
   || 'when ''Shift cancelled'' then ''វេនការងារត្រូវបានលុបចោល'' '
   || 'when ''Task assigned'' then ''បានចាត់ភារកិច្ចឱ្យអ្នក'' '
   || 'when ''Task done'' then ''ភារកិច្ចបានបញ្ចប់'' '
   || 'when ''Invoice received'' then ''បានទទួលវិក្កយបត្រ'' '
   || 'when ''Payment marked as paid'' then ''ការទូទាត់ត្រូវបានសម្គាល់ថាបានបង់'' '
   || 'when ''Payment received'' then ''បានទទួលការទូទាត់'' '
   || 'when ''Payment not received'' then ''មិនទាន់ទទួលការទូទាត់'' '
   || 'when ''Invoice cancelled'' then ''វិក្កយបត្រត្រូវបានបោះបង់'' '
   || 'when ''Payout account approved'' then ''គណនីទទួលប្រាក់ត្រូវបានអនុម័ត'' '
   || 'when ''Payout account rejected'' then ''គណនីទទួលប្រាក់ត្រូវបានបដិសេធ'' '
   || 'else p_title end');
  execute d;
 end if;
end $$;

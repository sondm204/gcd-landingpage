do $$
declare payload jsonb; a jsonb; retry jsonb; request_id uuid:=gen_random_uuid();
begin
  assert not has_table_privilege('anon','public.event_registrations','select');
  assert not has_table_privilege('authenticated','public.event_registrations','insert');
  assert not has_function_privilege('anon','public.register_event_attendee(uuid,text,jsonb)','execute');
  payload:='{"full_name":"Registration Test","birth_date":"2001-01-15","phone":"+84910000001","email":"attendee@example.test","facebook_url":"https://facebook.com/attendee","is_jci":true,"chapter":"JCI Test"}'::jsonb;
  a:=public.register_event_attendee(request_id,'same',payload);
  retry:=public.register_event_attendee(request_id,'same',payload);
  assert a->>'reference'=retry->>'reference' and (retry->>'reused')::boolean;
  assert (select count(*)=1 from public.event_registrations);
  begin perform public.register_event_attendee(request_id,'different',payload); raise exception 'Changed request accepted'; exception when raise_exception then if sqlerrm<>'REQUEST_KEY_REUSED' then raise; end if; end;
  begin perform public.register_event_attendee(gen_random_uuid(),'duplicate-phone',jsonb_set(payload,'{email}','"another@example.test"')); raise exception 'Duplicate phone accepted'; exception when unique_violation then null; end;
  begin perform public.register_event_attendee(gen_random_uuid(),'duplicate-email',jsonb_set(payload,'{phone}','"+84910000002"')); raise exception 'Duplicate email accepted'; exception when unique_violation then null; end;
  payload:=jsonb_set(jsonb_set(payload,'{email}','"fresh@example.test"'),'{phone}','"+84910000003"');
  begin perform public.register_event_attendee(gen_random_uuid(),'chapter-missing',jsonb_set(payload,'{chapter}','""')); raise exception 'JCI chapter missing'; exception when check_violation then null; end;
  begin perform public.register_event_attendee(gen_random_uuid(),'future-birth',jsonb_set(payload,'{birth_date}','"2999-01-01"')); raise exception 'Future date accepted'; exception when check_violation then null; end;
  a:=public.register_event_attendee(gen_random_uuid(),'non-member',jsonb_set(jsonb_set(payload,'{is_jci}','false'),'{chapter}','""'));
  assert (select count(*)=2 from public.event_registrations);
end $$;

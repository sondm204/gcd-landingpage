-- Throwaway database only; admin fixture is created by invariants.sql.
do $$
declare admin uuid:='11111111-1111-4111-8111-111111111111'; payload jsonb; a jsonb; b jsonb; request_id uuid:=gen_random_uuid(); proposal uuid; stamp timestamptz;
begin
  assert not has_function_privilege('anon','public.set_booth_position_lock(smallint,boolean,uuid)','execute');
  assert not has_function_privilege('authenticated','public.set_booth_position_lock(smallint,boolean,uuid)','execute');
  assert not has_table_privilege('anon','public.booth_position_lock_events','select');
  begin perform public.set_booth_position_lock(18::smallint,true,'99999999-9999-4999-8999-999999999999'); raise exception 'Non-admin locked position'; exception when raise_exception then if sqlerrm<>'NOT_ADMIN' then raise; end if; end;
  begin perform public.set_booth_position_lock(26::smallint,true,admin); raise exception 'Reserved position changed'; exception when raise_exception then if sqlerrm<>'INVALID_POSITION' then raise; end if; end;
  payload:='{"position_id":18,"brand":"Lock Test","booth_name":"Lock Booth","contact_name":"Test Contact","email":"lock@example.test","phone":"0901234567","website":"","category":"Other","description":""}'::jsonb;
  a:=public.submit_booth_proposal(request_id,'lock-test-a',payload,'[]'); proposal:=(a->>'id')::uuid;
  b:=public.submit_booth_proposal(gen_random_uuid(),'lock-test-b',payload,'[]');
  perform public.set_booth_position_lock(18::smallint,true,admin);
  perform public.set_booth_position_lock(18::smallint,true,admin);
  assert (select is_locked and not is_booked and pending_count=2 from public.booth_public_map where id=18);
  assert (select count(*)=1 from public.booth_position_lock_events where position_id=18), 'Idempotent lock duplicated audit';
  assert (public.submit_booth_proposal(request_id,'lock-test-a',payload,'[]')->>'reused')::boolean, 'Retry of a committed proposal must still succeed';
  begin perform public.submit_booth_proposal(gen_random_uuid(),'blocked-new',payload,'[]'); raise exception 'Locked position accepted proposal'; exception when raise_exception then if sqlerrm<>'BOOTH_LOCKED' then raise; end if; end;
  begin perform public.review_booth_proposal(proposal,'approved',admin,''); raise exception 'Locked proposal approved'; exception when raise_exception then if sqlerrm<>'BOOTH_LOCKED' then raise; end if; end;
  perform public.review_booth_proposal((b->>'id')::uuid,'rejected',admin,'Allowed while locked');
  assert (select status='pending' from public.booth_proposals where id=proposal), 'Lock changed pending proposal';
  perform public.set_booth_position_lock(18::smallint,false,admin);
  perform public.review_booth_proposal(proposal,'approved',admin,'');
  perform public.set_booth_position_lock(18::smallint,true,admin);
  select updated_at into stamp from public.booth_proposals where id=proposal;
  perform public.update_confirmed_booth(proposal,admin,stamp,payload,'[]','Editing in place remains allowed');
  assert (select is_locked and is_booked from public.booth_public_map where id=18), 'Lock erased confirmed booth';
  perform public.set_booth_position_lock(17::smallint,true,admin);
  select updated_at into stamp from public.booth_proposals where id=proposal;
  begin perform public.update_confirmed_booth(proposal,admin,stamp,jsonb_set(payload,'{position_id}','17'),'[]','Blocked move'); raise exception 'Moved into locked position'; exception when raise_exception then if sqlerrm<>'BOOTH_LOCKED' then raise; end if; end;
  perform public.set_booth_position_lock(17::smallint,false,admin);
  perform public.update_confirmed_booth(proposal,admin,stamp,jsonb_set(payload,'{position_id}','17'),'[]','Unlocked move');
  assert (select is_locked and not is_booked from public.booth_public_map where id=18), 'Moving out should preserve lock';
  perform public.set_booth_position_lock(18::smallint,false,admin);
end $$;

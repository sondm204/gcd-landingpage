do $$
declare a jsonb; b jsonb; payload jsonb; v_id uuid; v_stamp timestamptz; v_new_stamp timestamptz;
begin
  assert not has_table_privilege('anon','public.booth_change_events','select');
  assert not has_function_privilege('authenticated','public.update_confirmed_booth(uuid,uuid,timestamptz,jsonb,jsonb,text)','execute');
  payload := '{"position_id":4,"brand":"Original Brand","booth_name":"Original Booth","contact_name":"Test Contact","email":"test@example.test","phone":"0901234567","website":"https://example.test","category":"Khác","description":"A sufficiently long description for an admin edit test."}'::jsonb;
  a := public.submit_booth_proposal('66666666-6666-4666-8666-666666666666','edit-a',payload,'[]');
  v_id := (a->>'id')::uuid;
  perform public.review_booth_proposal(v_id,'approved','11111111-1111-4111-8111-111111111111','');
  select updated_at into v_stamp from public.booth_proposals where id=v_id;
  payload := jsonb_set(payload,'{brand}','"Updated Brand"');
  perform public.update_confirmed_booth(v_id,'11111111-1111-4111-8111-111111111111',v_stamp,payload,'["admin/image.jpg"]','Updated brand and image');
  assert (select brand='Updated Brand' and image_paths='["admin/image.jpg"]'::jsonb from public.booth_proposals where id=v_id);
  assert (select count(*)=1 from public.booth_change_events where proposal_id=v_id), 'Edits must be audited';
  select updated_at into v_new_stamp from public.booth_proposals where id=v_id;
  assert v_new_stamp>v_stamp, 'Updates need a new concurrency token';
  begin
    perform public.update_confirmed_booth(v_id,'11111111-1111-4111-8111-111111111111',v_stamp,payload,'[]','');
    raise exception 'Stale edit should fail';
  exception when raise_exception then if sqlerrm<>'STALE_PROPOSAL' then raise; end if; end;
  begin
    perform public.update_confirmed_booth(v_id,'99999999-9999-4999-8999-999999999999',v_new_stamp,payload,'[]','');
    raise exception 'Non-admin edit should fail';
  exception when raise_exception then if sqlerrm<>'NOT_ADMIN' then raise; end if; end;
  payload := jsonb_set(payload,'{position_id}','5');
  b := public.submit_booth_proposal('77777777-7777-4777-8777-777777777777','edit-b',payload,'[]');
  perform public.update_confirmed_booth(v_id,'11111111-1111-4111-8111-111111111111',v_new_stamp,payload,'[]','Moved to B05');
  assert (select not is_booked from public.booth_public_map where id=4), 'Old position must be released';
  assert (select is_booked and pending_count=0 from public.booth_public_map where id=5), 'New position must be confirmed';
  assert (select status='rejected' from public.booth_proposals where id=(b->>'id')::uuid), 'Pending at destination must close';
  select updated_at into v_new_stamp from public.booth_proposals where id=v_id;
  payload := jsonb_set(payload,'{position_id}','6');
  b := public.submit_booth_proposal('88888888-8888-4888-8888-888888888888','edit-c',payload,'[]');
  perform public.review_booth_proposal((b->>'id')::uuid,'approved','11111111-1111-4111-8111-111111111111','');
  begin
    perform public.update_confirmed_booth(v_id,'11111111-1111-4111-8111-111111111111',v_new_stamp,payload,'[]','');
    raise exception 'Move to occupied position should fail';
  exception when raise_exception then if sqlerrm<>'BOOTH_TAKEN' then raise; end if; end;
  assert (select position_id=5 from public.booth_proposals where id=v_id), 'Failed move must not alter source';
  assert (select is_booked from public.booth_public_map where id=6), 'Failed move must not alter occupant';
end;
$$;

insert into auth.users values('11111111-1111-4111-8111-111111111111', 'admin@example.test');
insert into public.booth_admins(user_id) values('11111111-1111-4111-8111-111111111111');

do $$
declare a jsonb; b jsonb; retry jsonb; payload jsonb;
begin
  assert (select count(*) = 34 from public.booth_public_map), 'Public plan must have 34 positions';
  assert (select count(*) = 26 from public.booth_positions where is_active and is_bookable), '26 booths accept proposals';
  assert (select count(*)=5 from public.booth_public_map where code like 'VH%' and not is_bookable), 'Culture booths must be reserved';
  assert (select count(*)=3 from public.booth_public_map where code like 'BTC%' and not is_bookable), 'Organizer booths must be reserved';
  assert (select count(*)=21 from public.booth_public_map where code like 'TM%' and is_bookable), '21 commercial booths';
  assert (select x=28.375 and y=39.375 from public.booth_public_map where code='VH05'), 'VH05 must sit above TM01';
  assert (select x=24.75 from public.booth_public_map where code='VH04'), 'VH04 returns to original row';
  assert (select code='TM21' and is_bookable and y=45.5 from public.booth_public_map where id=34), 'TM21 fills gap above TM12';
  assert (select count(*)=5 from public.booth_public_map where code like 'TT%' and is_bookable), '5 sponsor booths';
  assert not exists(select 1 from public.booth_public_map where id>34), 'Retired booths hidden';
  assert not has_table_privilege('anon', 'public.booth_proposals', 'select'), 'Anonymous users must not read PII';
  assert not has_table_privilege('anon', 'public.booth_vouchers', 'select'), 'Public cannot enumerate discount codes';
  assert not has_table_privilege('authenticated', 'public.booth_vouchers', 'insert'), 'Auth alone cannot create vouchers';
  assert not has_table_privilege('authenticated', 'public.booth_proposals', 'select'), 'A login alone is not admin authorization';
  assert not has_function_privilege('anon', 'public.review_booth_proposal(uuid,text,uuid,text)', 'execute'), 'Anonymous review forbidden';
  assert not has_function_privilege('authenticated', 'public.submit_booth_proposal(uuid,text,jsonb,jsonb)', 'execute'), 'Writes must go through server validation';
  assert (select public = false from storage.buckets where id = 'booth-proposals'), 'Uploads must be private';
  assert not exists(select 1 from information_schema.columns where table_schema='public' and table_name='booth_public_map' and column_name in ('email','phone','contact_name','image_paths')), 'Public projection must not expose PII';
  payload := '{"position_id":1,"brand":"Example Brand","booth_name":"Example booth","contact_name":"Test User","email":"user@example.test","phone":"0901234567","website":"https://example.test","category":"Khác","description":"A sufficiently long booth description."}'::jsonb;
  for retry in select to_jsonb(n) from generate_series(26,40) n where n<>34 loop
    begin
      perform public.submit_booth_proposal(gen_random_uuid(), 'reserved-position-test', jsonb_set(payload, '{position_id}', retry), '[]');
      raise exception 'Reserved or retired position accepted a proposal';
    exception when raise_exception then if sqlerrm <> 'INVALID_POSITION' then raise; end if; end;
  end loop;
  a := public.submit_booth_proposal('22222222-2222-4222-8222-222222222222', 'fingerprint-a', payload, '[]');
  b := public.submit_booth_proposal('33333333-3333-4333-8333-333333333333', 'fingerprint-b', payload, '[]');
  assert (select count(*) = 2 from public.booth_proposals where position_id=1 and status='pending'), 'Competing pending proposals must be accepted';
  assert (select not is_booked and pending_count=2 from public.booth_public_map where id=1), 'Pending proposals must not reserve the position';
  retry := public.submit_booth_proposal('22222222-2222-4222-8222-222222222222', 'fingerprint-a', payload, '[]');
  assert retry->>'id' = a->>'id' and (retry->>'reused')::boolean, 'Retry must be idempotent';
  begin
    perform public.submit_booth_proposal('22222222-2222-4222-8222-222222222222', 'changed', payload, '[]');
    raise exception 'Different payload with reused key should fail';
  exception when raise_exception then if sqlerrm <> 'REQUEST_KEY_REUSED' then raise; end if; end;
  begin
    perform public.review_booth_proposal((a->>'id')::uuid, 'approved', '99999999-9999-4999-8999-999999999999', '');
    raise exception 'Non-admin should fail';
  exception when raise_exception then if sqlerrm <> 'NOT_ADMIN' then raise; end if; end;
  perform public.review_booth_proposal((a->>'id')::uuid, 'approved', '11111111-1111-4111-8111-111111111111', 'Confirmed');
  assert (select status='approved' from public.booth_proposals where id=(a->>'id')::uuid), 'Winner must be approved';
  assert (select status='rejected' from public.booth_proposals where id=(b->>'id')::uuid), 'Competing pending proposals must be closed';
  assert (select is_booked and pending_count=0 from public.booth_public_map where id=1), 'Public status must reflect approval';
  assert (select count(*)=2 from public.booth_review_events), 'Both decisions must be audited';
  begin
    perform public.review_booth_proposal((b->>'id')::uuid, 'approved', '11111111-1111-4111-8111-111111111111', '');
    raise exception 'Already reviewed proposal should fail';
  exception when raise_exception then if sqlerrm <> 'ALREADY_REVIEWED' then raise; end if; end;
  begin
    perform public.submit_booth_proposal('44444444-4444-4444-8444-444444444444', 'fingerprint-c', payload, '[]');
    raise exception 'Booked position should reject new proposals';
  exception when raise_exception then if sqlerrm <> 'BOOTH_TAKEN' then raise; end if; end;
  payload := jsonb_set(payload, '{position_id}', '2');
  a := public.submit_booth_proposal('55555555-5555-4555-8555-555555555555', 'fingerprint-d', payload, '[]');
  perform public.review_booth_proposal((a->>'id')::uuid, 'rejected', '11111111-1111-4111-8111-111111111111', 'Not suitable');
  assert (select not is_booked from public.booth_public_map where id=2), 'Rejecting must not book a position';
  assert public.booth_consume_rate_limit('test-key',2,3600);
  assert public.booth_consume_rate_limit('test-key',2,3600);
  assert not public.booth_consume_rate_limit('test-key',2,3600), 'Rate limit must survive separate requests';
end;
$$;

-- Used by the harness for simultaneous approvals on the same position.
insert into public.booth_proposals(id, request_key, fingerprint, position_id, brand, booth_name, contact_name, email, phone, category, description)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',gen_random_uuid(),'race-a',3,'Race A','Booth A','Contact A','a@example.test','0901234567','Khác','Concurrent approval test proposal A.'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',gen_random_uuid(),'race-b',3,'Race B','Booth B','Contact B','b@example.test','0901234567','Khác','Concurrent approval test proposal B.');

do $$
declare payload jsonb; key uuid := gen_random_uuid();
begin
  insert into public.booth_vouchers(code,type,value,usage_limit,created_by) values('ONCE','percent',10,1,'11111111-1111-4111-8111-111111111111');
  payload := '{"position_id":20,"brand":"Voucher Test","booth_name":"Voucher Booth","contact_name":"Test User","email":"voucher@example.test","phone":"0901234567","category":"Khác","description":"Voucher test","payment":{"discount_code":"ONCE","base":5000000,"discount":500000,"amount":4500000}}'::jsonb;
  perform public.submit_booth_proposal(key,'voucher-test',payload,'[]');
  perform public.submit_booth_proposal(key,'voucher-test',payload,'[]');
  assert (select used_count=1 from public.booth_vouchers where code='ONCE'), 'Retry cannot consume another voucher use';
  begin
    perform public.submit_booth_proposal(gen_random_uuid(),'voucher-exhausted',payload,'[]');
    raise exception 'Exhausted voucher accepted';
  exception when raise_exception then if sqlerrm<>'VOUCHER_UNAVAILABLE' then raise; end if; end;
  assert (select count(*)=1 from public.booth_proposals where position_id=20), 'Exhausted voucher must roll back the registration';
end; $$;

-- Throwaway database only. Uses the account/admin fixtures created by games.sql/invariants.sql.
do $$
declare p uuid; card text; token text; token2 text; result jsonb; snapshot jsonb;
begin
  select id,passport_code into p,card from public.game_players where phone='+84900000001';
  select qr_token into token from public.event_passport_stations where booth_id=1;
  select qr_token into token2 from public.event_passport_stations where booth_id=2;
  begin perform public.event_passport_claim(p,token); raise exception 'Collection should start closed'; exception when raise_exception then if sqlerrm<>'COLLECTION_CLOSED' then raise; end if; end;
  begin perform public.event_passport_configure('99999999-9999-4999-8999-999999999999',true,true,2,'Test gift'); raise exception 'Non-admin configured event'; exception when raise_exception then if sqlerrm<>'NOT_ADMIN' then raise; end if; end;
  perform public.event_passport_configure('11111111-1111-4111-8111-111111111111',true,true,2,'Test gift');
  result:=public.event_passport_claim(p,token); assert (result->>'reused')::boolean=false;
  result:=public.event_passport_claim(p,token); assert (result->>'reused')::boolean=true;
  begin perform public.event_passport_redeem('11111111-1111-4111-8111-111111111111',card); raise exception 'Gift before threshold'; exception when raise_exception then if sqlerrm<>'NOT_ENOUGH_STAMPS' then raise; end if; end;
  perform public.event_passport_claim(p,token2);
  snapshot:=public.event_passport_state(p); assert (snapshot->>'count')::integer=2;
  assert not(snapshot::text like '%qr_token%'), 'Player passport exposed station QR secrets';
  perform public.event_passport_station_update('11111111-1111-4111-8111-111111111111',1::smallint,false,'Renamed station',true);
  snapshot:=public.event_passport_state(p); assert (snapshot->>'count')::integer=2, 'Disabling station erased earned stamps';
  begin perform public.event_passport_claim(p,token); raise exception 'Rotated QR still valid'; exception when raise_exception then if sqlerrm<>'QR_INVALID' then raise; end if; end;
  result:=public.event_passport_redeem('11111111-1111-4111-8111-111111111111',card); assert (result->>'reused')::boolean=false;
  result:=public.event_passport_redeem('11111111-1111-4111-8111-111111111111',card); assert (result->>'reused')::boolean=true;
  assert (select count(*)=1 from public.event_passport_redemptions where player_id=p), 'Gift redeemed twice';
  assert not has_table_privilege('anon','public.event_passport_stations','select');
  assert not has_table_privilege('authenticated','public.event_passport_redemptions','select');
  assert not has_function_privilege('anon','public.event_passport_claim(uuid,text)','execute');
  assert not has_function_privilege('authenticated','public.event_passport_redeem(uuid,text)','execute');
end $$;
-- Prepare an unredeemed passport for the concurrent-redemption test.
select public.event_passport_claim(p.id,s.qr_token) from public.game_players p cross join public.event_passport_stations s where p.phone='+84900000003' and s.booth_id in(2,3);

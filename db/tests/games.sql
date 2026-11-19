-- Executed only in the throwaway test cluster created by scripts/test-booths-db.mjs.
do $$
declare p uuid; other uuid; a jsonb; saved jsonb; total bigint; attempts integer;
begin
  a:=public.game_open_session('+84900000001','Người chơi A','người chơi a',repeat('a',64)); p:=(a->>'id')::uuid;
  perform public.game_open_session('+84900000001','NGƯỜI CHƠI A','người chơi a',repeat('b',64));
  if (select count(*) from public.game_players where phone='+84900000001')<>1 then raise exception 'Phone duplicated'; end if;
  begin
    perform public.game_open_session('+84900000001','Tên khác','tên khác',repeat('c',64));
    raise exception 'Expected account mismatch';
  exception when raise_exception then if sqlerrm<>'ACCOUNT_MISMATCH' then raise; end if; end;
  begin
    perform public.game_open_session('+84900000002','Người chơi A','người chơi a',repeat('c',64));
    raise exception 'Expected unique name';
  exception when unique_violation then null; end;
  a:=public.game_open_session('+84900000002','Người chơi B','người chơi b',repeat('c',64)); other:=(a->>'id')::uuid;
  for attempts in 1..3 loop
    a:=public.game_start_attempt(p,'print',case when attempts=2 then 'event' else 'online' end,gen_random_uuid(),123);
    if (a->>'attempt_number')::integer<>attempts then raise exception 'Wrong attempt count'; end if;
    begin
      perform public.game_finish_attempt(other,(a->>'id')::uuid,10,repeat('d',64),'{}');
      raise exception 'Expected ownership failure';
    exception when raise_exception then if sqlerrm<>'ATTEMPT_NOT_FOUND' then raise; end if; end;
    saved:=public.game_finish_attempt(p,(a->>'id')::uuid,attempts*20,repeat('d',64),'{}');
    perform public.game_finish_attempt(p,(a->>'id')::uuid,attempts*20,repeat('d',64),'{}');
  end loop;
  begin
    perform public.game_start_attempt(p,'print','online',gen_random_uuid(),123);
    raise exception 'Expected attempt limit';
  exception when raise_exception then if sqlerrm<>'ATTEMPT_LIMIT' then raise; end if; end;
  a:=public.game_start_attempt(p,'postcard','online',gen_random_uuid(),1);
  perform public.game_finish_attempt(p,(a->>'id')::uuid,100,repeat('e',64),'{"place_id":"01","frame":"vermilion","message":"Explore Vietnam with me","sender":"A"}');
  perform public.game_finish_attempt(p,(a->>'id')::uuid,100,repeat('e',64),'{"place_id":"01","frame":"vermilion","message":"Explore Vietnam with me","sender":"A"}');
  if (select count(*) from public.game_letters where player_id=p)<>1 then raise exception 'Duplicate letter on retry'; end if;
  select score into total from public.game_leaderboard(null,0) where player_id=p;
  if total<>160 then raise exception 'Total must sum best game scores only, got %',total; end if;
  select score into total from public.game_leaderboard('print',0) where player_id=p;
  if total<>60 then raise exception 'Game board must take max score'; end if;
  if has_table_privilege('anon','public.game_players','select') or has_table_privilege('authenticated','public.game_letters','select')
    or has_table_privilege('anon','public.game_sessions','select') or has_function_privilege('anon','public.game_open_session(text,text,text,text)','execute')
    or has_function_privilege('authenticated','public.game_finish_attempt(uuid,uuid,integer,text,jsonb)','execute') then raise exception 'Private game data exposed'; end if;
end $$;
select public.game_open_session('+84900000003','Concurrent Player','concurrent player',repeat('f',64));

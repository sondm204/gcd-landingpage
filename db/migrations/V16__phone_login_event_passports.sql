-- Existing numbers sign in directly. A display name is required only when creating an account.
create or replace function public.game_open_session(p_phone text,p_name text,p_name_key text,p_token_hash text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_player public.game_players;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_phone,0));
  select * into v_player from public.game_players where phone=p_phone for update;
  if not found then
    if p_name is null or p_name_key is null then raise exception 'NAME_REQUIRED'; end if;
    insert into public.game_players(phone,display_name,name_key) values(p_phone,p_name,p_name_key) returning * into v_player;
  end if;
  insert into public.game_sessions(token_hash,player_id) values(p_token_hash,v_player.id);
  return jsonb_build_object('id',v_player.id,'display_name',v_player.display_name);
end $$;

alter table public.game_players add column passport_code text not null
  default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','') unique;
create table public.event_passport_settings (
  id boolean primary key default true check(id),
  collecting_open boolean not null default false,
  redeeming_open boolean not null default false,
  minimum_stamps integer check(minimum_stamps between 1 and 1000),
  reward_label text not null default 'Quà tặng sự kiện' check(char_length(reward_label) between 1 and 120),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check(not redeeming_open or minimum_stamps is not null)
);
insert into public.event_passport_settings(id) values(true);
create table public.event_passport_stations (
  booth_id smallint primary key references public.booth_positions(id),
  qr_token text not null unique default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),
  enabled boolean not null default true,
  title text check(char_length(title) between 1 and 120),
  updated_at timestamptz not null default now()
);
insert into public.event_passport_stations(booth_id)
  select id from public.booth_positions where is_active and zone<>'Gian BTC';
create table public.event_passport_stamps (
  player_id uuid not null references public.game_players(id),
  booth_id smallint not null references public.event_passport_stations(booth_id),
  received_at timestamptz not null default now(),
  primary key(player_id,booth_id)
);
create table public.event_passport_redemptions (
  player_id uuid primary key references public.game_players(id),
  stamp_count integer not null check(stamp_count>0),
  required_count integer not null check(required_count>0),
  reward_label text not null,
  redeemed_at timestamptz not null default now(),
  redeemed_by uuid not null references auth.users(id)
);
alter table public.event_passport_settings enable row level security;
alter table public.event_passport_stations enable row level security;
alter table public.event_passport_stamps enable row level security;
alter table public.event_passport_redemptions enable row level security;
revoke all on public.event_passport_settings,public.event_passport_stations,public.event_passport_stamps,public.event_passport_redemptions from public,anon,authenticated;
grant all on public.event_passport_settings,public.event_passport_stations,public.event_passport_stamps,public.event_passport_redemptions to service_role;

create function public.event_passport_state(p_player uuid)
returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object(
  'card_code',p.passport_code,
  'settings',(select jsonb_build_object('collecting_open',collecting_open,'redeeming_open',redeeming_open,'minimum_stamps',minimum_stamps,'reward_label',reward_label) from public.event_passport_settings),
  'count',(select count(*) from public.event_passport_stamps where player_id=p_player),
  'redemption',(select jsonb_build_object('redeemed_at',redeemed_at,'stamp_count',stamp_count,'reward_label',reward_label) from public.event_passport_redemptions where player_id=p_player),
  'stations',coalesce((select jsonb_agg(jsonb_build_object('id',s.booth_id,'code',b.code,'zone',b.zone,'name',coalesce(s.title,a.booth_name,a.brand,b.code),'active',s.enabled and b.is_active,'received_at',stamp.received_at) order by s.booth_id)
    from public.event_passport_stations s join public.booth_positions b on b.id=s.booth_id
    left join public.booth_proposals a on a.position_id=b.id and a.status='approved'
    left join public.event_passport_stamps stamp on stamp.booth_id=s.booth_id and stamp.player_id=p_player
    where (s.enabled and b.is_active) or stamp.player_id is not null),'[]'::jsonb)
 ) from public.game_players p where p.id=p_player;
$$;

create function public.event_passport_claim(p_player uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare s public.event_passport_stations; config public.event_passport_settings; previous timestamptz; stamp_time timestamptz;
begin
  perform 1 from public.game_players where id=p_player for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  select * into config from public.event_passport_settings where id for share;
  select * into s from public.event_passport_stations where qr_token=p_token for share;
  if not found then raise exception 'QR_INVALID'; end if;
  select received_at into previous from public.event_passport_stamps where player_id=p_player and booth_id=s.booth_id;
  if found then return jsonb_build_object('reused',true,'station_id',s.booth_id,'received_at',previous); end if;
  if not config.collecting_open then raise exception 'COLLECTION_CLOSED'; end if;
  if not s.enabled or not exists(select 1 from public.booth_positions where id=s.booth_id and is_active) then raise exception 'STATION_DISABLED'; end if;
  insert into public.event_passport_stamps(player_id,booth_id) values(p_player,s.booth_id) returning received_at into stamp_time;
  return jsonb_build_object('reused',false,'station_id',s.booth_id,'received_at',stamp_time);
end $$;

create function public.event_passport_admin_state(p_admin uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  return jsonb_build_object('settings',(select to_jsonb(c) from public.event_passport_settings c),
    'stations',coalesce((select jsonb_agg(jsonb_build_object('id',s.booth_id,'code',b.code,'zone',b.zone,'name',coalesce(s.title,a.booth_name,a.brand,b.code),'title',s.title,'enabled',s.enabled,'active',b.is_active,'qr_token',s.qr_token,'visits',(select count(*) from public.event_passport_stamps where booth_id=s.booth_id)) order by s.booth_id)
      from public.event_passport_stations s join public.booth_positions b on b.id=s.booth_id left join public.booth_proposals a on a.position_id=b.id and a.status='approved'),'[]'::jsonb),
    'total_stamps',(select count(*) from public.event_passport_stamps),'total_players',(select count(distinct player_id) from public.event_passport_stamps),'total_redemptions',(select count(*) from public.event_passport_redemptions));
end $$;

create function public.event_passport_configure(p_admin uuid,p_collecting boolean,p_redeeming boolean,p_minimum integer,p_reward text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  update public.event_passport_settings set collecting_open=p_collecting,redeeming_open=p_redeeming,minimum_stamps=p_minimum,reward_label=btrim(p_reward),updated_at=now(),updated_by=p_admin where id;
end $$;
create function public.event_passport_station_update(p_admin uuid,p_id smallint,p_enabled boolean,p_title text,p_rotate boolean)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  update public.event_passport_stations set enabled=p_enabled,title=nullif(btrim(p_title),''),updated_at=now(),
    qr_token=case when p_rotate then replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','') else qr_token end where booth_id=p_id;
  if not found then raise exception 'QR_INVALID'; end if;
end $$;
create function public.event_passport_sync(p_admin uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  insert into public.event_passport_stations(booth_id) select id from public.booth_positions where is_active and zone<>'Gian BTC' on conflict do nothing;
end $$;
create function public.event_passport_lookup(p_admin uuid,p_card text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.game_players;
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  select * into p from public.game_players where passport_code=p_card;
  if not found then raise exception 'PASSPORT_NOT_FOUND'; end if;
  return jsonb_build_object('player',jsonb_build_object('id',p.id,'display_name',p.display_name),'passport',public.event_passport_state(p.id));
end $$;
create function public.event_passport_redeem(p_admin uuid,p_card text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.game_players; config public.event_passport_settings; redemption public.event_passport_redemptions; stamps integer;
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin and active) then raise exception 'NOT_ADMIN'; end if;
  select * into p from public.game_players where passport_code=p_card for update;
  if not found then raise exception 'PASSPORT_NOT_FOUND'; end if;
  select * into redemption from public.event_passport_redemptions where player_id=p.id;
  if found then return jsonb_build_object('reused',true,'redemption',to_jsonb(redemption)); end if;
  select * into config from public.event_passport_settings where id for share;
  if not config.redeeming_open or config.minimum_stamps is null then raise exception 'REDEMPTION_CLOSED'; end if;
  select count(*) into stamps from public.event_passport_stamps where player_id=p.id;
  if stamps<config.minimum_stamps then raise exception 'NOT_ENOUGH_STAMPS'; end if;
  insert into public.event_passport_redemptions(player_id,stamp_count,required_count,reward_label,redeemed_by) values(p.id,stamps,config.minimum_stamps,config.reward_label,p_admin) returning * into redemption;
  return jsonb_build_object('reused',false,'redemption',to_jsonb(redemption));
end $$;

revoke all on function public.event_passport_state(uuid), public.event_passport_claim(uuid,text), public.event_passport_admin_state(uuid), public.event_passport_configure(uuid,boolean,boolean,integer,text), public.event_passport_station_update(uuid,smallint,boolean,text,boolean), public.event_passport_sync(uuid), public.event_passport_lookup(uuid,text), public.event_passport_redeem(uuid,text) from public,anon,authenticated;
grant execute on function public.event_passport_state(uuid), public.event_passport_claim(uuid,text), public.event_passport_admin_state(uuid), public.event_passport_configure(uuid,boolean,boolean,integer,text), public.event_passport_station_update(uuid,smallint,boolean,text,boolean), public.event_passport_sync(uuid), public.event_passport_lookup(uuid,text), public.event_passport_redeem(uuid,text) to service_role;

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  display_name text not null check (char_length(display_name) between 2 and 40),
  name_key text not null unique check (char_length(name_key) between 2 and 100),
  created_at timestamptz not null default now()
);
create table public.game_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  player_id uuid not null references public.game_players(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '30 days'
);
create index game_sessions_player on public.game_sessions(player_id);
create table public.game_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.game_players(id),
  game text not null check (game in ('craft','print','rhythm','place','postcard')),
  mode text not null check (mode in ('online','event')),
  request_key uuid not null,
  attempt_number smallint not null check (attempt_number between 1 and 3),
  seed bigint not null check (seed between 0 and 4294967295),
  status text not null default 'started' check (status in ('started','completed','abandoned')),
  score integer check (score between 0 and 10000),
  result_digest text,
  result jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(player_id,request_key),
  unique(player_id,game,attempt_number),
  check ((status='completed' and score is not null and result_digest is not null and finished_at is not null)
    or (status<>'completed' and score is null))
);
create unique index game_one_active_attempt on public.game_attempts(player_id,game) where status='started';
create index game_scores on public.game_attempts(game,player_id,score desc) where status='completed';
create table public.game_letters (
  attempt_id uuid primary key references public.game_attempts(id),
  player_id uuid not null references public.game_players(id),
  place_id text not null check (place_id ~ '^[0-9]{2}$'),
  frame text not null check (frame in ('roots','vermilion','horizon')),
  message text not null check (char_length(btrim(message)) between 1 and 240),
  sender text not null check (char_length(sender) <= 40),
  created_at timestamptz not null default now()
);

-- All operations go through the Next.js server; phone numbers, letters and tokens are private.
alter table public.game_players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_attempts enable row level security;
alter table public.game_letters enable row level security;
revoke all on public.game_players, public.game_sessions, public.game_attempts, public.game_letters from public, anon, authenticated;
grant all on public.game_players, public.game_sessions, public.game_attempts, public.game_letters to service_role;

create function public.game_open_session(p_phone text, p_name text, p_name_key text, p_token_hash text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_player public.game_players;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_phone,0));
  select * into v_player from public.game_players where phone=p_phone for update;
  if found then
    if v_player.name_key<>p_name_key then raise exception 'ACCOUNT_MISMATCH'; end if;
  else
    insert into public.game_players(phone,display_name,name_key) values(p_phone,p_name,p_name_key) returning * into v_player;
  end if;
  insert into public.game_sessions(token_hash,player_id) values(p_token_hash,v_player.id);
  return jsonb_build_object('id',v_player.id,'display_name',v_player.display_name);
end $$;

create function public.game_start_attempt(p_player uuid,p_game text,p_mode text,p_request_key uuid,p_seed bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_attempt public.game_attempts; v_number integer;
begin
  perform 1 from public.game_players where id=p_player for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  select * into v_attempt from public.game_attempts where player_id=p_player and request_key=p_request_key;
  if found then
    if v_attempt.game<>p_game or v_attempt.mode<>p_mode then raise exception 'REQUEST_REUSED'; end if;
    return to_jsonb(v_attempt);
  end if;
  select coalesce(max(attempt_number),0)+1 into v_number from public.game_attempts where player_id=p_player and game=p_game;
  if v_number>3 then raise exception 'ATTEMPT_LIMIT'; end if;
  update public.game_attempts set status='abandoned',finished_at=now() where player_id=p_player and game=p_game and status='started';
  insert into public.game_attempts(player_id,game,mode,request_key,seed,attempt_number)
    values(p_player,p_game,p_mode,p_request_key,p_seed,v_number) returning * into v_attempt;
  return to_jsonb(v_attempt);
end $$;

create function public.game_finish_attempt(p_player uuid,p_attempt uuid,p_score integer,p_digest text,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_attempt public.game_attempts;
begin
  perform 1 from public.game_players where id=p_player for update;
  select * into v_attempt from public.game_attempts where id=p_attempt and player_id=p_player for update;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if v_attempt.status='completed' then
    if v_attempt.result_digest<>p_digest then raise exception 'RESULT_CONFLICT'; end if;
    return to_jsonb(v_attempt);
  end if;
  if v_attempt.status<>'started' then raise exception 'ATTEMPT_CLOSED'; end if;
  if now()>v_attempt.started_at+interval '6 hours' then raise exception 'ATTEMPT_EXPIRED'; end if;
  if p_score<0 or (v_attempt.game='craft' and p_score>10000)
    or (v_attempt.game='print' and (p_score>200 or p_score%10<>0))
    or (v_attempt.game in ('rhythm','place') and p_score>300)
    or (v_attempt.game='postcard' and p_score<>100) then raise exception 'INVALID_SCORE'; end if;
  if v_attempt.game='postcard' then
    insert into public.game_letters(attempt_id,player_id,place_id,frame,message,sender)
      values(p_attempt,p_player,p_result->>'place_id',p_result->>'frame',p_result->>'message',p_result->>'sender');
  end if;
  update public.game_attempts set status='completed',score=p_score,result_digest=p_digest,result=p_result,finished_at=now()
    where id=p_attempt returning * into v_attempt;
  return to_jsonb(v_attempt);
end $$;

create function public.game_leaderboard(p_game text default null,p_offset integer default 0)
returns table(rank bigint,player_id uuid,display_name text,score bigint,best_scores jsonb,total_rows bigint)
language sql stable security definer set search_path=pg_catalog,public as $$
  with best as (
    select a.player_id,a.game,max(a.score) as score from public.game_attempts a where a.status='completed' group by a.player_id,a.game
  ), totals as (
    select b.player_id,sum(b.score) filter(where p_game is null or b.game=p_game) as score,
      jsonb_object_agg(b.game,b.score) as best_scores from best b group by b.player_id
  ), ranked as (
    select rank() over(order by t.score desc) as rank,p.id as player_id,p.display_name,t.score,t.best_scores,count(*) over() as total_rows
    from totals t join public.game_players p on p.id=t.player_id where t.score is not null
  ) select * from ranked order by score desc,display_name,player_id limit 50 offset greatest(0,least(p_offset,10000));
$$;
revoke all on function public.game_open_session(text,text,text,text), public.game_start_attempt(uuid,text,text,uuid,bigint), public.game_finish_attempt(uuid,uuid,integer,text,jsonb), public.game_leaderboard(text,integer) from public,anon,authenticated;
grant execute on function public.game_open_session(text,text,text,text), public.game_start_attempt(uuid,text,text,uuid,bigint), public.game_finish_attempt(uuid,uuid,integer,text,jsonb), public.game_leaderboard(text,integer) to service_role;

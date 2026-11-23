create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GCD2026-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  request_key uuid not null unique,
  fingerprint text not null,
  full_name text not null check(char_length(full_name) between 2 and 120),
  birth_date date not null check(birth_date between date '1900-01-01' and (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date),
  phone text not null unique check(phone ~ '^\+[1-9][0-9]{7,14}$'),
  email text not null unique check(email=lower(email) and char_length(email) between 3 and 254),
  facebook_url text not null check(char_length(facebook_url) <= 500 and facebook_url ~ '^https?://'),
  is_jci boolean not null,
  chapter text not null default '' check((is_jci and char_length(chapter) between 2 and 120) or (not is_jci and chapter='')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.event_registrations enable row level security;
revoke all on public.event_registrations from public,anon,authenticated;
grant all on public.event_registrations to service_role;

create function public.register_event_attendee(p_request_key uuid,p_fingerprint text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare previous public.event_registrations; saved public.event_registrations;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request_key::text,0));
  select * into previous from public.event_registrations where request_key=p_request_key;
  if found then
    if previous.fingerprint<>p_fingerprint then raise exception 'REQUEST_KEY_REUSED'; end if;
    return jsonb_build_object('reference',previous.reference,'reused',true);
  end if;
  insert into public.event_registrations(request_key,fingerprint,full_name,birth_date,phone,email,facebook_url,is_jci,chapter)
  values(p_request_key,p_fingerprint,p_data->>'full_name',(p_data->>'birth_date')::date,p_data->>'phone',p_data->>'email',p_data->>'facebook_url',(p_data->>'is_jci')::boolean,p_data->>'chapter') returning * into saved;
  return jsonb_build_object('reference',saved.reference,'reused',false);
end $$;
revoke all on function public.register_event_attendee(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.register_event_attendee(uuid,text,jsonb) to service_role;
notify pgrst, 'reload schema';

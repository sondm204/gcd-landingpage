-- Run against Supabase Postgres with Flyway, using the database owner account.
create table public.booth_positions (
  id smallint primary key check (id between 1 and 40),
  code text not null unique,
  zone text not null,
  x numeric not null check (x between 0 and 100),
  y numeric not null check (y between 0 and 100),
  width numeric not null default 4.6,
  height numeric not null default 4.5
);

create table public.booth_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.booth_proposals (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GCD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  request_key uuid not null unique,
  fingerprint text not null,
  position_id smallint not null references public.booth_positions(id),
  brand text not null check (char_length(brand) between 2 and 120),
  booth_name text not null check (char_length(booth_name) between 2 and 120),
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 8 and 24),
  website text check (website is null or website ~ '^https?://'),
  category text not null,
  description text not null check (char_length(description) between 20 and 2000),
  image_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(image_paths) = 'array' and jsonb_array_length(image_paths) <= 3),
  consent_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text,
  check ((status = 'pending' and reviewed_at is null and reviewed_by is null) or (status <> 'pending' and reviewed_at is not null and reviewed_by is not null))
);
-- Final database invariant, independent of application requests.
create unique index booth_one_approval_per_position on public.booth_proposals(position_id) where status = 'approved';
create index booth_proposals_position_status on public.booth_proposals(position_id, status);
create index booth_proposals_created on public.booth_proposals(created_at desc);

create table public.booth_review_events (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.booth_proposals(id),
  admin_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);
create table public.booth_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null,
  primary key (key, window_start)
);

insert into public.booth_positions(id, code, zone, x, y)
select n, 'B' || lpad(n::text, 2, '0'),
  case when n <= 10 then 'Bắc' when n <= 20 then 'Đông' when n <= 30 then 'Nam' else 'Tây' end,
  case when n <= 10 then 27 + (n - 1) * 5.8 when n <= 20 then 88 when n <= 30 then 79.2 - (n - 21) * 5.8 else 20 end,
  case when n <= 10 then 14 when n <= 20 then 23 + (n - 11) * 5.7 when n <= 30 then 83 else 74.3 - (n - 31) * 5.7 end
from generate_series(1, 40) as n;

-- Explicit public projection: never exposes contacts, pending brands or images.
create view public.booth_public_map with (security_invoker = true) as
select b.*, coalesce(p.pending_count, 0)::integer as pending_count,
  a.brand as confirmed_brand, a.booth_name as confirmed_booth, (a.id is not null) as is_booked
from public.booth_positions b
left join lateral (select count(*) as pending_count from public.booth_proposals p where p.position_id = b.id and p.status = 'pending') p on true
left join public.booth_proposals a on a.position_id = b.id and a.status = 'approved';

create function public.booth_consume_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_hits integer; v_start timestamptz;
begin
  if p_limit < 1 or p_seconds < 1 then raise exception 'INVALID_LIMIT'; end if;
  v_start := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_seconds) * p_seconds);
  delete from public.booth_rate_limits where window_start < now() - interval '2 days';
  insert into public.booth_rate_limits as limits(key, window_start, hits) values(p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = limits.hits + 1 returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

create function public.submit_booth_proposal(p_request_key uuid, p_fingerprint text, p_data jsonb, p_images jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_previous public.booth_proposals; v_proposal public.booth_proposals; v_position smallint;
begin
  -- Serialize retries of the same form independently from other submissions.
  perform pg_advisory_xact_lock(hashtextextended(p_request_key::text, 0));
  select * into v_previous from public.booth_proposals where request_key = p_request_key;
  if found then
    if v_previous.fingerprint <> p_fingerprint then raise exception 'REQUEST_KEY_REUSED'; end if;
    return jsonb_build_object('id', v_previous.id, 'reference', v_previous.reference, 'reused', true);
  end if;
  v_position := (p_data->>'position_id')::smallint;
  perform 1 from public.booth_positions where id = v_position for update;
  if not found then raise exception 'INVALID_POSITION'; end if;
  if exists(select 1 from public.booth_proposals where position_id = v_position and status = 'approved') then raise exception 'BOOTH_TAKEN'; end if;
  insert into public.booth_proposals(request_key, fingerprint, position_id, brand, booth_name, contact_name, email, phone, website, category, description, image_paths)
  values(p_request_key, p_fingerprint, v_position, p_data->>'brand', p_data->>'booth_name', p_data->>'contact_name', p_data->>'email', p_data->>'phone', nullif(p_data->>'website',''), p_data->>'category', p_data->>'description', p_images)
  returning * into v_proposal;
  return jsonb_build_object('id', v_proposal.id, 'reference', v_proposal.reference, 'reused', false);
end;
$$;

create function public.review_booth_proposal(p_proposal_id uuid, p_decision text, p_admin_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_position smallint; v_proposal public.booth_proposals;
begin
  if not exists(select 1 from public.booth_admins where user_id = p_admin_id and active) then raise exception 'NOT_ADMIN'; end if;
  if p_decision not in ('approved', 'rejected') or char_length(coalesce(p_note, '')) > 1000 then raise exception 'INVALID_DECISION'; end if;
  select position_id into v_position from public.booth_proposals where id = p_proposal_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  -- Always lock the position first, then its proposal. Concurrent approvals share this lock.
  perform 1 from public.booth_positions where id = v_position for update;
  select * into v_proposal from public.booth_proposals where id = p_proposal_id for update;
  if v_proposal.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  if p_decision = 'approved' and exists(select 1 from public.booth_proposals where position_id = v_position and status = 'approved') then raise exception 'BOOTH_TAKEN'; end if;
  update public.booth_proposals set status = p_decision, reviewed_at = now(), reviewed_by = p_admin_id, review_note = nullif(p_note, '') where id = p_proposal_id;
  insert into public.booth_review_events(proposal_id, admin_id, decision, note) values(p_proposal_id, p_admin_id, p_decision, nullif(p_note,''));
  if p_decision = 'approved' then
    with closed as (
      update public.booth_proposals set status = 'rejected', reviewed_at = now(), reviewed_by = p_admin_id,
        review_note = 'Vị trí đã được xác nhận cho một đề xuất khác.'
      where position_id = v_position and status = 'pending' returning id, review_note
    ) insert into public.booth_review_events(proposal_id, admin_id, decision, note)
      select id, p_admin_id, 'rejected', review_note from closed;
  end if;
  return jsonb_build_object('id', p_proposal_id, 'position_id', v_position, 'status', p_decision);
end;
$$;

alter table public.booth_positions enable row level security;
alter table public.booth_admins enable row level security;
alter table public.booth_proposals enable row level security;
alter table public.booth_review_events enable row level security;
alter table public.booth_rate_limits enable row level security;
-- All access goes through Next.js. No direct anonymous/authenticated table access.
revoke all on public.booth_positions, public.booth_admins, public.booth_proposals, public.booth_review_events, public.booth_rate_limits, public.booth_public_map from anon, authenticated;
grant all on public.booth_positions, public.booth_admins, public.booth_proposals, public.booth_review_events, public.booth_rate_limits, public.booth_public_map to service_role;
grant usage, select on sequence public.booth_review_events_id_seq to service_role;
revoke all on function public.booth_consume_rate_limit(text, integer, integer), public.submit_booth_proposal(uuid, text, jsonb, jsonb), public.review_booth_proposal(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.booth_consume_rate_limit(text, integer, integer), public.submit_booth_proposal(uuid, text, jsonb, jsonb), public.review_booth_proposal(uuid, text, uuid, text) to service_role;

-- Private images, read only using short-lived URLs from an authorized admin API.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('booth-proposals', 'booth-proposals', false, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

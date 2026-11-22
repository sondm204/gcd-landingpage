-- Booking locks are independent from permanent cultural/BTC reservations and QR stamps.
alter table public.booth_positions add column is_locked boolean not null default false;

create table public.booth_position_lock_events (
  id bigint generated always as identity primary key,
  position_id smallint not null references public.booth_positions(id),
  admin_id uuid not null references auth.users(id),
  is_locked boolean not null,
  created_at timestamptz not null default now()
);
alter table public.booth_position_lock_events enable row level security;
revoke all on public.booth_position_lock_events from public,anon,authenticated;
grant all on public.booth_position_lock_events to service_role;
grant usage,select on sequence public.booth_position_lock_events_id_seq to service_role;

create or replace view public.booth_public_map with (security_invoker = true) as
select b.id,b.code,b.zone,b.x,b.y,b.width,b.height,
  coalesce(p.pending_count,0)::integer as pending_count,
  a.brand as confirmed_brand,a.booth_name as confirmed_booth,(a.id is not null) as is_booked,
  b.is_bookable,b.is_locked
from public.booth_positions b
left join lateral (select count(*) as pending_count from public.booth_proposals p where p.position_id=b.id and p.status='pending') p on true
left join public.booth_proposals a on a.position_id=b.id and a.status='approved'
where b.is_active;

create function public.set_booth_position_lock(p_position_id smallint,p_locked boolean,p_admin_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_position public.booth_positions;
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin_id and active) then raise exception 'NOT_ADMIN'; end if;
  if p_locked is null then raise exception 'INVALID_LOCK'; end if;
  -- The same position lock is used by proposal submission, approval and relocation.
  select * into v_position from public.booth_positions where id=p_position_id and is_active and is_bookable for update;
  if not found then raise exception 'INVALID_POSITION'; end if;
  if v_position.is_locked is distinct from p_locked then
    update public.booth_positions set is_locked=p_locked where id=p_position_id;
    insert into public.booth_position_lock_events(position_id,admin_id,is_locked) values(p_position_id,p_admin_id,p_locked);
  end if;
  return jsonb_build_object('id',p_position_id,'code',v_position.code,'is_locked',p_locked);
end $$;
revoke all on function public.set_booth_position_lock(smallint,boolean,uuid) from public,anon,authenticated;
grant execute on function public.set_booth_position_lock(smallint,boolean,uuid) to service_role;

create or replace function public.booth_require_bookable_position() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
declare v_locked boolean;
begin
  if new.status in ('pending','approved') then
    select is_locked into v_locked from public.booth_positions where id=new.position_id and is_active and is_bookable for update;
    if not found then raise exception 'INVALID_POSITION'; end if;
    if v_locked then
      if tg_op='INSERT' then raise exception 'BOOTH_LOCKED';
      elsif new.position_id<>old.position_id or (new.status='approved' and old.status<>'approved') then raise exception 'BOOTH_LOCKED';
      end if;
    end if;
  end if;
  -- Existing approvals can still be edited in place; rejecting proposals is allowed.
  return new;
end $$;
notify pgrst, 'reload schema';

-- Keep retired positions and their history; never delete registrations to resize the plan.
-- Existing active registrations in B25–B40 must be reassigned/reviewed before migration.
lock table public.booth_positions, public.booth_proposals in access exclusive mode;
do $$
begin
  if exists (select 1 from public.booth_proposals where position_id >= 25 and status in ('pending', 'approved')) then
    raise exception 'BOOTH_REASSIGNMENT_REQUIRED: review or move active proposals in B25-B40 before applying the 25-position plan';
  end if;
end;
$$;

alter table public.booth_positions
  add column is_active boolean not null default true,
  add column is_bookable boolean not null default true;

update public.booth_positions set is_active = (id <= 25), is_bookable = (id <= 24);
update public.booth_positions set
  zone = case when id <= 8 then 'Hạ Long' when id <= 16 then 'Văn Miếu' else 'Hội An' end,
  x = 11 + ((id - 1) / 8) * 28 + ((id - 1) % 2) * 11,
  y = 33 + (((id - 1) % 8) / 2) * 11,
  width = 9, height = 8
where id <= 24;
update public.booth_positions set zone = 'Quầy đổi quà', x = 45.5, y = 86, width = 9, height = 8 where id = 25;

-- Preserve the original view column order and append the booking capability.
create or replace view public.booth_public_map with (security_invoker = true) as
select b.id, b.code, b.zone, b.x, b.y, b.width, b.height,
  coalesce(p.pending_count, 0)::integer as pending_count,
  a.brand as confirmed_brand, a.booth_name as confirmed_booth, (a.id is not null) as is_booked,
  b.is_bookable
from public.booth_positions b
left join lateral (select count(*) as pending_count from public.booth_proposals p where p.position_id = b.id and p.status = 'pending') p on true
left join public.booth_proposals a on a.position_id = b.id and a.status = 'approved'
where b.is_active;

-- Applies to submission, approval and admin moves, including calls outside the web API.
create function public.booth_require_bookable_position() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.status in ('pending', 'approved') then
    perform 1 from public.booth_positions where id = new.position_id and is_active and is_bookable for update;
    if not found then raise exception 'INVALID_POSITION'; end if;
  end if;
  return new;
end;
$$;
create trigger booth_proposal_bookable_position
before insert or update of position_id, status on public.booth_proposals
for each row execute function public.booth_require_bookable_position();
revoke all on function public.booth_require_bookable_position() from public, anon, authenticated;

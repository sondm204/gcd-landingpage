alter table public.booth_proposals add column updated_at timestamptz not null default clock_timestamp();

create function public.booth_touch_updated_at() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin new.updated_at := clock_timestamp(); return new; end;
$$;
create trigger booth_proposal_touch before update on public.booth_proposals
for each row execute function public.booth_touch_updated_at();

create table public.booth_change_events (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.booth_proposals(id),
  admin_id uuid not null references auth.users(id),
  before_data jsonb not null,
  after_data jsonb not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.booth_change_events enable row level security;
revoke all on public.booth_change_events from anon, authenticated;
grant all on public.booth_change_events to service_role;
grant usage, select on sequence public.booth_change_events_id_seq to service_role;

create function public.update_confirmed_booth(p_proposal_id uuid, p_admin_id uuid, p_expected_updated_at timestamptz, p_data jsonb, p_images jsonb, p_note text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_old_position smallint; v_target smallint; v_before public.booth_proposals; v_after public.booth_proposals;
begin
  if not exists(select 1 from public.booth_admins where user_id=p_admin_id and active) then raise exception 'NOT_ADMIN'; end if;
  if p_expected_updated_at is null then raise exception 'STALE_PROPOSAL'; end if;
  if char_length(coalesce(p_note,'')) > 1000 then raise exception 'INVALID_NOTE'; end if;
  select position_id into v_old_position from public.booth_proposals where id=p_proposal_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  v_target := (p_data->>'position_id')::smallint;
  if not exists(select 1 from public.booth_positions where id=v_target) then raise exception 'INVALID_POSITION'; end if;
  -- Order position locks globally to serialize edits/moves/approvals without lock inversion.
  perform id from public.booth_positions where id in (v_old_position,v_target) order by id for update;
  select * into v_before from public.booth_proposals where id=p_proposal_id for update;
  if v_before.updated_at <> p_expected_updated_at or v_before.position_id <> v_old_position then raise exception 'STALE_PROPOSAL'; end if;
  if v_before.status <> 'approved' then raise exception 'NOT_CONFIRMED'; end if;
  if exists(select 1 from public.booth_proposals where position_id=v_target and status='approved' and id<>p_proposal_id) then raise exception 'BOOTH_TAKEN'; end if;
  update public.booth_proposals set position_id=v_target, brand=p_data->>'brand', booth_name=p_data->>'booth_name',
    contact_name=p_data->>'contact_name', email=p_data->>'email', phone=p_data->>'phone', website=nullif(p_data->>'website',''),
    category=p_data->>'category', description=p_data->>'description', image_paths=p_images
  where id=p_proposal_id returning * into v_after;
  insert into public.booth_change_events(proposal_id,admin_id,before_data,after_data,note)
  values(p_proposal_id,p_admin_id,to_jsonb(v_before),to_jsonb(v_after),nullif(p_note,''));
  if v_target <> v_old_position then
    with closed as (
      update public.booth_proposals set status='rejected', reviewed_at=now(), reviewed_by=p_admin_id,
        review_note='Vị trí được quản trị xác nhận cho một gian hàng chuyển đến.'
      where position_id=v_target and status='pending' returning id,review_note
    ) insert into public.booth_review_events(proposal_id,admin_id,decision,note)
      select id,p_admin_id,'rejected',review_note from closed;
  end if;
  return jsonb_build_object('id',p_proposal_id,'position_id',v_target,'previous_position_id',v_old_position,'updated_at',v_after.updated_at);
end;
$$;
revoke all on function public.booth_touch_updated_at() from public,anon,authenticated;
revoke all on function public.update_confirmed_booth(uuid,uuid,timestamptz,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.update_confirmed_booth(uuid,uuid,timestamptz,jsonb,jsonb,text) to service_role;

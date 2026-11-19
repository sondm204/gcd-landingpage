lock table public.booth_positions, public.booth_proposals in access exclusive mode;
do $$ begin
  if exists(select 1 from public.booth_proposals where position_id=34 and status in ('pending','approved')) then raise exception 'BOOTH_REASSIGNMENT_REQUIRED: position 34 has legacy proposals'; end if;
end; $$;
update public.booth_positions set x=28.375, y=29.1875 where code='VH04';
update public.booth_positions set x=28.375, y=39.375 where code='VH05';
update public.booth_positions set code='TM21',zone='Gian thương mại',x=49.25,y=45.5,width=4.875,height=2.875,is_active=true,is_bookable=true where id=34;
create or replace function public.booth_consume_voucher() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare voucher public.booth_vouchers; discount integer;
begin
  if coalesce(new.payment->>'discount_code','') = '' or coalesce(old.payment->>'discount_code','') <> '' then return new; end if;
  select * into voucher from public.booth_vouchers where code=new.payment->>'discount_code' for update;
  if not found or not voucher.active or (voucher.usage_limit is not null and voucher.used_count >= voucher.usage_limit) then raise exception 'VOUCHER_UNAVAILABLE'; end if;
  discount := least(5000000, case when voucher.type='percent' then 5000000::bigint*voucher.value/100 else voucher.value end);
  if (new.position_id not between 1 and 20 and new.position_id <> 34) or (new.payment->>'discount')::integer <> discount or (new.payment->>'amount')::integer <> 5000000-discount then raise exception 'VOUCHER_CHANGED'; end if;
  update public.booth_vouchers set used_count=used_count+1 where id=voucher.id;
  return new;
end; $$;

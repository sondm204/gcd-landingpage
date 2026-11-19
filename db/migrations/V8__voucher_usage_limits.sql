alter table public.booth_vouchers
  add column usage_limit integer check(usage_limit > 0),
  add column used_count integer not null default 0 check(used_count >= 0);
update public.booth_vouchers v set used_count=(select count(*) from public.booth_proposals p where p.payment->>'discount_code'=v.code);
-- Count a use when a registration is saved, never when previewing a QR.
create function public.booth_consume_voucher() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare voucher public.booth_vouchers; discount integer;
begin
  if coalesce(new.payment->>'discount_code','') = '' or coalesce(old.payment->>'discount_code','') <> '' then return new; end if;
  select * into voucher from public.booth_vouchers where code=new.payment->>'discount_code' for update;
  if not found or not voucher.active or (voucher.usage_limit is not null and voucher.used_count >= voucher.usage_limit) then raise exception 'VOUCHER_UNAVAILABLE'; end if;
  discount := least(5000000, case when voucher.type='percent' then 5000000::bigint*voucher.value/100 else voucher.value end);
  if new.position_id not between 1 and 20 or (new.payment->>'discount')::integer <> discount or (new.payment->>'amount')::integer <> 5000000-discount then raise exception 'VOUCHER_CHANGED'; end if;
  update public.booth_vouchers set used_count=used_count+1 where id=voucher.id;
  return new;
end; $$;
create trigger booth_payment_voucher_usage before update of payment on public.booth_proposals
for each row execute function public.booth_consume_voucher();
revoke all on function public.booth_consume_voucher() from public,anon,authenticated;

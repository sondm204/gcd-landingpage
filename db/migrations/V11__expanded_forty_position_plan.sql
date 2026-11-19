-- Preserve existing proposal IDs and payment history.
lock table public.booth_positions, public.booth_proposals in access exclusive mode;
do $$ begin
  if exists(select 1 from public.booth_proposals where position_id in (29,30,35,36,37,38,39,40) and status in ('pending','approved')) then raise exception 'BOOTH_REASSIGNMENT_REQUIRED: review legacy proposals before repurposing inactive positions'; end if;
end; $$;
update public.booth_positions b set code=v.code,zone=v.zone,x=v.x,y=v.y,width=v.width,height=v.height,is_active=true,is_bookable=v.bookable
from (values
(1,'TM01','Gian thương mại',29.0625,43.75,5.5,2.875,true),
(2,'TM02','Gian thương mại',29.0625,47.375,5.5,2.875,true),
(3,'TM03','Gian thương mại',29.0625,51,5.5,2.875,true),
(4,'TM04','Gian thương mại',29.0625,54.625,5.5,2.875,true),
(5,'TM05','Gian thương mại',29.0625,61.5625,5.5,2.875,true),
(6,'TM06','Gian thương mại',34.9375,61.5625,5.5,2.875,true),
(7,'TM07','Gian thương mại',40.8125,61.5625,5.5,2.875,true),
(8,'TM08','Gian thương mại',46.6875,61.5625,5.5,2.875,true),
(9,'TM09','Gian thương mại',52.5625,61.5625,5.5,2.875,true),
(10,'TM10','Gian thương mại',58.4375,61.5625,5.5,2.875,true),
(11,'TM11','Gian thương mại',64.3125,61.5625,5.5,2.875,true),
(12,'TM12','Gian thương mại',48.75,48.125,5.5,2.875,true),
(13,'TM13','Gian thương mại',54.625,48.125,5.5,2.875,true),
(14,'TM14','Gian thương mại',60.5,48.125,5.5,2.875,true),
(15,'TM15','Gian thương mại',66.375,48.125,5.5,2.875,true),
(16,'TM16','Gian thương mại',72.25,48.125,5.5,2.875,true),
(17,'TM17','Gian thương mại',78.125,48.125,5.5,2.875,true),
(18,'TM18','Gian thương mại',72.1875,61.5625,5.5,2.875,true),
(19,'TM19','Gian thương mại',72.1875,64.5625,5.5,2.875,true),
(20,'TM20','Gian thương mại',72.1875,67.5625,5.5,2.875,true),
(21,'TT01','Gian tài trợ',48.75,32.8125,5.5,2.875,true),
(22,'TT02','Gian tài trợ',54.625,32.8125,5.5,2.875,true),
(23,'TT03','Gian tài trợ',60.5,32.8125,5.5,2.875,true),
(24,'TT04','Gian tài trợ',48.75,36.25,5.5,2.875,true),
(25,'TT05','Gian tài trợ',48.75,39.6875,5.5,2.875,true),
(26,'VH01','Gian văn hoá',9.375,29.0625,7.1875,4,false),
(27,'VH02','Gian văn hoá',18.75,29.0625,7.1875,4,false),
(28,'VH03','Gian văn hoá',6.25,33.75,7.1875,4,false),
(29,'TR01','Điểm trải nghiệm',9.6875,38,8.4375,4.25,false),
(30,'TR02','Điểm trải nghiệm',19.375,38,8.4375,4.25,false),
(31,'BTC01','Gian BTC',81.25,42.5,15,5.125,false),
(32,'BTC02','Gian BTC',6.5625,43.4375,17.8125,5.125,false),
(33,'BTC03','Gian BTC',6.5625,61.5625,17.8125,5.125,false),
(34,'TM21','Gian thương mại',48.75,43.75,5.5,2.875,true),
(35,'TM22','Gian thương mại',84,48.125,5.5,2.875,true),
(36,'TM23','Gian thương mại',72.1875,70.5625,5.5,2.875,true),
(37,'TM24','Gian thương mại',72.1875,73.5625,5.5,2.875,true),
(38,'TT06','Gian tài trợ',49.375,25.5,5.5,2.875,true),
(39,'TT07','Gian tài trợ',58.4375,25.5,17.5,4.125,true),
(40,'TT08','Gian tài trợ',66.875,32,9.375,4.375,true)
) as v(id,code,zone,x,y,width,height,bookable) where b.id=v.id;
-- Voucher eligibility follows the current commercial code, including TM22–TM24.
create or replace function public.booth_consume_voucher() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare voucher public.booth_vouchers; discount integer;
begin
  if coalesce(new.payment->>'discount_code','') = '' or coalesce(old.payment->>'discount_code','') <> '' then return new; end if;
  select * into voucher from public.booth_vouchers where code=new.payment->>'discount_code' for update;
  if not found or not voucher.active or (voucher.usage_limit is not null and voucher.used_count >= voucher.usage_limit) then raise exception 'VOUCHER_UNAVAILABLE'; end if;
  discount := least(5000000, case when voucher.type='percent' then 5000000::bigint*voucher.value/100 else voucher.value end);
  if not exists(select 1 from public.booth_positions where id=new.position_id and is_active and is_bookable and code ~ '^TM[0-9]{2}$') or (new.payment->>'discount')::integer <> discount or (new.payment->>'amount')::integer <> 5000000-discount then raise exception 'VOUCHER_CHANGED'; end if;
  update public.booth_vouchers set used_count=used_count+1 where id=voucher.id;
  return new;
end; $$;

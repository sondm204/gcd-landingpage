-- Keep proposal IDs and history; require manual review before reserving occupied positions.
lock table public.booth_positions, public.booth_proposals in access exclusive mode;
do $$ begin
  if exists(select 1 from public.booth_proposals where position_id >= 26 and status in ('pending','approved')) then
    raise exception 'BOOTH_REASSIGNMENT_REQUIRED: review active proposals at positions 26-40';
  end if;
end; $$;
update public.booth_positions set is_active=false, is_bookable=false;
update public.booth_positions b set code=v.code, zone=v.zone, x=v.x, y=v.y, width=v.width, height=v.height, is_active=true, is_bookable=v.bookable
from (values
(1, 'TM01', 'Gian thương mại', 28.375, 44.1875, 4.875, 3.25, true),
(2, 'TM02', 'Gian thương mại', 28.375, 48.625, 4.875, 3.25, true),
(3, 'TM03', 'Gian thương mại', 28.375, 53.0625, 4.875, 3.25, true),
(4, 'TM04', 'Gian thương mại', 28.375, 57.5, 4.875, 3.25, true),
(5, 'TM05', 'Gian thương mại', 28.375, 64.25, 4.875, 3.25, true),
(6, 'TM06', 'Gian thương mại', 34.1875, 64.25, 4.875, 3.25, true),
(7, 'TM07', 'Gian thương mại', 40, 64.25, 4.875, 3.25, true),
(8, 'TM08', 'Gian thương mại', 45.8125, 64.25, 4.875, 3.25, true),
(9, 'TM09', 'Gian thương mại', 51.625, 64.25, 4.875, 3.25, true),
(10, 'TM10', 'Gian thương mại', 57.4375, 64.25, 4.875, 3.25, true),
(11, 'TM11', 'Gian thương mại', 63.25, 64.25, 4.875, 3.25, true),
(12, 'TM12', 'Gian thương mại', 49.25, 48.8125, 4.875, 3.25, true),
(13, 'TM13', 'Gian thương mại', 55.0625, 48.8125, 4.875, 3.25, true),
(14, 'TM14', 'Gian thương mại', 60.875, 48.8125, 4.875, 3.25, true),
(15, 'TM15', 'Gian thương mại', 66.6875, 48.8125, 4.875, 3.25, true),
(16, 'TM16', 'Gian thương mại', 72.5, 48.8125, 4.875, 3.25, true),
(17, 'TM17', 'Gian thương mại', 78.3125, 48.8125, 4.875, 3.25, true),
(18, 'TM18', 'Gian thương mại', 70.1875, 64.25, 4.875, 3.25, true),
(19, 'TM19', 'Gian thương mại', 70.1875, 68.3125, 4.875, 3.25, true),
(20, 'TM20', 'Gian thương mại', 70.1875, 72.375, 4.875, 3.25, true),
(21, 'TT01', 'Gian tài trợ', 49.25, 32.6875, 4.875, 3.625, true),
(22, 'TT02', 'Gian tài trợ', 55.0625, 32.6875, 4.875, 3.625, true),
(23, 'TT03', 'Gian tài trợ', 60.875, 32.6875, 4.875, 3.625, true),
(24, 'TT04', 'Gian tài trợ', 49.25, 37.1875, 4.875, 3.625, true),
(25, 'TT05', 'Gian tài trợ', 49.25, 41.6875, 4.875, 3.625, true),
(26, 'VH01', 'Gian văn hoá', 7.3125, 29.1875, 4.875, 3.625, false),
(27, 'VH02', 'Gian văn hoá', 13.125, 29.1875, 4.875, 3.625, false),
(28, 'VH03', 'Gian văn hoá', 18.9375, 29.1875, 4.875, 3.625, false),
(29, 'VH04', 'Gian văn hoá', 24.75, 29.1875, 4.875, 3.625, false),
(30, 'VH05', 'Gian văn hoá', 24.75, 33.8125, 4.875, 3.625, false),
(31, 'BTC01', 'Gian BTC', 79.5, 43.1875, 14.125, 5.125, false),
(32, 'BTC02', 'Gian BTC', 7.3125, 44.1875, 16.5625, 5.125, false),
(33, 'BTC03', 'Gian BTC', 7.3125, 64.25, 16.5625, 5.125, false)
) as v(id,code,zone,x,y,width,height,bookable) where b.id=v.id;
-- Existing V4 trigger rejects submissions, approvals and moves into non-bookable positions.

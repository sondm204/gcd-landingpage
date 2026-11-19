-- Keep IDs, coordinates and all proposal history; restore VH04 and VH05.
update public.booth_positions set code='VH04',zone='Gian văn hoá',is_bookable=false where id=29;
update public.booth_positions set code='VH05',zone='Gian văn hoá',is_bookable=false where id=30;

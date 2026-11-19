-- TT01–TT05 form the L-shaped cluster; TT06 sits above it.
-- Preserve IDs, codes, proposals and payment history.
update public.booth_positions b set x=v.x,y=v.y
from (values
  (21,48.75,32.8125),
  (22,54.625,32.8125),
  (23,60.5,32.8125),
  (24,48.75,36.25),
  (25,48.75,39.6875),
  (38,49.375,25.5)
) as v(id,x,y) where b.id=v.id;

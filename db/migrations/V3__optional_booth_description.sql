-- Keep applied migrations unchanged; allow an empty description for new proposals and admin edits.
alter table public.booth_proposals
  drop constraint booth_proposals_description_check;
alter table public.booth_proposals
  add constraint booth_proposals_description_check check (char_length(description) <= 2000);

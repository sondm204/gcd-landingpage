alter table public.booth_proposals add column payment jsonb;
-- Preserve the existing transactional registration and add the server-calculated quote atomically.
alter function public.submit_booth_proposal(uuid,text,jsonb,jsonb) rename to submit_booth_proposal_without_payment;
revoke all on function public.submit_booth_proposal_without_payment(uuid,text,jsonb,jsonb) from public,anon,authenticated,service_role;
create function public.submit_booth_proposal(p_request_key uuid,p_fingerprint text,p_data jsonb,p_images jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare result jsonb;
begin
  result := public.submit_booth_proposal_without_payment(p_request_key,p_fingerprint,p_data,p_images);
  if not (result->>'reused')::boolean then
    update public.booth_proposals set payment=nullif(p_data->'payment','null'::jsonb) where id=(result->>'id')::uuid;
  end if;
  return result;
end; $$;
revoke all on function public.submit_booth_proposal(uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.submit_booth_proposal(uuid,text,jsonb,jsonb) to service_role;

create table public.booth_vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(code ~ '^[A-Z0-9_-]{1,50}$'),
  type text not null check(type in ('percent','amount')),
  value integer not null check(value > 0 and (type <> 'percent' or value <= 100)),
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.booth_vouchers enable row level security;
revoke all on public.booth_vouchers from public,anon,authenticated;
grant all on public.booth_vouchers to service_role;

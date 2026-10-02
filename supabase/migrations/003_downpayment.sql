-- Down payment: owner-editable setting, and a marker for when the balance is collected.
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  allow_downpayment boolean not null default true,
  downpayment_rate numeric not null default 0.5 check (downpayment_rate >= 0.1 and downpayment_rate <= 0.9),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;
drop policy if exists "read settings" on public.settings;
create policy "read settings" on public.settings for select using (true);
drop policy if exists "owner write settings" on public.settings;
create policy "owner write settings" on public.settings for update using (public.is_owner()) with check (public.is_owner());

alter table public.orders add column if not exists balance_paid_at timestamptz;

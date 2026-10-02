-- Food Corner by Indae Lenlyn: core schema.
-- Menu tables are public-readable; orders are written only by the server (service key)
-- and read/updated by signed-in staff. Owners manage the menu and the team.

create extension if not exists pgcrypto;

/* ---------- Team ---------- */

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'staff' check (role in ('owner', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('owner', 'staff'), false)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'owner', false)
$$;

/* ---------- Menu ---------- */

create table if not exists public.trays (
  id text primary key,
  name text not null,
  price integer not null check (price >= 0),
  category text not null check (category in ('chicken', 'pork', 'beef', 'seafood', 'noodles', 'veggies')),
  img text not null default '',
  note text,
  available boolean not null default true,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.lechon_options (
  id text primary key,
  kind text not null check (kind in ('whole', 'belly', 'inyuha')),
  label text not null,
  kilos numeric not null,
  price integer not null check (price >= 0),
  available boolean not null default true,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

-- fixed:   [{ "name": "...", "img": "..." }]
-- groups:  [{ "id": "...", "label": "...", "choose": 5, "options": [{ "id": "...", "name": "...", "img": "..." }] }]
-- add_ons: [{ "id": "...", "name": "...", "price": 300, "perUnit": "kg", "max": 20 }]
create table if not exists public.packages (
  id text primary key,
  code text not null,
  name text not null,
  price integer not null check (price >= 0),
  pax_min integer not null,
  pax_max integer not null,
  summary text not null default '',
  fixed jsonb not null default '[]',
  groups jsonb not null default '[]',
  freebies text[] not null default '{}',
  pickup_only boolean not null default false,
  add_ons jsonb not null default '[]',
  available boolean not null default true,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.zones (
  id text primary key,
  label text not null,
  detail text not null default '',
  fee_min integer not null default 0,
  fee_max integer not null default 0,
  quote boolean not null default false,
  active boolean not null default true,
  sort integer not null default 0
);

create table if not exists public.blocked_dates (
  day date primary key,
  reason text not null default '',
  created_at timestamptz not null default now()
);

/* ---------- Orders ---------- */

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cooking', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled')),
  payment_status text not null default 'unverified' check (payment_status in ('unverified', 'verified', 'rejected')),
  customer_name text not null,
  mobile text not null,
  email text,
  fb_name text,
  event_date date not null,
  event_time time not null,
  occasion text,
  pax integer,
  zone_id text references public.zones (id),
  zone_label text,
  address text,
  landmark text,
  notes text,
  pay_channel text,
  reference text,
  items jsonb not null,             -- resolved lines: [{ kind, refId, title, detail[], qty, unitPrice, total }]
  subtotal integer not null,
  delivery_fee integer,             -- set by staff once confirmed
  amount_paid integer not null,
  proof_path text,                  -- path inside the payment-proofs bucket
  summary text not null,
  staff_note text,
  updated_at timestamptz not null default now()
);

create index if not exists orders_event_date_idx on public.orders (event_date);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  actor uuid references public.profiles (id),
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- Readable, collision-safe order numbers: FC-MMDD-####
create sequence if not exists public.order_seq start 1001;
create or replace function public.next_order_id() returns text
language sql volatile security definer set search_path = public as $$
  select 'FC-' || to_char(now() at time zone 'Asia/Manila', 'MMDD') || '-' || nextval('public.order_seq')::text
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['trays', 'lechon_options', 'packages', 'orders'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

/* ---------- Row level security ---------- */

alter table public.profiles enable row level security;
alter table public.trays enable row level security;
alter table public.lechon_options enable row level security;
alter table public.packages enable row level security;
alter table public.zones enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

-- Public menu (website visitors). Staff also see unavailable items so they can re-enable them.
drop policy if exists "menu read trays" on public.trays;
create policy "menu read trays" on public.trays for select using (available or public.is_staff());
drop policy if exists "menu read lechon" on public.lechon_options;
create policy "menu read lechon" on public.lechon_options for select using (available or public.is_staff());
drop policy if exists "menu read packages" on public.packages;
create policy "menu read packages" on public.packages for select using (available or public.is_staff());
drop policy if exists "menu read zones" on public.zones;
create policy "menu read zones" on public.zones for select using (active or public.is_staff());
drop policy if exists "read blocked dates" on public.blocked_dates;
create policy "read blocked dates" on public.blocked_dates for select using (true);

-- Owners edit the menu.
do $$ declare t text; begin
  foreach t in array array['trays', 'lechon_options', 'packages', 'zones'] loop
    execute format('drop policy if exists "owner write %1$s" on public.%1$s', t);
    execute format('create policy "owner write %1$s" on public.%1$s for all using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- Staff and owners block days on the calendar.
drop policy if exists "staff write blocked dates" on public.blocked_dates;
create policy "staff write blocked dates" on public.blocked_dates for all using (public.is_staff()) with check (public.is_staff());

-- Orders: staff read and update; inserts come only from the server with the secret key.
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_staff());
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff read order events" on public.order_events;
create policy "staff read order events" on public.order_events for select using (public.is_staff());
drop policy if exists "staff add order events" on public.order_events;
create policy "staff add order events" on public.order_events for insert with check (public.is_staff());

-- Team: everyone signed in sees their own profile; owners see and manage all.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_owner());
drop policy if exists "owner manage profiles" on public.profiles;
create policy "owner manage profiles" on public.profiles for update using (public.is_owner()) with check (public.is_owner());

/* ---------- Realtime: new orders pop up on the board ---------- */

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

/* ---------- Storage ---------- */

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false), ('menu', 'menu', true)
on conflict (id) do nothing;

drop policy if exists "staff read proofs" on storage.objects;
create policy "staff read proofs" on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.is_staff());

drop policy if exists "public read menu photos" on storage.objects;
create policy "public read menu photos" on storage.objects for select using (bucket_id = 'menu');

drop policy if exists "owner upload menu photos" on storage.objects;
create policy "owner upload menu photos" on storage.objects for insert
  with check (bucket_id = 'menu' and public.is_owner());
drop policy if exists "owner change menu photos" on storage.objects;
create policy "owner change menu photos" on storage.objects for update
  using (bucket_id = 'menu' and public.is_owner());
drop policy if exists "owner delete menu photos" on storage.objects;
create policy "owner delete menu photos" on storage.objects for delete
  using (bucket_id = 'menu' and public.is_owner());

-- Inventory: cooking materials and supplies, with a log of every stock change.
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  unit text not null default 'pcs',
  quantity numeric not null default 0,
  low_level numeric,                 -- warn when quantity is at or below this
  cost numeric,                      -- cost per unit, optional
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_moves (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  change numeric not null,           -- positive = stock in, negative = used or lost
  quantity_after numeric not null,
  reason text not null,
  note text,
  actor uuid references public.profiles (id),
  actor_name text,
  created_at timestamptz not null default now()
);
create index if not exists inventory_moves_item_idx on public.inventory_moves (item_id, created_at desc);

drop trigger if exists touch_inventory_items on public.inventory_items;
create trigger touch_inventory_items before update on public.inventory_items for each row execute function public.touch_updated_at();

alter table public.inventory_items enable row level security;
alter table public.inventory_moves enable row level security;

-- The whole team keeps stock; only owners delete an item (and its history).
drop policy if exists "staff read inventory" on public.inventory_items;
create policy "staff read inventory" on public.inventory_items for select using (public.is_staff());
drop policy if exists "staff add inventory" on public.inventory_items;
create policy "staff add inventory" on public.inventory_items for insert with check (public.is_staff());
drop policy if exists "staff edit inventory" on public.inventory_items;
create policy "staff edit inventory" on public.inventory_items for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "owner delete inventory" on public.inventory_items;
create policy "owner delete inventory" on public.inventory_items for delete using (public.is_owner());
drop policy if exists "staff read inventory moves" on public.inventory_moves;
create policy "staff read inventory moves" on public.inventory_moves for select using (public.is_staff());

-- Changes the quantity and writes the log row together, so the two can never disagree.
create or replace function public.inventory_adjust(p_item uuid, p_change numeric, p_reason text, p_note text default null)
returns public.inventory_items
language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  item public.inventory_items;
begin
  select * into me from public.profiles where id = auth.uid() and active;
  if me.id is null then raise exception 'Not allowed'; end if;
  if p_change is null or p_change = 0 then raise exception 'Enter an amount'; end if;
  update public.inventory_items set quantity = quantity + p_change where id = p_item returning * into item;
  if item.id is null then raise exception 'Item not found'; end if;
  if item.quantity < 0 then raise exception 'Only % % in stock', (item.quantity - p_change), item.unit; end if;
  insert into public.inventory_moves (item_id, change, quantity_after, reason, note, actor, actor_name)
  values (p_item, p_change, item.quantity, coalesce(nullif(p_reason, ''), 'Correction'), nullif(p_note, ''), me.id, coalesce(nullif(me.full_name, ''), me.email));
  return item;
end $$;
revoke all on function public.inventory_adjust(uuid, numeric, text, text) from public, anon;
grant execute on function public.inventory_adjust(uuid, numeric, text, text) to authenticated;

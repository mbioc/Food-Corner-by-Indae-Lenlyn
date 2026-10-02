-- Where new-order emails go. Kept apart from public.settings because that table is publicly readable.
create table if not exists public.notify_settings (
  id integer primary key default 1 check (id = 1),
  owner_emails text not null default '',   -- one or more addresses, separated by commas
  updated_at timestamptz not null default now()
);
insert into public.notify_settings (id, owner_emails) values (1, 'juvilyncabaltera9@gmail.com') on conflict (id) do nothing;

alter table public.notify_settings enable row level security;
drop policy if exists "owner read notify settings" on public.notify_settings;
create policy "owner read notify settings" on public.notify_settings for select using (public.is_owner());
drop policy if exists "owner write notify settings" on public.notify_settings;
create policy "owner write notify settings" on public.notify_settings for update using (public.is_owner()) with check (public.is_owner());

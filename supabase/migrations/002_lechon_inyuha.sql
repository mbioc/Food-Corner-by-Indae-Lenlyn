-- Lechon Inyuha: roasting fee when the customer brings their own pig.
alter table public.lechon_options drop constraint if exists lechon_options_kind_check;
alter table public.lechon_options add constraint lechon_options_kind_check check (kind in ('whole', 'belly', 'inyuha'));

insert into public.lechon_options (id, kind, label, kilos, price, sort) values
  ('inyuha-20-40', 'inyuha', '20 to 40 kg', 40, 2500, 10),
  ('inyuha-40-50', 'inyuha', '40 to 50 kg', 50, 2800, 11),
  ('inyuha-50-60', 'inyuha', '50 to 60 kg', 60, 3000, 12),
  ('inyuha-60-70', 'inyuha', '60 to 70 kg', 70, 3500, 13)
on conflict (id) do nothing;

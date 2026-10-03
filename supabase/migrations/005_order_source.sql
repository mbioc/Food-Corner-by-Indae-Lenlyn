-- Where an order came from: the website checkout, or added by staff for a walk-in customer.
alter table public.orders add column if not exists source text not null default 'website' check (source in ('website', 'walk-in'));

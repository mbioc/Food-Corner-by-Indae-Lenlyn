-- Down payment is now any amount the customer chooses, with a minimum (owner's request, Oct 2026).
-- downpayment_rate is kept but no longer used.
alter table public.settings add column if not exists downpayment_min integer not null default 500 check (downpayment_min >= 1);

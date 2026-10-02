# Food Corner by Indae Lenlyn: ordering site and admin

- **Website** (`/`): customers build their order (packages with dish choices, lechon, trays), pick delivery or pick-up, pay by bank QR and upload the payment screenshot.
- **Admin** (`/admin`): orders board, calendar, sales analytics, menu manager and team. Owners see everything; staff see orders, calendar and sales.

Stack: Vite + React on Vercel. Supabase provides the database, logins, payment-screenshot storage and live order updates. Brevo sends the emails.

## How it fits together

| Piece | Where |
|---|---|
| Database schema and security rules | `supabase/migrations/001_init.sql` |
| Starting menu (from the Facebook posts) | `supabase/seed.sql` |
| Place an order (re-prices from the database, saves, emails) | `api/order.mjs` |
| Change order status / payment / delivery fee (emails the customer) | `api/admin/order-status.mjs` |
| Team: add staff, roles, block access, reset passwords | `api/admin/users.mjs` |
| Prices shared by the website and the server | `site/src/shared/pricing.js` |
| Admin screens | `site/src/admin/` |

The website shows the built-in menu instantly, then switches to the live menu from the database. If the database can't be reached, customers still see a menu and can finish via Messenger.

## Vercel environment variables

Project → Settings → Environment Variables, ticked for **Production** (and Preview if you use it). Redeploy after changing them.

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_…`) |
| `SUPABASE_URL` | same Project URL |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_…`). Server only, never share it |
| `BREVO_API_KEY` | Brevo API key |
| `OWNER_EMAIL` | where new-order emails go |
| `SENDER_EMAIL` | a sender verified in Brevo |
| `SENDER_NAME` | e.g. `Indae Lenlyn` |

## Run locally

Create `site/.env.local` with the same variables (it is gitignored), then:

```bash
cd site
npm install
npm run dev        # website on http://localhost:5173, admin on /admin, API on /api/*
```

## Order statuses

New → Confirmed → Cooking → Out for delivery / Ready for pick-up → Completed (or Cancelled). If the order has an email address, the customer is emailed on Confirmed, Out for delivery, Ready for pick-up and Cancelled. Staff can untick that per order.

## Still needed from Lenlyn

- Real food photos: upload them in **Admin → Menu** (tap a dish photo).
- Her email for `OWNER_EMAIL`. Add her in **Admin → Team** as Owner.
- Downpayment policy and order lead time.

# Food Corner by Indae Lenlyn: ordering site

Customers build their order (packages with dish choices, lechon, à la carte trays), pick delivery or pick-up, pay by bank QR and upload the payment screenshot. Lenlyn gets the order by email with the screenshot attached. The customer gets an email copy and a one-tap Messenger handoff.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Local dev has no email server, so the site shows the "send it on Messenger" fallback after checkout. That's expected.

## Deploy free on Netlify

1. Push this `site/` folder to a GitHub repo, then in Netlify choose **Add new site → Import from Git**. `netlify.toml` already sets the build.
2. Create a free **Brevo** account (brevo.com, 300 emails/day). Verify a sender email (Senders → Add a sender; a Gmail works). Create an API key (SMTP & API → API keys).
3. In Netlify → Site configuration → Environment variables, add:

| Variable | Value |
|---|---|
| `BREVO_API_KEY` | the Brevo API key |
| `OWNER_EMAIL` | where Lenlyn wants new orders |
| `SENDER_EMAIL` | the verified Brevo sender |
| `SENDER_NAME` | optional, e.g. `Food Corner by Indae Lenlyn` |

4. Redeploy, place a test order and check the inbox.

## Where to edit things

| What | File |
|---|---|
| Menu, prices, packages, dish choices | `src/data/menu.ts` |
| Phone, Messenger, directions, delivery fees, bank accounts | `src/data/business.ts` |
| Downpayment on/off | `SETTINGS.allowDownpayment` in `src/data/business.ts` |
| Order email wording | `netlify/functions/order.mjs` |

## Still needed from Lenlyn

- **Real food photos.** Replace the files in `public/img/dish/` and `public/img/hero/`, keeping the same names. Current images are crops of her AI posters.
- **Real InstaPay QR images** for Maya, GoTyme, BPI, PNB and MariBank. Put them in `public/qr/` and set each `qr` path in `business.ts`. Until then checkout asks customers to message for the account details.
- The email address that should receive orders.
- Downpayment policy (full payment only for now), order lead time, and the Lechon Inyuha price.
- Whether there's a Facebook **Page**. Messenger currently points to her personal profile (`m.me/juvilyn.cabaltera`).

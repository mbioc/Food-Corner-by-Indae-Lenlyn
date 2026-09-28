# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Custom-coded site (user choice, 2026-09-28). Framework detail delegated: Vite + React + TypeScript + Tailwind CSS, static build deployable free to Netlify/Vercel. No Go HighLevel for now (user: too expensive; revisit platform later). Order notifications by email + Messenger.

## Users

- **Primary: event hosts in Western Leyte**, mostly Albuera, Ormoc City, Baybay and nearby barangays. They are planning a birthday, fiesta, baptism, wedding, reunion, company event or a simple family salu-salo. Their job is to feed 12–40+ people reliably and within budget, usually ordering days ahead and sometimes as a rush order. Most browse on a phone after arriving from Facebook.
- **Secondary: the owner, Juvilyn "Indae Lenlyn" Cabaltera**, who receives, confirms and fulfils each order and today reconstructs every order by hand from Messenger chats and phone calls.

## Product Purpose

An online ordering site for Food Corner by Indae Lenlyn. A customer can build an order (à la carte trays, lechon, or fixed packages with dish choices), get the delivery fee for their area, pay by bank QR and upload proof of payment. The owner then receives a complete, unambiguous order by email and Messenger. Success means fewer back-and-forth messages per order, no missed dish choices or dates, and more orders from people who would not have messaged first.

This is the first module of a larger business system (automation, CRM and marketing come later).

## Positioning

The home kitchen behind Tabgas, cooking party food and whole lechon for Albuera since 2021. It sells sulit, ready-made party packages priced per headcount, cooked by a named owner who is also the face of the brand, and delivers across Western Leyte, including Ormoc City and Baybay.

## Operating Context

- Customers mostly find the business through the owner's Facebook profile (18K followers) and pinned menu post.
- Orders are mainly **pre-orders for a specific event date and time**. Rush orders are accepted.
- Fulfilment is by delivery through local riders ("Deliverthing"), with the fee set by zone and vehicle size, or by pick-up at the kitchen.
- Payment is by InstaPay QR to Maya, GoTyme, BPI, PNB or MariBank. **GCash is not accepted.**
- The business is BIR-registered and issues an Official Receipt (OR) or CR.
- Customers use a mix of Bisaya (Cebuano/Leyte), Tagalog and English.

## Capabilities and Constraints

- Full menu, packages, prices, delivery zones and payment accounts: `research/business-brief.md`.
- Packages have choice rules (e.g. "any 5 of these 8 dishes", "Spaghetti **or** Bam-i").
- The Medium Tray 10-dish package is **pick-up only**.
- Delivery fees are ranges for some zones and depend on load, so the site shows an estimate and the owner confirms the final fee.
- Checkout: customer details, event date/time, delivery or pick-up, then pay via QR and upload a payment screenshot.
- Notifications: an order email to the owner (with the proof attached) and a confirmation to the customer, plus a Messenger handoff that sends the order summary.
- Needs a backend-free or near-free form/email service, because the owner does not want paid platforms yet.
- **Undecided:** owner email address; required downpayment % vs full payment; order lead time and cut-off; Lechon Inyuha (roast-your-own-pig) price; opening hours; whether a Facebook Page (vs personal profile) exists for Messenger.

## Brand Commitments

- Name: **Food Corner by Indae Lenlyn** (profile also uses "Food Corner By Lenlyn").
- Existing badge logo: owner's portrait in a circle with chef hat, fork and spoon, the script "Food Corner" wordmark and "Good Food Makes Happy People".
- **Logo colours are binding (user, 2026-09-28): "follow the color it have in profile picture because it is my logo."** Sampled from the badge: sunshine yellow ≈ #FAE02C, lime ≈ #BBE347, forest green ≈ #1F7535, deep green-black ≈ #0D150D, pale lime ≈ #FBFCC6. Any visual direction uses this family as its palette.
- User prefers the familiar/safer end of the design spectrum over experimental forms (re-rolled toward "safer", 2026-09-28).
- Taglines in use: "Good Food Makes Happy People", "Good Food Brings People Together", "Mas Masarap ang Pagtitipon Kapag Kasama ang Masarap na Pagkain!"
- Voice: warm, homey, sulit, Taglish/Bisaya-friendly, uses "po", grateful ("Thank you for your support!").

## Evidence on Hand

- Menu posters, location guide, delivery chart, payment QR sheet and BIR notice: `research/fb-menu/`. **The food photos in these posters are AI-generated.** Real photos will come from the owner later, so current visuals are placeholders.
- 529+ reactions on the menu post; 18K followers; in operation since 2021; BIR-registered.
- **No customer testimonials or reviews on hand. Do not fabricate them.**

## Product Principles

1. **The order must arrive complete.** Every dish choice, headcount, date, address and payment proof is captured so the owner never has to ask again.
2. **Mobile and Facebook first.** The typical visitor taps in from Facebook on a phone with patchy data, so pages must be fast and light.
3. **Sulit, made obvious.** Price per package and pax served are shown up front and compared honestly.
4. **Her kitchen, her name.** Keep the personal, local, home-cooked identity. Never make it look like a chain.
5. **Honest money.** Show exact bank QR options, say clearly that GCash is not accepted, and label delivery fees as estimates the owner confirms.

## Accessibility & Inclusion

Users on low-end Android phones and slow mobile data; mixed-language readers. Keep labels plain and readable (English with familiar Taglish terms like "pax", "bilao", "sulit"), use large tap targets and high contrast outdoors.

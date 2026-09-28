---
name: Food Corner by Indae Lenlyn
description: The handaan table seen from above. Party food on banana leaf, in the owner's logo colours.
colors:
  leaf: "#1f7535"
  leaf-600: "#196530"
  leaf-700: "#145327"
  leaf-800: "#0f3f1e"
  ink: "#0d150d"
  ink-soft: "#33412f"
  sun: "#fae02c"
  sun-deep: "#e9c80f"
  lime: "#bbe347"
  tag: "#fbfcc6"
  ground: "#f7f9e6"
  foil: "#d8dcd9"
  chili: "#c8321f"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  price:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  control: "10px"
  button: "14px"
  tile: "16px"
  card: "24px"
  table: "28px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.sun-deep}"
  button-secondary:
    backgroundColor: "{colors.leaf}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    height: "48px"
  chip:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.leaf}"
    textColor: "#ffffff"
  tray-tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "8px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "12px"
    height: "48px"
---

# Design System: Food Corner by Indae Lenlyn

## Overview

**North star: the handaan table.** The site is the fiesta table seen from above. Food sits on banana-leaf green, dishes live in foil trays and woven bilao, and the customer's order visibly fills the table as they add to it. It is a home kitchen in Tabgas, Albuera, not a delivery chain. The owner's own logo colours (sunshine yellow, lime and forest green) are binding and carry the whole page.

Key characteristics: light pale-lime page ground with full-bleed leaf sections, loud prices and headcounts, photos always inside a physical container (foil or bilao), Taglish warmth in copy ("Order na", "Salamat po", "sulit").

## Colors

### Primary
- **Leaf** `#1f7535`: the banana-leaf surface (hero table, lechon section, table bar, footer) and the secondary button. Darker steps `leaf-600/700/800` are for hover and inset panels on leaf.

### Secondary
- **Sun** `#fae02c`: primary actions, prices on leaf, selected segmented options, order number. It is never used for body text on light ground.

### Tertiary
- **Lime** `#bbe347`: small highlights on leaf (icons, glow in the leaf texture).
- **Chili** `#c8321f`: errors, "Remove", and "GCash not accepted" only.

### Neutral
- **Ground** `#f7f9e6`: page background. **Tag** `#fbfcc6`: tray labels and the order recap. **Ink** `#0d150d`: text. **Ink-soft** `#33412f`: secondary text (tinted green, never grey). **Foil** `#d8dcd9`: tray rims.

### Named Rules
- **The Logo Rule.** Every surface is drawn from the badge's family. Red appears only as chili for errors.
- **Price Shouts.** On leaf, prices are sun; on light ground, prices are ink or leaf at display weight.

## Typography

Display and prices: **Bricolage Grotesque** 800, tracking −0.025em, optical sizing on. Body: **Figtree** 400–700. All prices and quantities use tabular lining numerals (`.num`).

### Hierarchy
- Hero H1 2.6rem mobile → 4rem desktop, line-height 1.02; the second sentence turns leaf green.
- Section H2 2.25rem → 3rem.
- Package name 1.5rem; price and pax 1.875rem, the loudest type in each tile.
- Body 1rem–1.125rem, measure ≤ 52–65ch.

## Layout

Max width 1280px (`max-w-7xl`) with 16px mobile and 32px desktop gutters. The hero splits 1fr / 1.1fr (copy left, table right) on desktop and stacks on mobile. Packages use a two-up grid on desktop and one column on phones, with each tile split into a leaf spread and details. Trays run 2 → 5 columns. A fixed table bar stays at the thumb on every viewport, so the footer carries bottom padding to clear it.

## Elevation & Depth

Elevation is declared once, by shadow: `shadow-tray` for foil containers, a soft two-layer shadow for package tiles, and `shadow-lift` for the table bar and sheets. Sheets sit over a 55% ink scrim.

## Shapes

Radii: 10px controls, 14px buttons, 16px tiles, 24px cards, 28px hero table, pills for filter chips only. Bilao are full circles with a woven conic rim.

## Components

### Buttons
Sun primary (ink text), leaf secondary (white text), ghost (leaf ring). 48px tall (56px large), `active:scale(0.97)`, no wrapping.

### Chips
Pax and category filters: white with an ink/12 ring, turning leaf with white text when selected. 40–44px tall.

### Cards / Containers
- **Foil tray**: a 5px metallic gradient rim around every dish photo, radius 14px.
- **Bilao**: a round woven rim.
- **Package tile**: the leaf spread (six places, never holes) plus a details column with code, name, summary, pax, price and CTA.

### Inputs / Fields
Label above, 48px input, 2px ink/12 border turning leaf on focus and chili on error. Error text sits below, and hint text is ink-soft.

### Navigation
A sticky translucent header (ground at 85% with backdrop blur) with the badge, the wordmark, section links on desktop, call and Messenger.

### Signature: the table bar and table fill
When the customer adds food, a foil tray lifts off the tapped dish and springs onto the table bar, and the bar pulses. The hero table swaps its sample spread for the customer's own items. Sheets are bottom sheets on phones (drag the header to dismiss, with momentum projection) and right panels on desktop, and they leave the way they came.

## Do's and Don'ts

### Do:
- Put every food photo in a foil or bilao container.
- Make price and pax the loudest type in any offer.
- Label placeholder photos honestly until real ones arrive.
- Keep delivery fees framed as estimates Lenlyn confirms.

### Don't:
- Don't introduce colours outside the logo family, except chili for errors.
- Don't add fake testimonials, ratings or order counts.
- Don't use eyebrow labels above headings.
- Don't show GCash anywhere as a payment option.

---
name: brand-strategy
description: Build a complete brand strategy step by step — brand naming, personality & tone of voice, customer personas, marketing strategy, website copy, social media content, on-page SEO, and a Go HighLevel AI Studio website builder prompt. Use this skill whenever a user wants to develop a new brand, evaluate an existing brand name, define a brand's personality or tone, create a customer persona, build a marketing or positioning strategy, write homepage/website copy, generate social media post ideas, do keyword research, write a brand origin story, develop taglines, analyze competitors, write an email welcome sequence, or generate a website-builder prompt from brand strategy context. Trigger this even when the request uses related words like "branding", "positioning", "messaging", "brand voice", "archetype", "StoryBrand", "AIDA", "PAS", "empathy map", "value proposition", "SMILE test", "SCRATCH test", or references experts like Alexandra Watkins, Donald Miller, Jennifer Aaker, or Margaret Hartwell.
license: Based on the user-provided "Brand Strategy — AI Project Prompt Guide V2"
---

# Brand Strategy

A step-by-step framework for building a complete brand strategy. Each step is a carefully designed prompt that references industry-leading experts and frameworks. Steps build on each other — earlier answers feed later ones — so run them in order when building a brand from scratch. Individual steps and bonus prompts can be used on their own once the foundation exists.

## When to use this skill

Use this skill whenever the user wants to work on any part of a brand, including but not limited to:

- Generating or evaluating a **brand name** (new business or existing)
- Defining **brand personality and tone of voice**
- Creating a **customer persona**
- Building a **marketing strategy or positioning**
- Writing **homepage / website copy**
- Generating **social media content ideas**
- Doing **keyword research and on-page SEO**
- Generating a **Go HighLevel AI Studio website builder prompt**
- Writing a **brand origin story, taglines, competitor analysis, or email welcome sequence**

If the user is building a full brand strategy, walk them through the steps in order. If they ask for only one element (e.g., "just give me tagline ideas"), jump straight to that prompt.

## How to operate this skill

1. **Adopt the senior-strategist persona.** Act as a senior brand strategist. Remember every detail the user shares about their brand, product, audience, and goals throughout the conversation.
2. **Ask clarifying questions first when the brief is vague.** Never generate output on a brief so thin you'd be guessing. If the user hasn't told you the business, audience, or stage, ask before generating.
3. **Present comparative output in tables.** Whenever options are being compared (expert names, framework choices, persona fields, copy variants), use a clean markdown table.
4. **Reference the named experts and frameworks.** Each step has specific authorities to cite. Use them — this is what makes the output strategic rather than generic.
5. **For framework-selection steps (2–5), pick ONE framework first.** Read the options, choose the single best fit for the user's business, explain why in one sentence, then build out the full answer using that chosen framework. Offer the other frameworks as optional follow-ups.
6. **Be concise, practical, and creative.** No fluff. Every line should be usable.
7. **Carry context forward.** Details from step 1 (name) inform step 2 (personality), which informs step 3 (persona), and so on. Never ask the user to re-explain what they already told you.

---

## Step 1 — Brand Naming (new business)

Generate name ideas referencing top naming experts. This gives variety and strategic depth instead of generic AI output.

**Prompt to run:**

> I'm starting [describe your business and target audience]. Give me 5 brand name ideas according to each of the following experts: Alexandra Watkins, Brad Flowers, and Jeremy Miller. Present them in a table with a column for each expert.

**Experts to reference:**
- **Alexandra Watkins** — author of *Hello, My Name Is Awesome* (suggestive, memorable, brandable names)
- **Brad Flowers** — author of *The Naming Book* (structured, strategic naming process)
- **Jeremy Miller** — author of *Brand New Name* (distinctive, ownable names)

**Output format:** One markdown table, 5 rows, 3 columns (one per expert).

**Tip to share with the user:** Aim for 10–15 names total, then run trademark and domain availability checks on their top picks before moving forward.

---

## Step 1B — Brand Name Discovery (existing business)

Use this version when the user already has a business name. Before analysing anything, ask the two questions below, wait for the answer, then evaluate.

**Prompt to run:**

> I already have an existing business with a brand name. To get started, please ask me:
> 1. What is your business name?
> 2. What does your business do — describe your product or service and who it's for?
>
> Once I answer, please:
> - Analyse what my brand name communicates (first impression, tone, audience fit)
> - Evaluate it using Alexandra Watkins' SMILE & SCRATCH test
> - Identify its strengths and any potential blind spots
> - Suggest 2–3 ways to strengthen or support the name (tagline ideas, brand story angle, or tone of voice direction)
>
> Present the full analysis in a table.

**Evaluation framework (Alexandra Watkins):**
- **SMILE** — **S**uggestive · **M**eaningful · **I**magery · **L**egs · **E**motional
- **SCRATCH** (what to avoid) — **S**pelling challenged · **C**opycat · **R**estrictive · **A**nnoying · **T**ame · **C**urse of knowledge · **H**ard to pronounce

**Output includes:**
- First impression & tone
- SMILE score/commentary
- SCRATCH score/commentary
- 2–3 tagline directions
- Brand story angle

---

## Step 2 — Brand Personality & Tone of Voice

Define how the brand sounds and feels. Foundation for every future copy, content, and communication decision.

**Prompt to run:**

> Help me develop a brand personality and tone of voice for my brand. Before building the profile, review these expert frameworks and choose the one that best fits my business:
>
> - Margaret Hartwell (*Archetypes in Branding*) — best for brands that want a rich, character-driven identity rooted in archetypes
> - Jennifer Aaker (*5 Dimensions of Brand Personality*) — best for brands that want a structured, research-backed personality profile
> - Jakob Nielsen (*4 Dimensions of Tone of Voice*) — best for brands prioritising how they communicate across digital content
>
> Based on what you know about my business, pick the most suitable framework, explain in one sentence why, then build out my full brand personality and tone of voice using it. Present everything in a table.

**Frameworks:**
- **Margaret Hartwell** — 60 brand archetypes for character-driven identity
- **Jennifer Aaker** — Sincerity, Excitement, Competence, Sophistication, Ruggedness
- **Jakob Nielsen** — Funny vs. Serious · Formal vs. Casual · Respectful vs. Irreverent · Enthusiastic vs. Matter-of-fact

**Optional follow-up:** If the user wants, apply all three frameworks side by side for a fuller picture.

---

## Step 3 — Customer Persona

Define who the user is selling to. Sharpens every future marketing and copy decision.

**Prompt to run:**

> I need to develop a customer persona for my brand. Before choosing a framework, please review these three expert approaches and select the one that best fits my type of business:
>
> - Anne Miltenburg (*Brand The Change*) — best for purpose-driven or social impact brands
> - Dave Gray (Empathy Map) — best for understanding emotional drivers and day-to-day mindset
> - Alex Osterwalder (Value Proposition Canvas) — best for product/service businesses focused on solving specific problems
>
> Based on what you know about my business so far, choose the most suitable framework, explain in one sentence why, then build out a full customer persona using that framework. Include demographics, motivations, frustrations, values, and behaviours. Present in a table.

**Frameworks:**
- **Anne Miltenburg** — purpose-driven personas
- **Dave Gray — Empathy Map** — Think & Feel, See, Hear, Say & Do, Pain, Gain
- **Alex Osterwalder — Value Proposition Canvas** — Customer Jobs, Pains, Gains ↔ Products/Services, Pain Relievers, Gain Creators

**Optional follow-up:** "Can you show me how my persona looks across all three frameworks in one table?"

---

## Step 4 — Marketing Strategy

Position the brand and build a plan to reach the audience.

**Prompt to run:**

> Help me build a marketing strategy for my brand. Before choosing a framework, review these options and select the one that best fits my business stage and goals:
>
> - STP Model (Segmentation, Targeting, Positioning) — best for brands defining their audience and positioning for the first time
> - SWOT Analysis — best for brands that need to understand their competitive landscape before planning
> - 7Ps Marketing Mix — best for established brands that want a comprehensive operational marketing plan
>
> Based on what you know about my business, choose the most suitable framework, explain in one sentence why, then build out the full strategy using it. Include key messages and value propositions where relevant. Present in a table.

**Frameworks:**
- **STP** — Segmentation · Targeting · Positioning
- **SWOT** — Strengths · Weaknesses · Opportunities · Threats
- **7Ps** — Product · Price · Promotion · Place · People · Process · Physical evidence

**Optional follow-up:** "Can you now apply the other two frameworks so I can see the full picture?"

---

## Step 5 — Website Copy

Write compelling homepage copy using a proven storytelling framework.

**Prompt to run:**

> Help me write homepage copy for my brand. Before choosing a framework, review these expert approaches and select the one that best fits my business:
>
> - Donald Miller (StoryBrand) — best for brands that want a clear narrative structure with the customer as the hero
> - AIDA (Attention, Interest, Desire, Action) — best for direct-response businesses focused on driving conversions
> - PAS (Problem, Agitation, Solution) — best for brands solving a clear pain point and wanting punchy, empathy-driven copy
>
> Based on what you know about my business, choose the most suitable framework, explain in one sentence why, then write full homepage copy using it. Include: headline, subheadline, problem, solution, call to action, and a sample testimonial. Present in a table.

**Frameworks:**
- **Donald Miller — StoryBrand** — Character · Problem · Guide · Plan · Call to Action · Success/Failure stakes
- **AIDA** — Attention · Interest · Desire · Action
- **PAS** — Problem · Agitation · Solution
- **FAB** (bonus) — Features · Advantages · Benefits

**Required sections in the output:** Headline, Subheadline, Problem, Solution, CTA, Sample testimonial.

**Optional follow-up:** Rewrite the copy using a different framework to compare tone and structure.

---

## Step 6 — Social Media Content

Generate ready-to-post ideas for the platforms that matter to the user's audience.

**Prompt to run:**

> Give me 5 [Instagram / LinkedIn / Facebook] post ideas for [Brand Name]. For each idea include: a content angle, a visual concept, suggested caption tone, and a call to action. Our audience is [describe them].

**Follow-up — full caption for a chosen idea:**

> Write a full caption for post idea #[number]. Make it [casual / professional / witty] and include 5 relevant hashtags at the end.

---

## Step 7 — On-Page SEO & Keyword Research

Identify the right keywords and optimise web content so potential customers can find the brand through search.

**Prompt to run:**

> Do keyword research for [Brand Name]'s [homepage / product page / blog]. Our target audience is [describe them] and they are searching for [describe what they need]. Give me: 10 primary keywords, 10 long-tail keyword phrases, a suggested meta title (under 60 characters), and a meta description (under 160 characters). Present in a table.

**Follow-up — blog post content brief:**

> Create a blog post content brief targeting the keyword "[chosen keyword]". Include: title, meta description, outline with H2 and H3 headings, suggested word count, and internal linking suggestions.

**Important limits:** Meta title under 60 characters. Meta description under 160 characters. If web search is available, enable it for fresher keyword data.

---

## Step 8 — Go HighLevel AI Studio Website Builder Prompt

Run this AFTER completing Steps 1–5 (at minimum 1–4). It reviews what has already been established in the conversation, asks only for the missing pieces, then generates a single ready-to-paste prompt for Go HighLevel AI Studio.

**Operate in three sub-steps:**

**STEP 1 — Review what's already known.** From the conversation so far, list what has been confirmed for each item and mark anything missing or unclear as `UNKNOWN`:

- *Business information:* business name, tagline (if any), primary service/product, target audience & persona, brand personality & tone, key marketing messages and positioning
- *Design system:* overall visual tone (from brand personality), any colours/fonts/style preferences already mentioned

**STEP 2 — Ask ONLY what's missing.** Do NOT re-ask about anything already confirmed. Always ask these website-specific questions (they won't have come up in brand strategy):

1. Business location or service area
2. Contact details: phone, email, physical address (if applicable)
3. Social media links to include
4. Main goal of the website: generate leads, book appointments, sell products, or get calls?
5. Specific pages needed beyond homepage (About, Services, Contact, Blog, etc.)

For design system, only ask what's `UNKNOWN` from Step 1:

- Primary brand colour (hex, e.g. `#1A2E4A`)
- Secondary brand colour (hex)
- Accent colour (hex — for buttons, hover states, highlights)
- Background colour preference (white, off-white, dark, or specific hex)
- Text colour preference (dark grey, black, or specific hex)
- Heading font (e.g. Playfair Display, Montserrat, Inter — or describe: modern, classic, bold)
- Body font (e.g. Open Sans, Lato — or describe: clean, readable, friendly)
- Button style (rounded pill, sharp square, soft rounded)
- Any websites or brands admired visually

**STEP 3 — Generate the AI Studio prompt.** Once all gaps are filled, produce ONE complete prompt (a single clean block of text, not a document) that Go HighLevel AI Studio can follow. It must include:

- **COPY & STRUCTURE** — Choose the best framework (StoryBrand, AIDA, PAS, or FAB), state the choice and why in one sentence, apply across all sections. Write full copy for: Hero · Problem/Pain · Solution/How it works · Services · Testimonials · Final CTA · Footer. Use `[brackets]` only for content not yet provided.
- **DESIGN SYSTEM** — Exact hex codes for primary, secondary, accent, background, text. Font families for headings and body with fallback stacks. Button style, border radius, hover behaviour. Section spacing, layout style, mobile-responsive instructions.
- **SEO** — 10 primary keywords embedded naturally in the copy. 10 long-tail keyword phrases in section headings/subheadings. Meta title (<60 chars). Meta description (<160 chars). Suggested H1 for hero and H2s for each section.
- **CONVERSION ELEMENTS** — At least 2 prominent CTA buttons with copy. A lead-capture form with recommended fields. Trust-signal placement (testimonials, reviews, certifications, guarantees). Urgency or social-proof nudge suggestions.

**Output format:** A single clean block of prompt text, not a formatted document. The user will paste it directly into Go HighLevel AI Studio.

---

## Bonus prompts

Use any of these at any stage, independently of the main sequence.

### Brand story

> Write a compelling brand origin story for my brand using the hero's journey structure. Our brand was founded because [reason]. Keep it under 200 words and make it emotionally engaging.

### Tagline development

> Generate 10 tagline options for my brand. We sell [product] to [audience]. Include a mix of: benefit-driven, emotional, and witty options. Present in a table with a column explaining the approach for each.

### Competitor analysis

> Analyse the brand positioning of these 3 competitors: [Competitor A], [Competitor B], [Competitor C]. Compare their tone of voice, target audience, key messages, and positioning gaps. Present in a table and suggest where [Brand Name] can differentiate.

### Email marketing — welcome sequence

> Write a 5-email welcome sequence for new subscribers to my brand. Each email should: have a clear subject line, be under 200 words, have one CTA, and build on the previous email. Our brand tone is [describe tone].

---

## Output style rules (apply to every step)

- **Tables** for any comparison, framework output, persona, keyword list, or copy breakdown.
- **One chosen framework** per framework-selection step (2, 3, 4, 5) — never dump all three unless asked.
- **One-sentence rationale** whenever a framework is chosen ("I picked X because…").
- **Citations of experts** when a framework belongs to a named authority.
- **Brackets `[like this]`** in generated prompts to mark placeholders the user should fill in.
- **No re-asking** for information the user has already provided earlier in the conversation.
- **Practical, concise, creative** — no generic fluff, no padding.

## Full-strategy workflow (when the user wants the whole thing)

When the user asks to build a full brand strategy from scratch, propose this sequence and confirm before starting:

1. Step 1 or 1B — establish the name
2. Step 2 — personality & tone
3. Step 3 — customer persona
4. Step 4 — marketing strategy
5. Step 5 — website copy
6. Step 7 — SEO for the website
7. Step 8 — AI Studio website-builder prompt
8. Step 6 — social content to launch with
9. Bonus prompts as needed (brand story, taglines, competitor analysis, email sequence)

Run one step at a time. After each step, summarise the decision made and confirm before moving on — momentum matters, but so does alignment.

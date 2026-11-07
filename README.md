# Leap+ (concept prototype)

> Concept prototype, not affiliated with TFI or the NTA. No real money moves, and no physical Leap card is read or changed. All card numbers are fake.

**Live demo:** https://leap-plus.vercel.app

Leap+ is a concept prototype of a Leap Card top-up app for Dublin commuters. It rebuilds the core top-up flow and adds wallet payments and live bus information, all in one app.

Built together by **Gamaliel and Sona** at the **Cognition Builder's Day** hosted by **Give(a)Go** in Dublin.

## Why we built this

We looked at the Leap Top Up app through a product owner's lens: who uses it, what they are trying to get done, and where the experience gets in their way. Leap is used every day by a large number of Dublin commuters, so even small amounts of friction add up across many trips. When we walked through a typical commuter's day, two moments stood out as clear, solvable pain points.

Rather than proposing a brand-new product, we wanted to show how targeted improvements to an app people already rely on could deliver real value with low adoption risk. We built a working prototype to test the idea end to end, instead of only describing it.

## The problem

The current TFI Leap Top Up app has two gaps:

1. **Payment friction.** Users type card details to top up. The app does not support Google Pay or Apple Pay, even though wallets are the standard for mobile checkout.
2. **Context switch.** Users top up in one app and check live buses in another (TFI Live). They don't know whether their balance covers the next trip until they tap on the bus.

## The solution

One app that:

- **Tops up a Leap card with a wallet in fewer taps:** Google Pay (TEST mode, real Google Pay sheet), simulated Apple Pay, or a saved card.
- **Shows live buses:** routes E1, 39A and 16 on a map, with stop lists, next arrivals (Live vs Scheduled) and a fare-vs-balance check.
- **Joins the two together (smart top-up):** if your balance is below €4.00 (2 × €2.00 fare) while you're looking at a stop, the app offers a one-tap €10 Google Pay top-up without leaving the screen.
- **Plans journeys:** A-to-B route comparison with a journey map and live buses (added after the original plan).

## Familiar by design

Leap+ deliberately keeps the look and feel of the existing Leap Top Up app: the green brand colour, the card visual, the screen layout and the top-up flow. Existing users keep the familiarity of an app they already know and don't have to learn a whole new one. The new features (wallet payments, live buses and smart top-up) fit into that familiar structure instead of replacing it.

## Features

| Area | What it does |
|---|---|
| Card | Simulated NFC "hold your card" scan or manual card-number entry; card is saved on the device |
| Home | Leap card visual, balance, low-balance banner (< €4), last transactions |
| Top-up | Amount chips (€5 / €10 / €20 / €30) or custom (min €5, max balance €150); Google Pay TEST, Apple Pay (simulated), saved card •••• 4242; idempotent retries |
| Live | Live bus map (LIVE from NTA GTFS-Realtime, automatic RECORDED fallback), stop list, stop detail with ETAs and fare |
| Smart top-up | One-tap €10 top-up from a stop when the balance is too low |
| Plan | Place search, route options, journey map with live buses |
| Backend | Google Sheet + Google Apps Script acting as the "Leap backend" (fake cards, balances, transactions) |

Demo flags for failure paths: `?scanFail=1`, `?topupFail=1`, `?liveFail=1`.

## Tech spec (summary)

Full details: [docs/03-Tech-Spec.md](docs/03-Tech-Spec.md)

```
Browser (React SPA)
  ├─ /api/card/get, /api/card/topup ──► Google Apps Script ──► Google Sheet (mock Leap backend)
  ├─ /api/realtime?routes=E1,39A,16 ──► NTA GTFS-Realtime API (LIVE)
  │     └─ fallback: /recorded/*.json (RECORDED snapshots)
  ├─ /api/plan, /api/geocode ──► Transitous (journey planning, no key needed)
  ├─ /gtfs/{route}.json (static shapes, stops, timetable, pre-extracted)
  └─ Google Pay JS (TEST) · Apple Pay simulation (pure UI)
```

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Zustand |
| Map | Leaflet + react-leaflet + OpenStreetMap tiles (no API key) |
| Payments | `@google-pay/button-react` in TEST mode; custom simulated Apple Pay sheet |
| Backend-for-frontend | Vercel serverless functions (`/api`): validate input, add secrets server-side, timeouts, caching, error mapping |
| Mock backend | Google Sheet + Apps Script ([apps-script/Code.gs](apps-script/Code.gs)) with shared secret, `LockService` and idempotency keys |
| Live data | NTA GTFS-Realtime (JSON), 60 s server cache shared across users, backoff on rate limits, RECORDED fallback |
| Static data | Python scripts extract per-route GTFS data at build time (`scripts/`) |
| Tests | Vitest unit tests (money, ETA, interpolation, smart top-up, BFF, realtime, journey), ESLint, TypeScript |
| Hosting | Vercel (Hobby); total running cost €0 |

**Why a backend-for-frontend:** secrets (NTA key, Sheet secret) never reach the browser, there are no CORS issues, amounts are validated server-side, and caching and fallbacks live in one place.

## How it was built

Leap+ was built together by **Gamaliel and Sona (myself)** at the **Cognition Builder's Day** hosted by **Give(a)Go** in Dublin. We shaped the product, scope and design as a team, set up the accounts and keys, and tested and reviewed every change together.

The engineering was done with **Devin** (Cognition's AI software engineer), which ran two parallel streams: D1 built the card clone and wallets (P0 + P1), and D2 built live bus and smart top-up (P2).

Throughout the build, we both wore the **product owner** hat: deciding what problem to solve, for whom, what was in and out of scope, and what "done" looked like. That is why we defined the **five layers** below, moving from product requirements to user flows, technical design, security and an implementation plan, so the app was fully thought through and properly developed rather than just coded.

We worked **docs-first**. Each of the five layers was written, reviewed and locked before the next one started, and the code followed the locked docs. Work shipped as small pull requests. Each one had a Vercel preview, passed `npm run check` and was accepted at a phase gate before merging to `main`.

## The five layers

| # | Layer | Doc | What it decides |
|---|---|---|---|
| 1 | Product Requirements Document (PRD) | [docs/01-PRD.md](docs/01-PRD.md) | Problem, goals, non-goals, user stories, P0/P1/P2 scope and hard stops |
| 2 | Process Flow | [docs/02-Process-Flow.md](docs/02-Process-Flow.md) | Screens S01–S15, flows A–F, states and copy (source for the Figma wireflow) |
| 3 | Tech Spec | [docs/03-Tech-Spec.md](docs/03-Tech-Spec.md) | Architecture, stack, Sheet schema, API contracts, live data, error handling |
| 4 | Security Review | [docs/04-Security-Review.md](docs/04-Security-Review.md) | STRIDE review, findings F1–F17, privacy, production gaps |
| 5 | Implementation Plan | [docs/05-Implementation-Plan.md](docs/05-Implementation-Plan.md) | Tasks, owners, phase gates, cut order, test checklist, demo script |

Supporting design docs: [Figma AI prompts](docs/02b-Figma-AI-Prompts.md), [flow diagram](docs/02c-Flow-Diagram.md), [Figma linking guide](docs/02d-Figma-Linking-Prompt.md).

## Current status

**Stage: build complete; now in the code-freeze / demo-readiness stage of the Implementation Plan.**

| Phase | Status |
|---|---|
| Docs (Product Requirements Document → Implementation Plan) | Done: all five approved v1.0 |
| Pre-clock setup (scaffold, GTFS extract, recorded data) | Done (PR #1) |
| P0 Clone: Sheet backend, card BFF, onboarding, saved-card top-up | Done (PR #2) |
| P1 Wallets: Google Pay TEST, simulated Apple Pay | Done (PR #3) |
| P2 Live bus + smart top-up | Done (PR #4) |
| Live data hardening: caching, rate-limit backoff, tile fix | Done (PRs #5–#7, #9, #10) |
| Journey planner (beyond the original scope) | Done (PR #8) |
| Moved to own accounts (GitHub, Vercel, Google Sheet, NTA key) | Done |
| Code-freeze security check, full E2E checklist, demo rehearsal | **To do** |

## What needs to be done next

1. **Run the test checklist** ([Implementation Plan §6](docs/05-Implementation-Plan.md)): flows A–D in Chrome device mode (iPhone 14 + Pixel 7), no console errors, one Lighthouse mobile run.
2. **Run the code-freeze security check** ([Security Review §7](docs/04-Security-Review.md)): no secrets in `dist/` or git, wrong Sheet secret returns `UNAUTHORIZED`, idempotency replay, `/api/realtime?routes=99X` returns 400, security headers present.
3. **Use a dedicated demo Google account** for the Sheet/Apps Script owner and the Google Pay Chrome profile (Security Review F2, F4).
4. **Update the docs to match what was built:** the Product Requirements Document (PRD) lists journey planning as a non-goal (NG3), but it now exists; account ownership (Tech Spec TQ3) has changed.
5. **Tag the demo state** (`demo-p2`), reset the Sheet to seed values (`setup()`), record a backup video, and rehearse the 3-minute demo script ([Implementation Plan §7](docs/05-Implementation-Plan.md)).
6. **Beyond the prototype:** see the production gaps in [Security Review §6](docs/04-Security-Review.md). They include user accounts, server-side payment via a PSP, real Apple Pay and an NTA partnership for real card data.

## Run locally

Requires Node 20.

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # lint + typecheck + tests
```

Without any keys, `npm run dev` uses an in-memory mock card backend and RECORDED bus data. To use real services, create a `.env.local` file (git-ignored) using [.env.example](.env.example) as the template:

```
NTA_KEY=               # developer.nationaltransport.ie, GTFS-Realtime subscription
SHEET_WEBAPP_URL=      # Apps Script web app URL ending in /exec
SHEET_SHARED_SECRET=   # Apps Script → Project Settings → Script Properties → SHARED_SECRET
```

**Google Sheet backend setup:** create a Google Sheet, open Extensions → Apps Script, paste [apps-script/Code.gs](apps-script/Code.gs), and run `setup()` once. Then deploy as a Web app with Execute as: Me and Who has access: Anyone.

**Deploy:** import the repo into Vercel and add the same three variables under Environment Variables (Production). Every push to `main` then deploys automatically.

Never commit real keys. All secrets are server-side only, so don't use a `VITE_` prefix.

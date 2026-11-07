# Implementation Plan: Leap+ (Concept Prototype)

| Field | Value |
|---|---|
| Status | APPROVED v1.0 — locked (IQ1–IQ3 defaults accepted) |
| Inputs | PRD v1.0, Process Flow v1.0, Tech Spec v1.0, Security Review v1.0 (all locked) |
| Clock | 3:00 total. Code freeze 2:30. Rehearse 2:45. |
| Owners | **PO** = you (demo owner, accept/reject). **OPS** = co-founder (accounts, QA, security check). **D1** = Devin stream 1 (P0 + P1). **D2** = Devin stream 2 (P2). |

## 1. Rules

1. **Gates, not hopes.** Each phase has a hard stop. At the stop, PO accepts or cuts. No extensions.
2. **Main is always demoable.** Every merge to `main` auto-deploys to Vercel. Merge only when the PR preview passes its acceptance check. Tag each accepted state (`demo-p0`, `demo-p1`, `demo-p2`). Rollback = Vercel "Promote" an earlier deployment (≈30 s).
3. **Folder ownership (no conflicts).** D1 owns `src/app`, `src/ui`, `src/lib`, `features/card`, `features/topup`, `api/card`, `apps-script`. D2 owns `features/live`, `api/realtime.ts`, `scripts/`, `public/gtfs`, `public/recorded`. Shared file edits (`routes.tsx`, `TabBar.tsx`, `config.ts`) go through D1.
4. **Branches:** `d1/<task>` and `d2/<task>`. Small PRs (≤ 45 min of work). Squash merge.
5. **Definition of done (each task):** acceptance check passes on the Vercel preview in Chrome device mode (iPhone 14), `npm run lint && npm run typecheck && npm test` pass, no console errors, related Security Review finding closed.
6. **Simulated parts are labelled** in the UI and in the demo script.

## 2. Pre-clock checklist (T-minus, ~60 min, before the 3:00 starts)

Confirm the hackathon rules first (IQ1). If pre-built code is not allowed, move P-6 to P-9 into the first 20 min of the clock and cut F13 marker animation now.

| ID | Owner | Task | Done when | Ref |
|---|---|---|---|---|
| P-1 | OPS | Create a **dedicated demo Google account**. Sign in a new Chrome profile with it. Add one test card / join Google's test card group. | Google Pay sheet on `pay.google.com` test page shows only the demo card | SR F2, F4 |
| P-2 | OPS | Register at developer.nationaltransport.ie, subscribe to GTFS-R, copy the key. | `curl` with the key returns 200 | TS 7.2 |
| P-3 | PO + OPS | Create empty GitHub repo `leap-plus` (private). Connect it to Devin. Create Vercel project (Hobby) linked to the repo. | Vercel deploys the empty repo | TS 4 |
| P-4 | OPS | Create the Google Sheet (tabs `Cards`, `Transactions`, text format on card columns) in the demo account. Seed 3 cards + 5 rows each. | Sheet matches TS 6.1 | TS 6.1, TQ2 |
| P-5 | OPS | Generate secret: `openssl rand -hex 32`. Save in password manager. Do not paste in chat or git. | Secret stored | SR F1 |
| P-6 | D1 | Scaffold: Vite + React + TS + Tailwind + Router + Zustand + Vitest + ESLint; `vercel.json` (headers, noindex); `.gitignore` with `.env*`; DisclaimerStrip; TabBar; `config.ts`; `money.ts` + tests; CI script `npm run check`. | Preview URL shows the disclaimer + 3 tabs | SR F8, F9, F16 |
| P-7 | D2 | `extract_gtfs.py` → `public/gtfs/{E1,39A,16}.json` for the **demo date**. | 3 files, each < 300 KB, stops in order | TS 7.1 |
| P-8 | D2 | `synth_realtime.py` → `public/recorded/snap-*.json` (30 snapshots). If P-2 is done: `record_realtime.ts` instead. | 30 snapshots load in a test page | TS 7.4 |
| P-9 | PO | 8–12 screenshots of the real Leap Top Up app → shared folder. Pick the exact brand green. | Colour token set in `theme` | PRD D1 |

## 3. Build tasks

Est = Devin wall-clock minutes. "Accept" = what PO/OPS checks on the preview.

### Phase P0: Clone (0:00 → hard stop 1:00) — D1

| ID | Task | Est | Accept | Ref |
|---|---|---|---|---|
| D1-1 | `apps-script/Code.gs`: `doPost` get/topup, secret from Script Properties, `@OnlyCurrentDoc`, `LockService`, idempotency bound to `(key, card, amount)`, error enum. OPS pastes + deploys (Execute as me, Anyone). | 20 | `curl` happy path + wrong secret → `UNAUTHORIZED` + replay → same tx | SR F1, F2, F5, F11 |
| D1-2 | `api/card/get.ts`, `api/card/topup.ts`, `_lib/validate.ts` (regex, int cents, enum, uuid, reject unknown fields), `_lib/http.ts` (8 s timeout, **follow Apps Script 302 redirect**, error map, masked logs). OPS sets `SHEET_WEBAPP_URL`, `SHEET_SHARED_SECRET` in Vercel. | 25 | Contract `curl` script: 2 happy, 4 error cases | SR F6, F10, F13 |
| D1-3 | S01 Welcome, S02 Scan (2.5 s anim, `?scanFail=1` → failed state), S03 Enter number (disabled until 12 digits, 404 → inline error), saved card + re-fetch (404 → clear → S01). | 25 | Flow A all branches | PF F-A |
| D1-4 | S04 Home (card visual, balance, low-balance banner < €4, Top Up CTA, last 3 tx), S12 Transactions. | 15 | Balance equals Sheet cell | PF S04, S12 |
| D1-5 | S05 Amount (chips €5/10/20/30 + custom; min €5, cap €150), S06 method list (saved card only for now), S07 confirm `•••• 4242`, S10 processing (idempotency key per attempt; timeout → error + Try again same key; `?topupFail=1`), S11 success → S04 refreshed. | 30 | Top-up €10 → Sheet balance +1000 and new tx row; retry does not double | PF F-B |
| **Gate G0 (1:00)** | PO runs Flow A + saved-card top-up on `main`. Tag `demo-p0`. | | Pass → P1. Fail → cut S12, ship. | |

### Phase P1: Wallet payments (1:00 → hard stop 1:45) — D1

| ID | Task | Est | Accept | Ref |
|---|---|---|---|---|
| D1-6 | Google Pay button (`@google-pay/button-react`, TEST, TS 5.4 request, `isReadyToPay` hides button). `onLoadPaymentData` → discard token → topup `GOOGLE_PAY`. `onCancel` → S06, no error. | 25 | Real sheet opens on the demo profile; Sheet updates; cancel is silent | TS 5.4, SR F4, F13 |
| D1-7 | S09 Apple Pay simulated sheet (Pay, merchant, card, total, "Double-click to pay" → Face ID "Done" 1 s) → topup `APPLE_PAY_SIM`. Label "Simulated". Close → S06. | 20 | Looks like the frame; Sheet updates | PF S09 |
| D1-8 | S06 order: Google Pay, Apple Pay, saved card. Post-wallet backend reject → "Top-up not completed. You were not charged." + "Change amount". | 10 | `BALANCE_CAP` forced via curl-set balance → correct error | TS 8 |
| **Gate G1 (1:45)** | PO runs Flow B with all 3 methods. Sheet visible beside the app. Tag `demo-p1`. | | Fail → cut Apple Pay sim. | |

### Phase P2: Live bus + fare (0:00 → hard stop 2:30, parallel) — D2

| ID | Task | Est | Accept | Ref |
|---|---|---|---|---|
| D2-1 | `api/realtime.ts`: allowlist + sort routes, Vehicles + TripUpdates in parallel, 5 s timeout, map route_id → short name, `RealtimeRes`, cache header, 503 `{fallback:true}`. OPS sets `NTA_API_KEY`. | 30 | `?routes=99X` → 400; no key → 503; with key → vehicles JSON | TS 7.2, SR F6, F7 |
| D2-2 | `useRealtime`: LIVE poll 20 s; RECORDED loop; auto-fallback on 503/network (entry **and** later polls) + toast; retry LIVE every 60 s; `?liveFail=1`; badge "LIVE · Ns ago" / "RECORDED · hh:mm". | 25 | Wi-Fi off → RECORDED + toast; Wi-Fi on → LIVE within 60 s | TS 7.4, 8 |
| D2-3 | S13 map (react-leaflet, OSM attribution, route chips E1/39A/16, route line, bus markers, empty state), S14 stop list sheet. | 35 | Buses visible on all 3 routes in RECORDED | PF S13, S14 |
| D2-4 | `eta.ts` + tests (next 3, Live vs Scheduled tag). S15 stop detail: arrivals, fare row "Fare €2.00 · Balance €x". | 25 | ETAs plausible vs TFI Journey Planner for 1 stop | TS 7.3 |
| D2-5 | SmartTopUpCard (< €4.00 → €10 via D1's Google Pay component + topup action; idle → processing → done/error; cancel → idle). Needs D1-6 merged. | 20 | Flow D end to end; balance €13.20 on S15 and S04 | PF F-D, TS 5.3 |
| D2-6 | F13 marker interpolation (rAF, 20 s). **First to cut.** | 15 | Smooth movement, no jank | TS 7.4 |
| **Gate G2 (2:30)** | PO runs Flows C + D on `main`. Tag `demo-p2`. **Code freeze.** | | Fail → cut per section 5. | |

## 4. Timeline (3:00 clock)

| Time | PO | OPS | D1 | D2 |
|---|---|---|---|---|
| 0:00–0:20 | Review scaffold preview; colour check | Deploy Apps Script; set Vercel env vars | D1-1, D1-2 | D2-1 |
| 0:20–1:00 | Accept D1-3/4/5 previews | Contract `curl` tests; Sheet on 2nd screen | D1-3 → D1-5 | D2-2, D2-3 |
| **1:00** | **G0** | Regression Flow A/B | — | — |
| 1:00–1:45 | Accept wallet previews | Google Pay on demo profile; record snapshots if key arrived | D1-6 → D1-8 | D2-4 |
| **1:45** | **G1** | Regression | Support D2 merge | D2-5 |
| 1:45–2:30 | Write demo script v1 | Full E2E checklist (section 6) | Bug fixes only | D2-5, D2-6 |
| **2:30** | **G2 + code freeze** | Security check (SR section 7) | P0 bug fixes only | P0 bug fixes only |
| 2:30–2:45 | Rehearse x2 | Record backup video from `demo-p2` | — | — |
| 2:45–3:00 | Final rehearse, timer | Reset Sheet to seed values; open tabs | — | — |

## 5. Cut order (if late, cut top first)

1. D2-6 marker animation.
2. S12 Transactions screen (keep last 3 rows on S04).
3. D1-7 Apple Pay simulation.
4. LIVE mode (ship RECORDED only; badge says RECORDED).
5. D2-5 smart top-up (fall back to the normal top-up path in the demo).
Never cut: disclaimer, Google Pay TEST, Sheet round-trip, security fixes F1/F2/F4/F6.

## 6. Test checklist (OPS, at G0/G1/G2)

- [ ] `npm run check` (lint, typecheck, Vitest ~15 tests) green.
- [ ] Flow A: scan OK, scan fail → retry, scan fail → enter number, unknown number → error, saved card re-open, Sheet reset → S01.
- [ ] Flow B: amount below €5 / above cap → error; saved card, Google Pay, Apple Pay sim → Sheet +amount, 1 new row each; cancel each wallet → S06; `?topupFail=1` → error → Try again → single row.
- [ ] Flow C: 3 routes render; `?liveFail=1` and Wi-Fi off → RECORDED + toast.
- [ ] Flow D: card 300000000001 at €3.20 → smart card → Google Pay → €13.20 on S15 and S04; cancel → idle; balance ≥ €4 → no card.
- [ ] iPhone 14 + Pixel 7 device modes; no console errors; Lighthouse mobile run once.
- [ ] Security check (SR section 7) at code freeze.

## 7. Demo script (3 min)

1. (0:00) Problem: real app needs card tap + card typing; no wallet; no live info. Point at the disclaimer.
2. (0:20) Flow A: scan (say "simulated NFC"), Home €3.20, low-balance banner.
3. (0:50) Flow B: Top Up €10 → **real Google Pay sheet (TEST)** → Sheet cell changes live on the 2nd screen.
4. (1:30) Live tab: E1 buses moving, badge LIVE (or RECORDED, say so). Tap a stop → live ETAs.
5. (2:00) **Wow:** balance low → smart top-up card → Google Pay → "Topped up" in 2 taps without leaving the stop.
6. (2:30) Tech depth + limits: BFF hides keys, idempotent top-ups, auto-fallback; production gaps (SR section 6).

## 8. Devin session setup

- **D1 = this session** (has full context). **D2 = one child session** started at 0:00 with a handoff: Tech Spec section 7, Process Flow S13–S15, folder ownership, branch rule, acceptance checks above.
- PO reviews PRs in priority order: D1 first, D2 when D1 is waiting.

## 9. Open questions (proposed defaults — PO to accept or change)

1. **IQ1.** Hackathon rules on pre-built work. Default: **docs, accounts, data prep allowed before the clock; code scaffold (P-6 to P-8) also allowed** — confirm with organisers.
2. **IQ2.** When does the 3:00 clock start? Default: **you tell me; I start D1 and the D2 child session at 0:00.**
3. **IQ3.** Repo owner. Default: **your GitHub account, co-founder as collaborator.**

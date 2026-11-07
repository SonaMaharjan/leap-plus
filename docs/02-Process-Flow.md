# Process Flow (Wireflow Spec): Leap+

| Field | Value |
|---|---|
| Status | APPROVED v1.0 — locked (PF1–PF4 defaults accepted) |
| Input | PRD v1.0 (locked) |
| Output | Figma wireframes (PO draws). This doc is the source of truth for screens, states, and copy. |
| Disclaimer | Concept prototype. Not affiliated with TFI or NTA. |

## 1. How to use this doc in Figma (30–45 min)

1. Create a Figma page "Screenshots". Paste your 8–12 real app screenshots. This is the base layer.
2. Create a page "Wireflow". Frame size: **iPhone 14, 390 × 844**.
3. Draw one frame per screen ID below (S01, S02 …). Name frames with the ID.
4. Sample the Leap green and other colours from your screenshots with the eyedropper. Save them as colour styles.
5. Connect frames with Figma prototype arrows, following the flows in section 3.
6. Draw only the states marked **[draw]**. Other states are for engineering.
7. Copy text from section 5. Do not invent new text in Figma; change it here first.

## 2. Screen inventory

| ID | Screen | Phase | Purpose |
|---|---|---|---|
| S00 | Disclaimer banner (component) | P0 | Thin top strip on every screen: "Concept prototype — not affiliated with TFI/NTA" |
| S01 | Welcome / Add card | P0 | First run. Choose "Scan card" or "Enter card number" |
| S02 | Scan card (simulated NFC) | P0 | "Hold your Leap card to the back, top of your phone" + animation |
| S03 | Enter card number | P0 | Manual entry fallback |
| S04 | Home (Card) | P0 | Card visual, balance, last updated, Top Up CTA, Transactions link |
| S05 | Top Up: amount | P0 | Dial + tap-to-enter amount, min €5, max balance €150 |
| S06 | Top Up: payment method | P0/P1 | P0: saved card only. P1: Google Pay, Apple Pay, saved card |
| S07 | Saved card confirm (simulated) | P0 | Masked card "•••• 4242", Pay €X button |
| S08 | Google Pay sheet | P1 | **Real** Google Pay sheet (drawn by Google; in Figma, place a screenshot placeholder) |
| S09 | Apple Pay sheet (simulated) | P1 | Our look-alike bottom sheet: merchant, amount, "Confirm with Face ID" |
| S10 | Processing | P0 | Spinner while our API updates the Sheet |
| S11 | Success | P0 | Amount, new balance, reference, timestamp |
| S12 | Transactions | P0 | Last 5 transactions |
| S13 | Live: route map | P2 | Route selector, map, bus markers, LIVE/RECORDED badge |
| S14 | Live: stop list | P2 | Stops of the selected route (bottom sheet over map) |
| S15 | Live: stop detail | P2 | Next 3 arrivals, fare vs. balance, smart top-up card |
| S16 | Error (component) | All | Reusable error panel with retry |

Navigation: bottom tab bar on S04, S12, S13–S15: **Card | Top Up | Live**.

## 3. Flows

### F-A. First run (P0)
```
S01 Welcome
 ├─ "Scan card" ──► S02 Scan (2–3 s animation) ──► [API: get card] ──► S04 Home
 └─ "Enter card number" ──► S03 Enter number ──► [API: get card] ──► S04 Home
                                         └─ card not found ──► S03 with inline error
S02 scan fails ──► S02 failed state: "Try again" (back to S02) or "Enter number instead" (to S03)
```
Card number is saved in the browser. Next launch opens S04 directly.

### F-B. Top up with saved card — the clone (P0)
```
S04 Home ──"Top Up"──► S05 Amount ──"Continue"──► S06 Method (saved card)
   ──► S07 Confirm ──"Pay €10.00"──► S10 Processing [API: top up] ──► S11 Success ──"Done"──► S04 (new balance)
```
Taps from Home to Success: **4** (Top Up, Continue, Saved card, Pay). Baseline. The real app also needs card details typed in on first use.

### F-C. Top up with Google Pay (P1)
```
S04 ──► S05 Amount ──► S06 Method ──"Google Pay"──► S08 Google Pay sheet (real, TEST)
   ──"Continue/Pay"──► S10 Processing [API: top up] ──► S11 Success ──► S04
                 └─ user closes sheet ──► back to S06, no error shown
```
Taps from Home to Success: **4** (Top Up, Continue, Google Pay, Pay in sheet). Same tap count as the clone, but no card details ever, and the wallet handles authentication.

### F-D. Top up with Apple Pay — simulated (P1)
```
S06 ──"Apple Pay"──► S09 Apple Pay sim sheet ──"Double-click to pay" (tap) ──► Face ID animation (1 s)
   ──► S10 Processing [API: top up] ──► S11 Success
```

### F-E. Live bus (P2)
```
Tab "Live" ──► S13 Route map (default route 1 selected; buses refresh every 20 s)
   ├─ route chip ──► S13 with new route
   ├─ badge tap ──► toggle LIVE ⇄ RECORDED
   └─ "Stops" handle (drag up) ──► S14 Stop list ──tap stop──► S15 Stop detail
```

### F-F. Smart top-up — the wow moment (P2)
```
S15 Stop detail: fare €2.00, balance €3.20 < €4.00 trigger
   ──► smart card: "Low balance for your next trips. Top up €10 with Google Pay"
   ──tap──► S08 Google Pay sheet ──► inline processing on S15 ──► smart card turns to "Topped up. Balance €13.20"
   (map stays visible; buses keep moving)
```
Taps from Live screen to Success: **2** (smart card, Pay in sheet). This is the tap-saving pitch.
In the demo, the Google Sheet sits beside the browser. The balance cell changes after each top-up.

## 4. States per screen

| Screen | Loading | Empty | Error | Success / other |
|---|---|---|---|---|
| S02 Scan | Animation **[draw]** | — | "We could not read your card." + "Try again" + "Enter number instead" → S03 **[draw]** (demo: triggered by a debug flag) | "Card found" tick, then S04 |
| S03 Enter number | Button spinner | Button disabled until 12+ digits | "We could not find this card" **[draw]** | → S04 |
| S04 Home | Skeleton card | — | "Balance could not update. Showing last known balance" + retry | Low-balance hint if < €4.00 **[draw]** |
| S05 Amount | — | Default €10 selected | "Minimum top-up is €5" / "Card balance cannot exceed €150" **[draw]** | — |
| S06 Method | Google Pay button loads async (show grey placeholder) | — | Google Pay unavailable → hide button, show others | — |
| S08 Google Pay | Google controls | — | User cancels → back to S06 silently | Token received → S10 |
| S10 Processing | Spinner + "Topping up your card…" **[draw]** | — | Timeout 8 s → S16 "Top-up not confirmed. You were not charged." + retry | → S11 |
| S11 Success | — | — | — | Tick, amount, new balance, ref, time **[draw]** |
| S12 Transactions | Skeleton rows | "No transactions yet" | S16 + retry | List **[draw]** |
| S13 Map | Map tiles + "Loading buses…" | "No buses on this route right now" **[draw]** | "Live data unavailable. Switched to RECORDED" (auto fallback) | Bus markers + badge **[draw]** |
| S15 Stop detail | Skeleton arrivals | "No more departures today" | "Arrival times unavailable" | Arrivals; smart top-up card **[draw]** |

## 5. Copy deck

| Key | Text |
|---|---|
| disclaimer | Concept prototype — not affiliated with TFI/NTA |
| s01.title | Add your Leap card |
| s01.scan | Scan card |
| s01.manual | Enter card number |
| s02.title | Hold your Leap card to the back, top of your phone |
| s02.found | Card found |
| s02.fail | We could not read your card. |
| s02.retry | Try again |
| s02.manual | Enter number instead |
| s03.label | Leap card number |
| s03.help | You find the number on the back of your card. |
| s03.notFound | We could not find this card. Check the number and try again. |
| s04.balance | Balance |
| s04.updated | Updated {time} |
| s04.low | Low balance. Top up before your next trip. |
| s04.topup | Top Up |
| s04.tx | Recent transactions |
| s05.title | Choose amount |
| s05.min | Minimum top-up is €5. |
| s05.max | Card balance cannot exceed €150. |
| s05.cta | Continue |
| s06.title | Pay with |
| s06.saved | Saved card •••• 4242 |
| s07.cta | Pay €{amount} |
| s09.merchant | Leap+ Demo |
| s09.hint | Double-click to pay |
| s10.text | Topping up your card… |
| s10.timeout | Top-up not confirmed. You were not charged. |
| s11.title | Top-up complete |
| s11.newBalance | New balance €{balance} |
| s11.ref | Reference {ref} |
| s13.badgeLive | LIVE · {seconds}s ago |
| s13.badgeRec | RECORDED · {time} |
| s13.noBus | No buses on this route right now. |
| s13.fallback | Live data unavailable. Switched to RECORDED. |
| s15.fare | Fare €2.00 · Balance €{balance} |
| s15.smart | Low balance for your next trips. Top up €10 with Google Pay. |
| s15.smartDone | Topped up. Balance €{balance}. |
| s15.live | Live |
| s15.sched | Scheduled |
| err.retry | Try again |

## 6. Shared components (draw once in Figma)

Disclaimer strip · Bottom tab bar · Leap card visual · Primary button (Leap green) · Amount chip · Payment method row · Google Pay button (official black button) · Apple Pay button (black, "Pay" with Apple-style label) · Bottom sheet · Skeleton row · Error panel · LIVE/RECORDED badge · Bus marker · Stop row · Smart top-up card.

## 7. Resolved questions (accepted in v1.0)

Flow diagram with decision branches: see 02c-Flow-Diagram.md.


1. **PF1.** Real app top-up uses a dial. Keep the dial in S05, or use amount chips (€5/€10/€20/€30 + custom)? Default: **chips + custom** (faster to build and to tap; dial is a P0 cut candidate).
2. **PF2.** Smart top-up amount: fixed €10? Default: **€10**.
3. **PF3.** Live tab default route: the first of the 3 chosen routes. Default: **yes**.
4. **PF4.** Fake saved card shows "•••• 4242". Default: **yes**.

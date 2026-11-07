# Figma Linking Guide: Link the Existing Leap+ Wireframes (Figma Design)

Goal: link the existing frames (S01–S15 + state variants) exactly like the Mermaid chart (02c-Flow-Diagram.md). Do not create or redesign any screen.
Results: (1) arrows between the frames on the canvas, (2) a clickable walk-through from S01.

## 0. Verified tool facts (Figma Help Center)

- **"Add interactions" (Figma AI)** — Prototype tab → Interactions → "Add interactions". It links the **selected** frames: simple flows, back/next buttons, navigation menus. **It takes no text prompt.** It infers links from frame order and **layer names**. Then you click "Preview" and "Keep it". Plans: Professional, Education, Organization, Enterprise. Source: help.figma.com/hc/en-us/articles/24004778051479
- **Figma agent** — a chat AI in Figma Design files that "generates and edits designs". The docs do not say it can create prototype links. Not verified. Try the prompt in section 3; if it fails, use section 2.
- **"Rename layers" (Figma AI)** — improves "Add interactions" output.
- Expect the AI to link the happy path well and to miss failure, cancel, and timed branches. Section 4 fixes those by hand.

## 1. Prepare (10 min): name the layers so the AI can match them

1. Frame names must match exactly: "S01 Welcome", "S02 Scan card", "S02 Card found", "S02 Scan failed", "S03 Enter card number", "S03 Error", "S04 Home", "S04 Home — €13.20", "S05 Choose amount", "S05 Error", "S06 Pay with", "S07 Saved card confirm", "S08 Google Pay sheet", "S09 Apple Pay sheet", "S09 Done", "S10 Processing", "S10 Error", "S11 Success", "S12 Transactions", "S13 Route map", "S13 RECORDED", "S14 Stop list", "S15 Stop detail — 1 Offer", "S15 Stop detail — 2 Processing", "S15 Stop detail — 3 Done".
   If a state variant sits inside the same frame, duplicate it into its own frame.
2. Rename each button layer to **"Go to <target frame>"**. Example: the "Scan card" button on S01 → layer name "Go to S02 Scan card". Use the "To frame" column in section 4. This is the single biggest quality lever for the AI.
3. Arrange the frames in 4 rows, left to right, 80 px gaps, in flow order (the AI uses order for "next"):
   - Row A "First run": S01 · S02 Scan card · S02 Card found · S02 Scan failed · S03 Enter card number · S03 Error · S04 Home · S12 Transactions
   - Row B "Top up": S05 Choose amount · S05 Error · S06 Pay with · S07 · S08 · S09 · S09 Done · S10 Processing · S10 Error · S11 Success · S04 Home — €13.20
   - Row C "Live bus": S13 Route map · S13 RECORDED · S14 Stop list · S15 — 1 Offer
   - Row D "Smart top-up": S15 — 1 Offer · S08 (duplicate, name "S08 Google Pay sheet — smart") · S15 — 2 Processing · S15 — 3 Done
4. Rename the route label "46A" to "E1" in S13, S14, S15 (46A no longer exists in the GTFS feed).

## 2. Run "Add interactions" (5 min per row)

For each row A → D:
1. Select all frames in the row.
2. Prototype tab → Interactions → "Add interactions".
3. Click "Preview". Click through the row.
4. Click "Keep it".
5. Open section 4. Tick each link that exists. Add the missing links by hand: select the element → drag the blue "+" handle to the target frame.
Last: link the tab bars ("Card" → S04, "Top Up" → S05, "Live" → S13). Select S01 → Prototype tab → "Flow starting point" → name "Leap+ demo". Turn on "Show prototype connections" to see the arrows.

## 3. Prompt for the Figma agent (only if your file shows the agent chat)

Select all frames first, then paste:

```
Add prototype connections (interactions) between the selected frames. Do not create, delete, move, restyle, or rename any frame or layer. Do not change any text.

Rules:
- Use exactly the source element and target frame in the table below. Match elements by their visible text or layer name "Go to <frame>".
- Default interaction: On tap → Navigate to → Smart animate, ease out, 250 ms.
- "Overlay" = Open overlay, position bottom, close when clicking outside, background dim 40%.
- "After delay N ms" = an After delay trigger on the whole frame.
- "Back" = Back action.

Links (from frame | element | to frame | interaction):
A. First run
S01 Welcome | "Scan card" | S02 Scan card | navigate
S01 Welcome | "Enter card number" | S03 Enter card number | navigate
S02 Scan card | frame | S02 Card found | after delay 2500 ms
S02 Card found | frame | S04 Home | after delay 1000 ms
S02 Scan card | phone illustration | S02 Scan failed | navigate (demo trigger for the failure branch)
S02 Scan failed | "Try again" | S02 Scan card | navigate
S02 Scan failed | "Enter number instead" | S03 Enter card number | navigate
S03 Enter card number | "Continue" | S04 Home | navigate
S03 Enter card number | input field "Leap card number" | S03 Error | navigate (demo trigger for card not found)
S03 Error | input field | S03 Enter card number | navigate
S02 Scan card, S02 Scan failed, S03 Enter card number, S03 Error | back arrow | — | back
S04 Home | "See all" | S12 Transactions | navigate
S12 Transactions | back arrow | — | back

B. Top up
S04 Home | "Top Up" | S05 Choose amount | navigate
S05 Choose amount | "Custom" | S05 Error | navigate (demo trigger for invalid amount)
S05 Error | "€10" | S05 Choose amount | navigate
S05 Choose amount | "Continue" | S06 Pay with | navigate
S06 Pay with | "Saved card •••• 4242" | S07 Saved card confirm | navigate
S07 Saved card confirm | "Pay €10.00" | S10 Processing | navigate
S06 Pay with | "Pay with G Pay" | S08 Google Pay sheet | overlay
S08 Google Pay sheet | "Continue" | S10 Processing | navigate
S06 Pay with | "Pay with Apple Pay" | S09 Apple Pay sheet | overlay
S09 Apple Pay sheet | "Double-click to pay" | S09 Done | navigate
S09 Done | frame | S10 Processing | after delay 1000 ms
S10 Processing | frame | S11 Success | after delay 1500 ms
S10 Processing | spinner | S10 Error | navigate (demo trigger for timeout)
S10 Error | "Try again" | S10 Processing | navigate
S11 Success | "Done" | S04 Home — €13.20 | navigate
S05 Choose amount, S06 Pay with, S07 Saved card confirm | back arrow | — | back

C. Live bus
S04 Home, S04 Home — €13.20, S12 Transactions, S13 Route map, S14 Stop list, S15 Stop detail — 1 Offer | tab "Card" | S04 Home | navigate, instant
same frames | tab "Top Up" | S05 Choose amount | navigate, instant
same frames | tab "Live" | S13 Route map | navigate, instant
S13 Route map | badge "LIVE" | S13 RECORDED | navigate (demo trigger for LIVE failure)
S13 RECORDED | badge "RECORDED" | S13 Route map | navigate
S13 Route map | handle "Stops" | S14 Stop list | navigate, move in from bottom
S14 Stop list | stop row "O'Connell St Upper" | S15 Stop detail — 1 Offer | navigate, move in from bottom
S14 Stop list, S15 Stop detail — 1 Offer | sheet handle | — | back

D. Smart top-up
S15 Stop detail — 1 Offer | "Top up with G Pay" | S08 Google Pay sheet — smart | overlay
S08 Google Pay sheet — smart | "Continue" | S15 Stop detail — 2 Processing | navigate
S15 Stop detail — 2 Processing | frame | S15 Stop detail — 3 Done | after delay 1500 ms
S15 Stop detail — 3 Done | tab "Card" | S04 Home — €13.20 | navigate, instant

Then set "S01 Welcome" as the flow starting point named "Leap+ demo". Report any link you could not create, with the reason.
```

Note: closing an overlay by clicking outside = the cancel branch (back to S06, or back to S15 — 1 Offer). No extra link needed.

## 4. Link table: source of truth (checklist + manual fix)

Default interaction: **On tap → Navigate to → Smart animate, 250 ms**. Sheets (S08, S09): **Open overlay → Bottom, close on outside click**. Auto-advance: **After delay**.

| # | From frame | Element / trigger | To frame | Branch |
|---|---|---|---|---|
| A1 | S01 Welcome | "Scan card" | S02 Scan card | — |
| A2 | S01 Welcome | "Enter card number" | S03 Enter card number | — |
| A3 | S02 Scan card | After delay 2500 ms | S02 Card found | success |
| A4 | S02 Card found | After delay 1000 ms | S04 Home | success |
| A5 | S02 Scan card | Tap illustration (demo trigger) | S02 Scan failed | **fail** |
| A6 | S02 Scan failed | "Try again" | S02 Scan card | retry |
| A7 | S02 Scan failed | "Enter number instead" | S03 Enter card number | fallback |
| A8 | S03 Enter card number | "Continue" | S04 Home | success |
| A9 | S03 Enter card number | Tap input (demo trigger) | S03 Error | **fail** |
| A10 | S03 Error | Tap input | S03 Enter card number | retry |
| A11 | S02 / S03 | Back arrow | S01 Welcome | back |
| B1 | S04 Home | "Top Up" | S05 Choose amount | — |
| B2 | S04 Home | "See all" | S12 Transactions | — |
| B3 | S12 Transactions | Back arrow | S04 Home | back |
| B4 | S05 Choose amount | "Custom" chip | S05 Error | **fail** |
| B5 | S05 Error | "€10" chip | S05 Choose amount | retry |
| B6 | S05 Choose amount | "Continue" | S06 Pay with | success |
| B7 | S06 Pay with | "Saved card •••• 4242" | S07 Saved card confirm | — |
| B8 | S07 Saved card confirm | "Pay €10.00" | S10 Processing | — |
| B9 | S06 Pay with | "Pay with G Pay" | S08 Google Pay sheet (overlay) | — |
| B10 | S08 Google Pay sheet | "Continue" | S10 Processing | success |
| B11 | S08 Google Pay sheet | Outside click | close overlay (S06) | **cancel** |
| B12 | S06 Pay with | "Pay with Apple Pay" | S09 Apple Pay sheet (overlay) | — |
| B13 | S09 Apple Pay sheet | "Double-click to pay" | S09 Done | — |
| B14 | S09 Done | After delay 1000 ms | S10 Processing | success |
| B15 | S09 Apple Pay sheet | Outside click | close overlay (S06) | **cancel** |
| B16 | S10 Processing | After delay 1500 ms | S11 Success | success |
| B17 | S10 Processing | Tap spinner (demo trigger) | S10 Error | **fail** |
| B18 | S10 Error | "Try again" | S10 Processing | retry |
| B19 | S11 Success | "Done" | S04 Home — €13.20 | — |
| B20 | S05 / S06 / S07 | Back arrow | previous frame | back |
| C1 | Any tab bar | "Live" | S13 Route map | — |
| C2 | S13 Route map | LIVE badge (demo trigger) | S13 RECORDED | **fail → fallback** |
| C3 | S13 RECORDED | Badge | S13 Route map | recover |
| C4 | S13 Route map | "Stops" handle | S14 Stop list | — |
| C5 | S14 Stop list | Stop row "O'Connell St Upper" | S15 Stop detail — 1 Offer | — |
| C6 | S14 / S15 | Drag down / back | S13 Route map | back |
| C7 | Any tab bar | "Card" | S04 Home | — |
| C8 | Any tab bar | "Top Up" | S05 Choose amount | — |
| D1 | S15 Stop detail — 1 Offer | "Top up with G Pay" | S08 Google Pay sheet — smart (overlay) | — |
| D2 | S08 Google Pay sheet — smart | "Continue" | S15 Stop detail — 2 Processing | success |
| D3 | S08 Google Pay sheet — smart | Outside click | close overlay (S15 Stop detail — 1 Offer) | **cancel** |
| D4 | S15 Stop detail — 2 Processing | After delay 1500 ms | S15 Stop detail — 3 Done | success |
| D5 | S15 Stop detail — 3 Done | "Card" tab | S04 Home — €13.20 | — |

Frame "S04 Home — €13.20": duplicate S04 (balance €13.20, no low-balance banner, new top-up row) if it does not exist.
Set the flow starting point: select S01 → Prototype tab → "Flow starting point" → name it "Leap+ demo".

## 5. Check against the Mermaid flow

Every decision diamond in 02c must have 2 links in the table:
| Diamond | Links |
|---|---|
| Card read OK? | A3 / A5 |
| Card found? | A8 / A9 |
| Amount valid? | B6 / B4 |
| Payment method | B7 / B9 / B12 |
| Paid? (Google Pay) | B10 / B11 |
| Confirmed? (Apple Pay) | B14 / B15 |
| Confirmed within 8 s? | B16 / B17 |
| LIVE data available? | C1 / C2 |
| Balance < €4.00? | C5 (state 1) / D5 (after top-up, card hidden) |
| Paid? (smart top-up) | D2 / D3 |

# Figma AI Prompts: Leap+ Wireflow

Source: Process Flow v0.1 (defaults PF1–PF4 applied). Concept prototype — not affiliated with TFI/NTA.

## How to run

- **Figma Make (clickable prototype):** paste Prompt 0, then Prompts 1–4 one after another in the same chat. Make keeps context.
- **Figma Design "First Draft" (static wireframes):** AI tools work better with short prompts. Run Prompt 0 + Prompt 1 together first. Then run Prompts 2, 3, 4 each with Prompt 0 pasted on top.
- Split the work: **you run Prompts 1–2 (top-up). Co-founder runs Prompts 3–4 (live + smart top-up).** Then compare against the Process Flow doc.
- After generation: sample the exact Leap green from your real-app screenshots and replace the colour style.
- Feedback format to Devin: "S05: <what is wrong> → <what you expect>".

---

## Prompt 0 — Global context (paste on top of every prompt)

```
Design low-to-mid fidelity mobile wireframes for "Leap+", a concept prototype that clones a public-transport card top-up app for Dublin, Ireland, and adds wallet payments and live bus tracking.

Device: iPhone 14 frame, 390 x 844. Style: clean, modern, flat. Primary colour: transit green (#3BA935 as a placeholder). Neutral greys, white background, black text. Font: Inter. Corner radius 12. Tap targets at least 44 px. Text contrast at least 4.5:1.

Every screen has a thin strip at the very top with the text: "Concept prototype — not affiliated with TFI/NTA".
Main screens have a bottom tab bar with 3 tabs: "Card", "Top Up", "Live".
Currency is euro (€). Use the exact text I give in quotes. Name each frame with its screen ID (for example "S04 Home").
Do not use any real company logos.
```

## Prompt 1 — P0 Clone: first run + home (S01–S04, S12)

```
Create these screens and link them in order:

S01 Welcome: title "Add your Leap card". Illustration of a green transit card. Primary button "Scan card". Secondary text button "Enter card number".

S02 Scan card: title "Hold your Leap card to the back, top of your phone". Illustration of a phone with a card touching the back top edge and NFC waves. Show a second state of the same screen with a green tick and text "Card found".

S03 Enter card number: input field labelled "Leap card number", helper text "You find the number on the back of your card.", primary button "Continue" (disabled style). Show an error state with red text "We could not find this card. Check the number and try again."

S04 Home (Card tab active): large green card visual with masked card number "•••• •••• 1234" and label "Adult". Below it: label "Balance", large amount "€3.20", small text "Updated 12:42". An amber warning banner "Low balance. Top up before your next trip." A large primary button "Top Up". A section "Recent transactions" with 3 rows (date, description, amount, e.g. "Today · Dublin Bus · -€2.00") and a link "See all".

S12 Transactions: title "Recent transactions", list of 5 rows with date, description, and amount; top-ups shown as "+€10.00" in green, fares as "-€2.00".

Flow: S01 → S02 → S04. S01 → S03 → S04. S04 "See all" → S12.
```

## Prompt 2 — P0 + P1 Top-up and payments (S05–S11)

```
Create these screens and link them in order:

S05 Choose amount: title "Choose amount". Current balance shown small at top "Balance €3.20". Grid of amount chips: "€5", "€10" (selected), "€20", "€30", "Custom". Helper text "Minimum top-up is €5." Show an error state with "Card balance cannot exceed €150." Primary button at bottom "Continue".

S06 Pay with: title "Pay with". Summary "Top up €10.00". Three full-width payment options stacked: a black Google Pay style button reading "Pay with G Pay", a black Apple Pay style button reading "Pay with Apple Pay", and a white row "Saved card •••• 4242" with a card icon.

S07 Saved card confirm: summary card "Top up €10.00 · Saved card •••• 4242". Primary button "Pay €10.00".

S08 Google Pay sheet placeholder: a white bottom sheet over a dimmed S06, labelled "Google Pay sheet (system UI, TEST mode)", showing "Leap+ Demo", "€10.00", a card row "Visa •••• 1111", and a button "Continue".

S09 Apple Pay sheet (simulated): a white bottom sheet over dimmed S06 in Apple Pay style: header "Pay", merchant "Leap+ Demo", card row "Visa •••• 1111", total "€10.00", footer with Face ID icon and text "Double-click to pay". Second state: Face ID icon with text "Done".

S10 Processing: centred spinner, text "Topping up your card…". Error state: red icon, text "Top-up not confirmed. You were not charged." and button "Try again".

S11 Success: large green tick, title "Top-up complete", rows "Amount €10.00", "New balance €13.20", "Reference LPX-48213", "Time 12:45". Primary button "Done".

Flow: S04 "Top Up" → S05 → S06. S06 Saved card → S07 → S10 → S11. S06 Google Pay → S08 → S10 → S11. S06 Apple Pay → S09 → S10 → S11. S11 "Done" → S04 showing balance "€13.20" and no low-balance banner.
```

## Prompt 3 — P2 Live bus (S13–S14)

```
Create these screens:

S13 Live route map (Live tab active): full-screen map of central Dublin. At the top, horizontal route chips "46A" (selected, green), "39A", "16". A small pill badge at top right "LIVE · 12s ago" with a green dot; show a variant "RECORDED · 12:30" with a grey dot. A green route line across the map with 5 small stop dots. 4 bus markers on the line: rounded green markers with a bus icon and the route number. A bottom sheet handle with text "Stops". Empty state variant: text "No buses on this route right now." Fallback variant: a toast "Live data unavailable. Switched to RECORDED."

S14 Stop list: the bottom sheet from S13 dragged up to half height over the map. Title "46A towards Dún Laoghaire". A vertical list of 8 stops with stop name and stop number, connected by a vertical green line, and a small "2 min" bus icon between two stops showing where a bus is now.

Flow: Live tab → S13. S13 route chip → S13 with another route. S13 "Stops" → S14. S14 tap a stop → S15 (next prompt).
```

## Prompt 4 — P2 Stop detail + smart top-up wow moment (S15)

```
Create S15 Stop detail as a bottom sheet over the S13 map (map and bus markers still visible above).

Header: stop name "O'Connell St Upper", "Stop 7603", route chip "46A".
Section "Next buses": 3 rows, each with route "46A", destination "Dún Laoghaire", time, and a tag: row 1 "3 min" with green tag "Live", row 2 "11 min" with green tag "Live", row 3 "24 min" with grey tag "Scheduled".
Fare row: "Fare €2.00 · Balance €3.20".
Smart top-up card (amber border, highlighted): text "Low balance for your next trips. Top up €10 with Google Pay." and a black Google Pay style button "Top up with G Pay".

Create 3 states of S15 side by side:
1. Smart top-up card visible (balance €3.20).
2. Processing: the card shows a spinner and "Topping up…".
3. Done: the card turns green with a tick and text "Topped up. Balance €13.20." The fare row now shows "Fare €2.00 · Balance €13.20".

Flow: state 1 button → S08 Google Pay sheet → state 2 → state 3.
```

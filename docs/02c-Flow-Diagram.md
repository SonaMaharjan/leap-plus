# Flow Diagram with Decision Branches: Leap+

Two ways to get arrows and decision branches in Figma:
1. **FigJam AI** (recommended for a flowchart): open a FigJam board → AI "Generate" → paste Prompt FJ-1.
2. **Figma MCP `generate_diagram`** (if connected): Devin sends the Mermaid code below and the diagram appears in FigJam.
3. **Wireframe frames with arrows:** in Figma Design, add prototype connections between the frames (Prototype tab → drag the blue handle from a button to the target frame). Turn on "Show prototype connections" to see arrows on the canvas.

Shapes: rounded box = screen, diamond = decision, cylinder = our API (Google Sheet), red path = failure branch.

## Prompt FJ-1 — FigJam AI flowchart (paste as-is)

```
Create a left-to-right flowchart titled "Leap+ user flows (concept prototype)". Use rounded rectangles for screens (label = screen ID + name), diamonds for decisions, a cylinder for "Our API (Google Sheet)", green arrows for success paths, red arrows for failure paths. Group into 4 labelled sections.

Section A "First run":
Start: "App opened" → diamond "Card saved?" — Yes → "S04 Home". No → "S01 Welcome".
"S01 Welcome" → diamond "User choice" — "Scan card" → "S02 Scan card"; "Enter card number" → "S03 Enter card number".
"S02 Scan card" → diamond "Card read OK?" — Yes → "Our API: get card"; No (red) → "S02 Scan failed: Try again / Enter number instead". From "S02 Scan failed": "Try again" → "S02 Scan card"; "Enter number instead" → "S03 Enter card number".
"S03 Enter card number" → "Our API: get card".
"Our API: get card" → diamond "Card found?" — Yes → "Save card on device" → "S04 Home". No (red) → "S03 error: We could not find this card" → back to "S03 Enter card number".

Section B "Top up":
"S04 Home" → "S05 Choose amount" → diamond "Amount valid? (min €5, balance ≤ €150)" — No (red) → "S05 inline error" → back to "S05 Choose amount". Yes → "S06 Pay with".
"S06 Pay with" → diamond "Payment method" — "Saved card" → "S07 Confirm" → "S10 Processing"; "Google Pay" → "S08 Google Pay sheet (TEST)"; "Apple Pay" → "S09 Apple Pay sheet (simulated)".
"S08 Google Pay sheet" → diamond "Paid?" — Yes → "S10 Processing"; Cancelled (red) → back to "S06 Pay with".
"S09 Apple Pay sheet" → diamond "Confirmed?" — Yes → "S10 Processing"; Cancelled (red) → back to "S06 Pay with".
"S10 Processing" → "Our API: top up" → diamond "Confirmed within 8 s?" — Yes → "S11 Success" → "S04 Home (new balance)". No (red) → "S10 error: Not confirmed. You were not charged" → "Try again" → "S10 Processing".

Section C "Live bus":
"Live tab" → diamond "LIVE data available?" — Yes → "S13 Route map (LIVE)"; No (red) → "S13 Route map (RECORDED) + toast".
"S13 Route map" → "S14 Stop list" → "S15 Stop detail".

Section D "Smart top-up (wow)":
"S15 Stop detail" → diamond "Balance < €4.00?" — No → "Show arrivals + fare only". Yes → "Smart top-up card: Top up €10 with Google Pay" → "S08 Google Pay sheet" → diamond "Paid?" — Yes → "Our API: top up" → "S15: Topped up. Balance €13.20"; Cancelled (red) → back to "S15 Stop detail".
```

## Mermaid source (same flow; for Figma MCP or any Mermaid viewer)

```mermaid
flowchart LR
  subgraph A[First run]
    start([App opened]) --> saved{Card saved?}
    saved -- Yes --> S04[S04 Home]
    saved -- No --> S01[S01 Welcome]
    S01 -- Scan card --> S02[S02 Scan card]
    S01 -- Enter card number --> S03[S03 Enter card number]
    S02 --> readOK{Card read OK?}
    readOK -- Yes --> getCard[(API: get card)]
    readOK -- No --> S02F[S02 Scan failed]
    S02F -- Try again --> S02
    S02F -- Enter number instead --> S03
    S03 --> getCard
    getCard --> found{Card found?}
    found -- Yes --> save[Save card on device] --> S04
    found -- No --> S03E[S03 error: card not found] --> S03
  end
  subgraph B[Top up]
    S04 --> S05[S05 Choose amount] --> valid{Amount valid?}
    valid -- No --> S05E[S05 inline error] --> S05
    valid -- Yes --> S06[S06 Pay with] --> method{Method}
    method -- Saved card --> S07[S07 Confirm] --> S10[S10 Processing]
    method -- Google Pay --> S08[S08 Google Pay sheet TEST] --> gpOK{Paid?}
    method -- Apple Pay --> S09[S09 Apple Pay sim] --> apOK{Confirmed?}
    gpOK -- Yes --> S10
    gpOK -- Cancelled --> S06
    apOK -- Yes --> S10
    apOK -- Cancelled --> S06
    S10 --> topup[(API: top up)] --> ok8{Confirmed within 8 s?}
    ok8 -- Yes --> S11[S11 Success] --> S04
    ok8 -- No --> S10E[S10 error: not charged] -- Try again --> S10
  end
  subgraph C[Live bus]
    live([Live tab]) --> liveOK{LIVE data available?}
    liveOK -- Yes --> S13[S13 Route map LIVE]
    liveOK -- No --> S13R[S13 Route map RECORDED + toast]
    S13 --> S14[S14 Stop list] --> S15[S15 Stop detail]
    S13R --> S14
  end
  subgraph D[Smart top-up]
    S15 --> low{Balance < €4.00?}
    low -- No --> arr[Arrivals + fare only]
    low -- Yes --> smart[Smart card: Top up €10 with Google Pay] --> S08b[S08 Google Pay sheet] --> paid2{Paid?}
    paid2 -- Yes --> topup2[(API: top up)] --> done[S15: Topped up, balance €13.20]
    paid2 -- Cancelled --> S15
  end
```

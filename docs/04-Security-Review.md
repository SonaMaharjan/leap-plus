# Security Review: Leap+ (Concept Prototype)

| Field | Value |
|---|---|
| Status | APPROVED v1.0 — locked (SQ1–SQ3 defaults accepted) |
| Inputs | PRD v1.0, Process Flow v1.0, Tech Spec v1.0 (all locked) |
| Method | STRIDE per trust boundary + abuse cases + demo-day risks |
| Reviewer | Devin (Eng); owner of fixes: co-founder (QA/Ops) |
| Next gate | Implementation Plan (every "Fix in build" finding becomes a task) |

## 1. Scope and risk posture

- **In scope:** browser app, Vercel BFF (`/api/card/get`, `/api/card/topup`, `/api/realtime`), Apps Script web app, Google Sheet, Google Pay TEST, NTA GTFS-R, the demo laptop and accounts.
- **Assets:** NTA API key, Sheet shared secret, Apps Script owner account, Google Pay presenter account, fake card data, project reputation (trademark, phishing look-alike).
- **Not at risk:** real money (TEST mode, simulation), real personal data (fake cards only), physical Leap cards (never touched).
- **Posture:** demo-grade. Fix what can break the demo, leak a secret, leak personal data, or hurt reputation. Accept the rest and state it as a production gap (section 6). Judges reward known, stated limits.

## 2. Architecture and trust boundaries

```
[Presenter Chrome] --TB1 (internet, HTTPS)--> [Vercel BFF] --TB2 (HTTPS + shared secret)--> [Apps Script --TB3--> Google Sheet]
        |                                          |
        +--TB4--> [Google Pay TEST (pay.google.com)]   +--TB5 (HTTPS + x-api-key)--> [NTA GTFS-R API]
```
- TB1: untrusted. Anyone with the URL can call the BFF.
- TB2: Apps Script URL is public ("Anyone"); only the secret protects it.
- TB3: the script runs as its owner ("Execute as: Me") with that account's Google permissions.
- TB4: browser ↔ Google. Token returns to the browser.
- TB5: server-only key.

## 3. STRIDE summary

| Threat | Where | Example | Control | Finding |
|---|---|---|---|---|
| **S**poofing | TB1 | Anyone calls `/api/card/topup` for any card | None (no auth) | F3 accepted |
| **S**poofing | TB2 | Attacker calls Apps Script directly | Shared secret | F1, F2 |
| **T**ampering | TB1 | Client claims "paid" without paying | None (BFF trusts the client) | F3 accepted |
| **T**ampering | TB1 | Same idempotency key, bigger amount | Key bound to payload | F5 |
| **T**ampering | TB3 | Formula injection in Sheet cells | Enum/regex-only writes | F11 |
| **R**epudiation | TB2/3 | "I never topped up" | Transactions tab = append-only log | F13 |
| **I**nfo disclosure | TB5 | NTA key in browser bundle | Server env, no `VITE_` | F6 |
| **I**nfo disclosure | TB4 | Presenter's real cards on the projector | Dedicated demo account | **F4** |
| **I**nfo disclosure | TB1 | Stack traces, upstream errors | Generic error map | F10 |
| **D**enial of service | TB1/5 | Hammer `/api/realtime`; NTA rate limit | 20 s shared cache, route allowlist | F7 |
| **D**enial of service | TB2 | Apps Script lock contention / quota | `waitLock(5000)` → BUSY, retry same key | F12 |
| **E**levation | TB3 | Script abuses owner's whole Drive | `@OnlyCurrentDoc`, dedicated account | **F2** |

## 4. Findings

Severity is for **this demo**. Status: **Fix** = do in the build; **Accept** = documented demo gap; **Check** = verify at code freeze.

| ID | Sev | Finding | Action | Status |
|---|---|---|---|---|
| F1 | High | Apps Script URL is public; a weak or committed secret lets anyone edit balances. | 32-byte random secret (`openssl rand -hex 32`). Store in Vercel env `SHEET_SHARED_SECRET` and Apps Script **Script Properties**, never in `Code.gs` or git. Reject missing/wrong secret with `UNAUTHORIZED`. Rotate after the demo. | Fix |
| F2 | High | "Execute as: Me" gives the script the owner's Google permissions. A personal account exposes personal Drive/Gmail scopes. | Use a **dedicated demo Google account** that owns only the Sheet. Bind the script to the Sheet. Add `/** @OnlyCurrentDoc */` to limit the scope to that one spreadsheet. | Fix |
| F3 | High (prod) / Accepted (demo) | The BFF credits a card when the browser says "paid". No server-side payment proof, no user auth. Anyone with the URL can top up a fake card for free. | Demo: accept; balances are fake. Say it to judges. Production: server sends the Google Pay token to a PSP, credits only after the PSP confirms, in one idempotent transaction; user accounts own cards. | Accept |
| F4 | High | Google Pay TEST mode shows the **real cards** in the signed-in Google account (masked) on the projector. | Sign in Chrome with the dedicated demo Google account. Add one card or join Google's test card suite group (verify current group name in Google Pay docs). Rehearse once on the projector. | Fix |
| F5 | Med | Idempotency keys are not bound to the request. A reused key with a different card/amount returns the first result silently, or a fresh key repeats a charge. | Store `(idempotencyKey, cardNumber, amountCents)`. Same key + same payload → return stored result. Same key + different payload → `409 IDEMPOTENCY_MISMATCH`. Client keeps one key per attempt (Tech Spec 5.3). | Fix |
| F6 | High | NTA key leak via bundle, logs, or response echo. | Server env only. No `VITE_` prefix. Never log request headers. CI check: `grep -r "NTA_KEY\|SHEET_SHARED_SECRET" dist/` returns nothing. | Fix |
| F7 | Med | `/api/realtime` as an open relay: arbitrary `routes` values bust the cache and burn the NTA quota. | Allowlist `routes` to `E1,39A,16`; sort and dedupe so all clients share one cache key. Fixed upstream URL; never accept a URL parameter (no SSRF). | Fix |
| F8 | Med | Reputation: a public look-alike of a payment app can be flagged as **phishing** (browser safe-browsing warnings) and can raise trademark concerns. | Disclaimer strip on every screen (done in design). No TFI/NTA logos. Name "Leap+" in a project context only. `<meta name="robots" content="noindex">` + `X-Robots-Tag: noindex`. Do not post the URL publicly. Take the deployment down after the event. | Fix |
| F9 | Med | Missing browser hardening. | `vercel.json` headers: CSP `default-src 'self'; script-src 'self' https://pay.google.com; frame-src https://pay.google.com; img-src 'self' data: https://*.tile.openstreetmap.org https://www.gstatic.com; connect-src 'self' https://pay.google.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Test Google Pay with CSP on; widen only on a reported violation. | Fix |
| F10 | Low | BFF forwards upstream error bodies or stack traces. | Map every upstream error to the fixed `ApiError` enum. Log a request ID server-side only. | Fix |
| F11 | Low | Sheet formula injection (a cell starting with `=`, `+`, `-`, `@`). | Write only regex-checked digits, integers, enum values, UUIDs, and server-generated text. No user free text reaches the Sheet. | Fix |
| F12 | Low | Lock timeout or Apps Script quota under load. | `waitLock(5000)` → `BUSY` → BFF 503 → client retry with the same key. Demo load is 1 user. | Accept |
| F13 | Low | Logs leak card numbers or tokens. | Never log the Google Pay `paymentData`. Mask card numbers in logs (`••••0001`). Transactions tab is the audit log; nobody edits it by hand during the demo. | Fix |
| F14 | Low | Timeout message "You were not charged" can be wrong if Apps Script commits after the 8 s BFF timeout. | Demo: idempotent retry returns the committed result, so the balance stays correct. Production copy: "We are confirming your top-up." | Accept |
| F15 | Low | Supply chain. | Use only the packages in Tech Spec 4. Commit `package-lock.json`. `npm audit --omit=dev` at code freeze; fix high/critical only. | Check |
| F16 | Low | Secrets committed to git. | `.env*` in `.gitignore`. `vercel env` for secrets. Run `git grep -n -i "secret\|api_key"` before each push. | Check |
| F17 | Info | Demo URL flags (`?scanFail`, `?topupFail`, `?liveFail`) change only client UI and never call the server with special rights. | Keep them client-only. | Accept |

## 5. Privacy

- Data stored: fake card numbers, fake balances, fake transactions (Sheet); saved fake card number and data mode (browser localStorage).
- No personal data, no analytics, no cookies. Google Pay token discarded in memory.
- Presenter account: see F4. GDPR DPIA not needed for the demo; needed for production.

## 6. Production gaps (state these to judges)

1. User authentication and card ownership (account ↔ card binding).
2. Server-side payment: Google Pay / Apple Pay token → PSP (e.g. Stripe/Adyen) → credit after confirmation. PCI scope stays small because the PSP handles card data.
3. Real Apple Pay: Merchant ID, domain verification, Apple Pay JS.
4. NTA partnership for card read/credit; no Sheet.
5. ACID database, rate limiting / WAF, monitoring, secret manager, key rotation.
6. Accessibility, GDPR DPIA, legal review of naming and branding.

## 7. Code-freeze security check (10 min, co-founder)

- [ ] `grep` the `dist/` bundle for secrets (F6) → empty.
- [ ] `git grep` for secrets (F16) → empty.
- [ ] `curl` the Apps Script URL directly with no secret and with a wrong secret → `UNAUTHORIZED` both times (F1).
- [ ] Replay the same idempotency key → same result, balance unchanged; different amount → 409 (F5).
- [ ] `/api/realtime?routes=99X` → 400 (F7).
- [ ] Response headers show CSP, nosniff, noindex (F8, F9). Google Pay sheet still opens.
- [ ] Demo Chrome profile = demo Google account; Google Pay sheet shows only the demo card (F4).
- [ ] Browser console: no token or secret printed (F13).

## 8. Open questions (proposed defaults — PO to accept or change)

1. **SQ1.** Dedicated demo Google account owns the Sheet, Apps Script, and Google Pay sign-in (F2, F4). Default: **yes, co-founder creates it**.
2. **SQ2.** Vercel production URL access during the event. Default: **public URL, `noindex`, not shared; take down after the event** (F8). Alternative: Vercel Deployment Protection (blocks judges from opening it on their phones).
3. **SQ3.** Accept F3, F12, F14 as stated demo gaps. Default: **accept**.

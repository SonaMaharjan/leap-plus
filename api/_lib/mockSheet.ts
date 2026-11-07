/** In-memory stand-in for the Apps Script backend. Active only when SHEET_WEBAPP_URL=mock (local dev). */
type Row = { txId: string; cardNumber: string; type: "TOPUP" | "FARE"; amountCents: number; description: string; key: string; createdAt: string; balanceAfter: number };

const cards = new Map<string, { holderType: string; balanceCents: number; updatedAt: string }>();
const txs: Row[] = [];

function seed() {
  const now = Date.now();
  const iso = (d: number) => new Date(now - d * 86400000).toISOString();
  ([["300000000001", "Adult", 320], ["300000000002", "Student", 1250], ["300000000003", "Adult", 0]] as const).forEach(([n, h, b]) => {
    cards.set(n, { holderType: h, balanceCents: b, updatedAt: iso(0) });
    [[-200, "Dublin Bus E1"], [-200, "Dublin Bus 39A"], [1000, "Top-up · Saved card •••• 4242"], [-200, "Luas Green Line"], [-200, "Dublin Bus 16"]].forEach(
      ([a, d], i) => txs.push({ txId: crypto.randomUUID(), cardNumber: n, type: Number(a) > 0 ? "TOPUP" : "FARE", amountCents: Number(a), description: String(d), key: "", createdAt: iso(5 - i), balanceAfter: 0 }),
    );
  });
}

const LABEL: Record<string, string> = { GOOGLE_PAY: "Google Pay", APPLE_PAY_SIM: "Apple Pay (simulated)", SAVED_CARD: "Saved card •••• 4242" };

export function mockSheet(p: Record<string, unknown>): Record<string, unknown> {
  if (cards.size === 0) seed();
  const cardNumber = String(p.cardNumber);
  const card = cards.get(cardNumber);
  if (p.action === "get") {
    if (!card) return { error: "CARD_NOT_FOUND" };
    const transactions = txs
      .filter((t) => t.cardNumber === cardNumber)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5)
      .map(({ txId, type, amountCents, description, createdAt }) => ({ txId, type, amountCents, description, createdAt }));
    return { cardNumber, ...card, transactions };
  }
  const amount = Number(p.amountCents);
  const prior = txs.find((t) => t.key === p.idempotencyKey);
  if (prior) {
    if (prior.cardNumber !== cardNumber || prior.amountCents !== amount) return { error: "IDEMPOTENCY_MISMATCH" };
    return { balanceCents: prior.balanceAfter, txId: prior.txId, createdAt: prior.createdAt };
  }
  if (!card) return { error: "CARD_NOT_FOUND" };
  if (card.balanceCents + amount > 15000) return { error: "BALANCE_CAP" };
  card.balanceCents += amount;
  card.updatedAt = new Date().toISOString();
  const row: Row = { txId: crypto.randomUUID(), cardNumber, type: "TOPUP", amountCents: amount, description: `Top-up · ${LABEL[String(p.method)]}`, key: String(p.idempotencyKey), createdAt: card.updatedAt, balanceAfter: card.balanceCents };
  txs.push(row);
  return { balanceCents: row.balanceAfter, txId: row.txId, createdAt: row.createdAt };
}

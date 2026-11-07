export type Tx = { txId: string; type: "TOPUP" | "FARE"; amountCents: number; description: string; createdAt: string };
export type Card = { cardNumber: string; holderType: "Adult" | "Student"; balanceCents: number; updatedAt: string; transactions: Tx[] };

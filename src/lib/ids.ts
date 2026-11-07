/** One idempotency key per top-up attempt. Reuse the same key on retry. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

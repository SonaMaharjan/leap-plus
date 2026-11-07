import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as getCard } from "./get";
import { POST as topUp } from "./topup";

const KEY = "0b8f6a1e-3c2d-4f5a-9b7c-1d2e3f4a5b6c";
const post = (body: unknown) =>
  new Request("http://x/api", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
const upstream = (data: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));

describe("card BFF", () => {
  beforeEach(() => {
    vi.stubEnv("SHEET_WEBAPP_URL", "https://script.google.com/macros/s/x/exec");
    vi.stubEnv("SHEET_SHARED_SECRET", "s3cret");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("get: forwards a valid request with the secret", async () => {
    const f = upstream({ cardNumber: "300000000001", balanceCents: 320 });
    vi.stubGlobal("fetch", f);
    const res = await getCard(post({ cardNumber: "300000000001" }));
    expect(res.status).toBe(200);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ action: "get", cardNumber: "300000000001", secret: "s3cret" });
  });

  it("get: rejects bad card numbers, unknown fields and bad JSON", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await getCard(post({ cardNumber: "12ab" }))).status).toBe(400);
    expect((await getCard(post({ cardNumber: "300000000001", x: 1 }))).status).toBe(400);
    expect((await getCard(post("{"))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("get: maps CARD_NOT_FOUND to 404", async () => {
    vi.stubGlobal("fetch", upstream({ error: "CARD_NOT_FOUND" }));
    const res = await getCard(post({ cardNumber: "300000000009" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "CARD_NOT_FOUND" });
  });

  it("topup: happy path", async () => {
    vi.stubGlobal("fetch", upstream({ balanceCents: 1320, txId: "t1", createdAt: "2026-11-07T15:00:00Z" }));
    const res = await topUp(post({ cardNumber: "300000000001", amountCents: 1000, method: "GOOGLE_PAY", idempotencyKey: KEY }));
    expect(res.status).toBe(200);
    expect((await res.json()).balanceCents).toBe(1320);
  });

  it("topup: validates amount, method and key before calling upstream", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const base = { cardNumber: "300000000001", amountCents: 1000, method: "GOOGLE_PAY", idempotencyKey: KEY };
    expect((await topUp(post({ ...base, amountCents: 499 }))).status).toBe(400);
    expect((await topUp(post({ ...base, amountCents: 10.5 }))).status).toBe(400);
    expect((await topUp(post({ ...base, method: "CASH" }))).status).toBe(400);
    expect((await topUp(post({ ...base, idempotencyKey: "abc" }))).status).toBe(400);
    expect((await topUp(post({ ...base, token: "gpay" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("topup: maps upstream errors", async () => {
    const base = { cardNumber: "300000000001", amountCents: 1000, method: "SAVED_CARD", idempotencyKey: KEY };
    vi.stubGlobal("fetch", upstream({ error: "BALANCE_CAP" }));
    expect((await topUp(post(base))).status).toBe(409);
    vi.stubGlobal("fetch", upstream({ error: "UNAUTHORIZED" }));
    expect(await (await topUp(post(base))).json()).toEqual({ error: "UPSTREAM_ERROR" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("t"), { name: "TimeoutError" })));
    expect((await topUp(post(base))).status).toBe(504);
  });

  it("never logs full card numbers", async () => {
    vi.stubGlobal("fetch", upstream({ error: "UNAUTHORIZED" }));
    await getCard(post({ cardNumber: "300000000001" }));
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).not.toContain("300000000001");
    expect(logged).toContain("••••0001");
  });
});

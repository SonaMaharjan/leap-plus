const UPSTREAM_TIMEOUT_MS = 8000;

const STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  INVALID_AMOUNT: 400,
  CARD_NOT_FOUND: 404,
  BALANCE_CAP: 409,
  IDEMPOTENCY_MISMATCH: 409,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_ERROR: 502,
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function apiError(code: string): Response {
  return json({ error: code }, STATUS[code] ?? 502);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export function maskCard(cardNumber: string): string {
  return `••••${cardNumber.slice(-4)}`;
}

/** Calls the Apps Script web app. fetch follows its 302 redirect to googleusercontent.com. */
export async function callSheet(payload: Record<string, unknown>): Promise<Response> {
  const url = process.env.SHEET_WEBAPP_URL;
  const secret = process.env.SHEET_SHARED_SECRET;
  const card = typeof payload.cardNumber === "string" ? maskCard(payload.cardNumber) : "-";
  if (!url || !secret) {
    console.error(`sheet: not configured (action=${String(payload.action)})`);
    return apiError("UPSTREAM_ERROR");
  }
  let data: Record<string, unknown>;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    const timeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error(`sheet: ${timeout ? "timeout" : "error"} action=${String(payload.action)} card=${card}`);
    return apiError(timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR");
  }
  if (typeof data.error === "string") {
    if (data.error === "BUSY") return apiError("UPSTREAM_TIMEOUT");
    if (data.error === "UNAUTHORIZED" || !(data.error in STATUS)) {
      console.error(`sheet: rejected (${data.error}) action=${String(payload.action)} card=${card}`);
      return apiError("UPSTREAM_ERROR");
    }
    return apiError(data.error);
  }
  return json(data);
}

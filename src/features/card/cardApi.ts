import { CONFIG } from "../../lib/config";
import type { Card } from "./types";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CONFIG.apiTimeoutMs + 2000),
    });
  } catch (err) {
    const timeout = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new ApiError(timeout ? "UPSTREAM_TIMEOUT" : "NETWORK", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? "UPSTREAM_ERROR", res.status);
  return data as T;
}

export const getCard = (cardNumber: string) => postJson<Card>("/api/card/get", { cardNumber });

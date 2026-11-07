import { apiError, callSheet, readJson } from "../_lib/http.js";
import { parseGetCard } from "../_lib/validate.js";

export async function POST(req: Request): Promise<Response> {
  const body = parseGetCard(await readJson(req));
  if (!body) return apiError("BAD_REQUEST");
  return callSheet({ action: "get", cardNumber: body.cardNumber });
}

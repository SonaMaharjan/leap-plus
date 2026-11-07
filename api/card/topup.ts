import { apiError, callSheet, readJson } from "../_lib/http.js";
import { parseTopUp } from "../_lib/validate.js";

export async function POST(req: Request): Promise<Response> {
  const body = parseTopUp(await readJson(req));
  if (!body) return apiError("BAD_REQUEST");
  if (body === "INVALID_AMOUNT") return apiError("INVALID_AMOUNT");
  return callSheet({ action: "topup", ...body });
}

import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Serves api/*.ts (Web-handler style, e.g. `export function POST`) during `vite dev`. */
function apiDev(): Plugin {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, "http://localhost");
        let mod: Record<string, unknown>;
        try {
          mod = await server.ssrLoadModule(`/api${url.pathname.slice(4)}.ts`);
        } catch {
          return next();
        }
        const handler = mod[req.method ?? "GET"];
        if (typeof handler !== "function") return next();
        try {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response = (await handler(request)) as Response;
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.warn(`[api-dev] ${req.url}: ${(err as Error).message}`);
          if (!res.headersSent) res.statusCode = 502;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of ["NTA_API_KEY", "SHEET_WEBAPP_URL", "SHEET_SHARED_SECRET"]) if (env[k]) process.env[k] = env[k];
  if (mode === "development" && !process.env.SHEET_WEBAPP_URL) {
    process.env.SHEET_WEBAPP_URL = "mock";
    process.env.SHEET_SHARED_SECRET = "mock";
  }
  return {
    plugins: [react(), apiDev()],
    test: { environment: "node", include: ["src/**/*.test.ts", "api/**/*.test.ts"] },
  };
});

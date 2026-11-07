import { useOutletContext, useSearchParams } from "react-router-dom";
import { CONFIG, type DemoRoute } from "../../lib/config";
import type { RouteState } from "./gtfs";
import type { Realtime } from "./useRealtime";

export type LiveContext = { route: DemoRoute; dirIdx: number; routeState: RouteState; rt: Realtime };

export const useLiveContext = () => useOutletContext<LiveContext>();

export function useLiveParams() {
  const [params] = useSearchParams();
  const raw = params.get("route");
  const route = (CONFIG.routes as readonly string[]).includes(raw ?? "") ? (raw as DemoRoute) : CONFIG.routes[0];
  const dirIdx = params.get("dir") === "1" ? 1 : 0;
  return { route, dirIdx };
}

export const liveSearch = (route: string, dirIdx: number) => `?route=${encodeURIComponent(route)}&dir=${dirIdx}`;

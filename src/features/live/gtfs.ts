import { useEffect, useState } from "react";
import type { RouteData } from "./types";

const cache = new Map<string, Promise<RouteData>>();

export function loadRoute(route: string): Promise<RouteData> {
  let p = cache.get(route);
  if (!p) {
    p = fetch(`/gtfs/${encodeURIComponent(route)}.json`).then((r) => {
      if (!r.ok) throw new Error(`gtfs ${route} ${r.status}`);
      return r.json() as Promise<RouteData>;
    });
    p.catch(() => cache.delete(route));
    cache.set(route, p);
  }
  return p;
}

export type RouteState = { status: "loading" } | { status: "error" } | { status: "ok"; data: RouteData };

export function useRouteData(route: string): RouteState {
  const [state, setState] = useState<{ route: string; s: RouteState }>({ route, s: { status: "loading" } });
  useEffect(() => {
    let alive = true;
    loadRoute(route).then(
      (data) => alive && setState({ route, s: { status: "ok", data } }),
      () => alive && setState({ route, s: { status: "error" } }),
    );
    return () => {
      alive = false;
    };
  }, [route]);
  return state.route === route ? state.s : { status: "loading" };
}

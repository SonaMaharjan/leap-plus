import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { Placeholder } from "./Placeholder";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Placeholder screen="S04" title="Card" /> },
      { path: "topup", element: <Placeholder screen="S05" title="Top Up" /> },
      {
        path: "live",
        hydrateFallbackElement: <p className="p-6 text-sm text-ink-muted">Loading live map…</p>,
        lazy: async () => ({ Component: (await import("../features/live/RouteMapS13")).RouteMapS13 }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import("../features/live/StopListS14")).StopListS14 }) },
          {
            path: "stop/:stopId",
            lazy: async () => ({ Component: (await import("../features/live/StopDetailS15")).StopDetailS15 }),
          },
        ],
      },
    ],
  },
]);

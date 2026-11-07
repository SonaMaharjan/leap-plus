import { createBrowserRouter } from "react-router-dom";
import { EnterNumberS03 } from "../features/card/EnterNumberS03";
import { HomeS04 } from "../features/card/HomeS04";
import { ScanS02 } from "../features/card/ScanS02";
import { TransactionsS12 } from "../features/card/TransactionsS12";
import { WelcomeS01 } from "../features/card/WelcomeS01";
import { AmountS05 } from "../features/topup/AmountS05";
import { ConfirmS07 } from "../features/topup/ConfirmS07";
import { MethodS06 } from "../features/topup/MethodS06";
import { ProcessingS10 } from "../features/topup/ProcessingS10";
import { SuccessS11 } from "../features/topup/SuccessS11";
import { App } from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomeS04 /> },
      { path: "welcome", element: <WelcomeS01 /> },
      { path: "scan", element: <ScanS02 /> },
      { path: "enter", element: <EnterNumberS03 /> },
      { path: "transactions", element: <TransactionsS12 /> },
      { path: "topup", element: <AmountS05 /> },
      { path: "topup/method", element: <MethodS06 /> },
      { path: "topup/confirm", element: <ConfirmS07 /> },
      { path: "topup/processing", element: <ProcessingS10 /> },
      { path: "topup/success", element: <SuccessS11 /> },
      {
        path: "plan",
        lazy: async () => ({ Component: (await import("../features/plan/PlanS16")).PlanS16 }),
      },
      {
        path: "plan/:idx",
        hydrateFallbackElement: <p className="p-6 text-sm text-ink-muted">Loading map…</p>,
        lazy: async () => ({ Component: (await import("../features/plan/JourneyS17")).JourneyS17 }),
      },
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

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
      { path: "live", element: <Placeholder screen="S13" title="Live" /> },
    ],
  },
]);

import { Outlet, useLocation } from "react-router-dom";
import { DisclaimerStrip } from "./DisclaimerStrip";
import { TabBar } from "./TabBar";

const NO_TABS = ["/welcome", "/scan", "/enter", "/topup/processing", "/topup/success"];

export function App() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white shadow-sm">
      <DisclaimerStrip />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {!NO_TABS.includes(pathname) && <TabBar />}
    </div>
  );
}

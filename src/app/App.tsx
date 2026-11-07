import { Outlet } from "react-router-dom";
import { DisclaimerStrip } from "./DisclaimerStrip";
import { TabBar } from "./TabBar";

export function App() {
  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white shadow-sm">
      <DisclaimerStrip />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

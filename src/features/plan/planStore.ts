import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { planJourney, type Itinerary, type Place } from "./planApi";

/** Plans older than this are re-fetched (departures move on). */
export const PLAN_MAX_AGE_MS = 2 * 60_000;

type PlanState = {
  from: Place | null;
  to: Place | null;
  itineraries: Itinerary[] | null;
  plannedAt: number | null;
  status: "idle" | "loading" | "ready" | "error";
  setFrom: (p: Place | null) => void;
  setTo: (p: Place | null) => void;
  swap: () => void;
  plan: () => Promise<void>;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      from: null,
      to: null,
      itineraries: null,
      plannedAt: null,
      status: "idle",
      setFrom: (from) => set({ from, itineraries: null, status: "idle" }),
      setTo: (to) => set({ to, itineraries: null, status: "idle" }),
      swap: () => set((s) => ({ from: s.to, to: s.from, itineraries: null, status: "idle" })),
      plan: async () => {
        const { from, to } = get();
        if (!from || !to) return;
        set({ status: "loading" });
        try {
          const res = await planJourney(from, to);
          if (get().from !== from || get().to !== to) return;
          set({ itineraries: res.itineraries, plannedAt: Date.now(), status: "ready" });
        } catch {
          if (get().from === from && get().to === to) set({ status: "error" });
        }
      },
    }),
    {
      name: "leap-plan",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ from: s.from, to: s.to, itineraries: s.itineraries, plannedAt: s.plannedAt }),
    },
  ),
);

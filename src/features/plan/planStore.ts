import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { planJourney, type Itinerary, type Place } from "./planApi";

type PlanState = {
  from: Place | null;
  to: Place | null;
  itineraries: Itinerary[] | null;
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
          set({ itineraries: res.itineraries, status: "ready" });
        } catch {
          set({ status: "error" });
        }
      },
    }),
    {
      name: "leap-plan",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ from: s.from, to: s.to, itineraries: s.itineraries }),
    },
  ),
);

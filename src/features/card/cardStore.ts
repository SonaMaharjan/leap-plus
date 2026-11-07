import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiError, getCard } from "./cardApi";
import type { Card } from "./types";

type CardState = {
  cardNumber: string | null;
  card: Card | null;
  status: "idle" | "loading" | "ready" | "error";
  /** Fetches a card and saves it. Throws ApiError. */
  load: (cardNumber: string) => Promise<Card>;
  /** Re-fetches the saved card. The Sheet is the source of truth. */
  refresh: () => Promise<void>;
  clear: () => void;
};

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cardNumber: null,
      card: null,
      status: "idle",
      load: async (cardNumber) => {
        const card = await getCard(cardNumber);
        set({ cardNumber, card, status: "ready" });
        return card;
      },
      refresh: async () => {
        const { cardNumber } = get();
        if (!cardNumber) return;
        set({ status: "loading" });
        try {
          set({ card: await getCard(cardNumber), status: "ready" });
        } catch (err) {
          if (err instanceof ApiError && err.code === "CARD_NOT_FOUND") get().clear();
          else set({ status: "error" });
        }
      },
      clear: () => set({ cardNumber: null, card: null, status: "idle" }),
    }),
    { name: "leap-plus-card", partialize: (s) => ({ cardNumber: s.cardNumber }) },
  ),
);

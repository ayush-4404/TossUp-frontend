import { create } from "zustand";
import type { Match, Bet } from "@/lib/types";
import { api } from "@/lib/api";
import { mapMatch } from "@/lib/adapters";
import { useUserStore } from "@/store/userStore";

interface MatchState {
  matches: Match[];
  bets: Bet[];
  loadMatches: () => Promise<void>;
  getMatch: (id: string) => Match | undefined;
  placeBet: (matchId: string, groupId: string, teamName: string, amount: number) => Promise<Bet>;
  getBetsForMatch: (matchId: string) => Bet[];
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  bets: [],
  loadMatches: async () => {
    const response = await api.get("/matches/upcoming");
    const rows = response.data?.data || [];
    set({ matches: rows.map(mapMatch) });
  },
  getMatch: (id) => get().matches.find((m) => m.id === id),
  placeBet: async (matchId, groupId, teamName, amount) => {
    await api.post("/bets/place", {
      matchId,
      groupId,
      teamSelected: teamName,
    });

    const newBet: Bet = {
      id: "b_" + Date.now(),
      matchId,
      groupId,
      userId: useUserStore.getState().user?.id || "",
      teamId: teamName,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ bets: [...state.bets, newBet] }));
    return newBet;
  },
  getBetsForMatch: (matchId) => get().bets.filter((b) => b.matchId === matchId),
}));

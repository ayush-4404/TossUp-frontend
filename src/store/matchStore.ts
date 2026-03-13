import { create } from "zustand";
import type { Match, Bet } from "@/lib/types";
import { mockMatches } from "@/lib/mockData";

interface MatchState {
  matches: Match[];
  bets: Bet[];
  loadMatches: () => void;
  getMatch: (id: string) => Match | undefined;
  placeBet: (matchId: string, groupId: string, teamId: string, amount: number) => Bet;
  getBetsForMatch: (matchId: string) => Bet[];
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  bets: [],
  loadMatches: () => set({ matches: mockMatches }),
  getMatch: (id) => get().matches.find((m) => m.id === id),
  placeBet: (matchId, groupId, teamId, amount) => {
    const newBet: Bet = {
      id: "b_" + Date.now(),
      matchId,
      groupId,
      userId: "u1",
      teamId,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ bets: [...state.bets, newBet] }));
    return newBet;
  },
  getBetsForMatch: (matchId) => get().bets.filter((b) => b.matchId === matchId),
}));

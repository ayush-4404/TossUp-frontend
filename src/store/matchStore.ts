import { create } from "zustand";
import type { Match, Bet, CoinTransfer, BetHistoryEntry } from "@/lib/types";
import { api } from "@/lib/api";
import { mapBet, mapBetHistoryEntry, mapCoinTransfer, mapMatch } from "@/lib/adapters";
import { useUserStore } from "@/store/userStore";

interface MatchState {
  matches: Match[];
  bets: Bet[];
  transfers: CoinTransfer[];
  betHistory: BetHistoryEntry[];
  loadMatches: () => Promise<void>;
  loadGroupBets: (groupId: string) => Promise<void>;
  loadGroupMatchTransfers: (groupId: string, matchId: string) => Promise<CoinTransfer[]>;
  loadGroupMatchBetHistory: (groupId: string, matchId: string) => Promise<BetHistoryEntry[]>;
  getMatch: (id: string) => Match | undefined;
  placeBet: (matchId: string, groupId: string, teamName: string, amount: number) => Promise<Bet>;
  getBetsForMatch: (matchId: string) => Bet[];
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  bets: [],
  transfers: [],
  betHistory: [],
  loadMatches: async () => {
    const response = await api.get("/matches/upcoming");
    const rows = response.data?.data || [];
    set({ matches: rows.map(mapMatch) });
  },
  loadGroupBets: async (groupId) => {
    const response = await api.get(`/bets/group/${groupId}`);
    const rows = response.data?.data || [];
    set({ bets: rows.map(mapBet) });
  },
  loadGroupMatchTransfers: async (groupId, matchId) => {
    const response = await api.get(`/bets/group/${groupId}/match/${matchId}/transfers`);
    const rows = response.data?.data || [];
    const transfers = rows.map(mapCoinTransfer);
    set((state) => ({
      transfers: [
        ...state.transfers.filter((item) => item.matchId !== matchId || item.groupId !== groupId),
        ...transfers,
      ],
    }));
    return transfers;
  },
  loadGroupMatchBetHistory: async (groupId, matchId) => {
    const response = await api.get(`/bets/group/${groupId}/match/${matchId}/history`);
    const rows = response.data?.data || [];
    const historyRows = rows.map(mapBetHistoryEntry);
    set((state) => ({
      betHistory: [
        ...state.betHistory.filter((item) => item.matchId !== matchId || item.groupId !== groupId),
        ...historyRows,
      ],
    }));
    return historyRows;
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
      userName: useUserStore.getState().user?.name,
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

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
  loadMatches: (options?: { includeManual?: boolean }) => Promise<void>;
  createManualMatch: (groupId: string, teamA: string, teamB: string, startTime: string) => Promise<Match | null>;
  declareManualMatchResult: (groupId: string, matchId: string, winner: string) => Promise<Match | null>;
  loadGroupBets: (groupId: string) => Promise<void>;
  loadGroupMatchBets: (groupId: string, matchId: string) => Promise<Bet[]>;
  loadGroupMatchTransfers: (groupId: string, matchId: string) => Promise<CoinTransfer[]>;
  loadGroupMatchBetHistory: (groupId: string, matchId: string) => Promise<BetHistoryEntry[]>;
  getMatch: (id: string) => Match | undefined;
  placeBet: (matchId: string, groupId: string, teamName: string, amount: number) => Promise<Bet>;
  getBetsForMatch: (matchId: string) => Bet[];
}

const mergeBets = (existing: Bet[], incoming: Bet[]) => {
  const keyed = new Map(existing.map((bet) => [`${bet.userId}:${bet.groupId}:${bet.matchId}`, bet]));

  for (const bet of incoming) {
    keyed.set(`${bet.userId}:${bet.groupId}:${bet.matchId}`, bet);
  }

  return Array.from(keyed.values());
};

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  bets: [],
  transfers: [],
  betHistory: [],
  loadMatches: async (options) => {
    const response = await api.get("/matches/upcoming", {
      params: {
        includeManual: options?.includeManual ?? true,
      },
    });
    const rows = response.data?.data || [];
    set({ matches: rows.map(mapMatch) });
  },
  createManualMatch: async (groupId, teamA, teamB, startTime) => {
    const response = await api.post("/matches/manual", {
      groupId,
      teamA,
      teamB,
      startTime,
    });
    const created = mapMatch(response.data?.data);
    set((state) => ({
      matches: [created, ...state.matches].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    }));
    return created;
  },
  declareManualMatchResult: async (groupId, matchId, winner) => {
    const response = await api.patch(`/matches/manual/${matchId}/result`, {
      groupId,
      winner,
    });
    const updated = mapMatch(response.data?.data);
    set((state) => ({
      matches: state.matches.map((match) => (match.id === updated.id ? updated : match)),
    }));
    return updated;
  },
  loadGroupBets: async (groupId) => {
    const response = await api.get(`/bets/group/${groupId}`);
    const rows = response.data?.data || [];
    const mapped = rows.map(mapBet);
    set((state) => ({
      bets: mergeBets(state.bets.filter((bet) => bet.groupId !== groupId), mapped),
    }));
  },
  loadGroupMatchBets: async (groupId, matchId) => {
    const response = await api.get(`/bets/group/${groupId}/match/${matchId}`);
    const rows = response.data?.data || [];
    const mapped = rows.map(mapBet);
    set((state) => ({
      bets: mergeBets(
        state.bets.filter((bet) => bet.groupId !== groupId || bet.matchId !== matchId),
        mapped
      ),
    }));
    return mapped;
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
    const response = await api.post("/bets/place", {
      matchId,
      groupId,
      teamSelected: teamName,
    });

    const apiBet = response.data?.data;
    const mapped = mapBet(apiBet);

    if (!mapped?.id) {
      const fallbackBet: Bet = {
        id: `b_${Date.now()}`,
        matchId,
        groupId,
        userId: useUserStore.getState().user?.id || "",
        userName: useUserStore.getState().user?.name,
        teamId: teamName,
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ bets: mergeBets(state.bets, [fallbackBet]) }));
      return fallbackBet;
    }

    set((state) => ({ bets: mergeBets(state.bets, [mapped]) }));
    return mapped;
  },
  getBetsForMatch: (matchId) => get().bets.filter((b) => b.matchId === matchId),
}));

import { create } from "zustand";
import type {
  CustomBet,
  Group,
  GroupSettlementSummary,
  GroupTransactionReport,
  LeaderboardEntry,
  PublicUserProfile,
} from "@/lib/types";
import { api } from "@/lib/api";
import { mapCustomBet, mapGroup, mapLeaderboard, mapPublicUserProfile } from "@/lib/adapters";
import { useUserStore } from "@/store/userStore";

interface GroupState {
  groups: Group[];
  customBetsByGroup: Record<string, CustomBet[]>;
  loadGroups: () => Promise<void>;
  createGroup: (name: string, betPrice: number) => Promise<Group | null>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  fetchGroupById: (groupId: string) => Promise<Group | null>;
  loadCustomBets: (groupId: string) => Promise<CustomBet[]>;
  createCustomBet: (
    groupId: string,
    question: string,
    options: string[],
    betAmount: number
  ) => Promise<CustomBet | null>;
  placeCustomBetAnswer: (
    groupId: string,
    customBetId: string,
    optionSelected: string
  ) => Promise<void>;
  settleCustomBet: (groupId: string, customBetId: string, correctOption: string) => Promise<void>;
  deleteCustomBet: (groupId: string, customBetId: string) => Promise<void>;
  getLeaderboard: (groupId: string) => Promise<LeaderboardEntry[]>;
  getSettlementSummary: (groupId: string) => Promise<GroupSettlementSummary>;
  getTransactionReport: (groupId: string) => Promise<GroupTransactionReport>;
  syncGroupAndSettle: (groupId: string) => Promise<{
    groupId: string;
    syncedUpcomingMatches: number;
    refreshedResultCandidates: number;
    refreshedResultMatches: number;
    settledGroupSummaries: number;
  }>;
  backfillMatchWinners: (groupId: string) => Promise<{
    checked: number;
    updated: number;
    skipped: number;
  }>;
  getPublicUserProfile: (userId: string) => Promise<PublicUserProfile>;
  getGroup: (id: string) => Group | undefined;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const mapSettlementMemberRow = (value: unknown) => {
  const row = asRecord(value);
  const direction = row.direction === "pay" || row.direction === "receive" ? row.direction : "settled";

  return {
    userId: String(row.userId || ""),
    name: String(row.name || ""),
    email: String(row.email || ""),
    incoming: Number(row.incoming || 0),
    outgoing: Number(row.outgoing || 0),
    net: Number(row.net || 0),
    direction,
  };
};

const mapPaymentInstructionRow = (value: unknown) => {
  const row = asRecord(value);

  return {
    fromUserId: String(row.fromUserId || ""),
    fromUserName: String(row.fromUserName || ""),
    toUserId: String(row.toUserId || ""),
    toUserName: String(row.toUserName || ""),
    amount: Number(row.amount || 0),
  };
};

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  customBetsByGroup: {},
  loadGroups: async () => {
    const userId = useUserStore.getState().user?.id;
    if (!userId) {
      set({ groups: [] });
      return;
    }

    const response = await api.get(`/groups/user/${userId}`);
    const rows = response.data?.data || [];
    set({ groups: rows.map(mapGroup) });
  },
  createGroup: async (name, betPrice) => {
    const response = await api.post("/groups/create", { name, betPrice });
    const created = mapGroup(response.data?.data);
    set((state) => ({ groups: [created, ...state.groups] }));
    return created;
  },
  joinGroup: async (inviteCode) => {
    const response = await api.post("/groups/join", { inviteCode });
    const joined = mapGroup(response.data?.data);
    set((state) => {
      const exists = state.groups.some((group) => group.id === joined.id);
      return { groups: exists ? state.groups : [joined, ...state.groups] };
    });
    return joined;
  },
  fetchGroupById: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    const fetched = mapGroup(response.data?.data);
    set((state) => {
      const exists = state.groups.some((group) => group.id === fetched.id);
      if (exists) {
        return {
          groups: state.groups.map((group) => (group.id === fetched.id ? fetched : group)),
        };
      }
      return { groups: [fetched, ...state.groups] };
    });
    return fetched;
  },
  loadCustomBets: async (groupId) => {
    const response = await api.get(`/bets/custom/group/${groupId}`);
    const rows = response.data?.data || [];
    const mapped = rows.map(mapCustomBet);

    set((state) => ({
      customBetsByGroup: {
        ...state.customBetsByGroup,
        [groupId]: mapped,
      },
    }));

    return mapped;
  },
  createCustomBet: async (groupId, question, options, betAmount) => {
    const response = await api.post("/bets/custom", {
      groupId,
      question,
      options,
      betAmount,
    });

    const created = mapCustomBet(response.data?.data || {});
    set((state) => {
      const existing = state.customBetsByGroup[groupId] || [];
      return {
        customBetsByGroup: {
          ...state.customBetsByGroup,
          [groupId]: [created, ...existing],
        },
      };
    });

    return created;
  },
  placeCustomBetAnswer: async (groupId, customBetId, optionSelected) => {
    await api.post("/bets/custom/place", {
      groupId,
      customBetId,
      optionSelected,
    });
    await get().loadCustomBets(groupId);
  },
  settleCustomBet: async (groupId, customBetId, correctOption) => {
    await api.patch(`/bets/custom/${customBetId}/solve`, {
      groupId,
      correctOption,
    });
    await get().loadCustomBets(groupId);
  },
  deleteCustomBet: async (groupId, customBetId) => {
    await api.delete(`/bets/custom/${customBetId}`, {
      data: { groupId },
    });
    set((state) => {
      const existing = state.customBetsByGroup[groupId] || [];
      return {
        customBetsByGroup: {
          ...state.customBetsByGroup,
          [groupId]: existing.filter((bet) => bet.id !== customBetId),
        },
      };
    });
  },
  getLeaderboard: async (groupId) => {
    const response = await api.get(`/leaderboard/${groupId}`);
    return mapLeaderboard(response.data?.data?.leaderboard || []);
  },
  getSettlementSummary: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/settlement-summary`);
    const payload = response.data?.data || {};

    return {
      groupId: payload.groupId || groupId,
      groupName: payload.groupName || "",
      totals: {
        totalIncoming: Number(payload?.totals?.totalIncoming || 0),
        totalOutgoing: Number(payload?.totals?.totalOutgoing || 0),
        transferCount: Number(payload?.totals?.transferCount || 0),
        membersWithBalance: Number(payload?.totals?.membersWithBalance || 0),
      },
      memberSummaries: Array.isArray(payload.memberSummaries)
        ? payload.memberSummaries.map(mapSettlementMemberRow)
        : [],
      paymentInstructions: Array.isArray(payload.paymentInstructions)
        ? payload.paymentInstructions.map(mapPaymentInstructionRow)
        : [],
      customBetSummary: payload.customBetSummary
        ? {
            totals: {
              totalIncoming: Number(payload.customBetSummary?.totals?.totalIncoming || 0),
              totalOutgoing: Number(payload.customBetSummary?.totals?.totalOutgoing || 0),
              transferCount: Number(payload.customBetSummary?.totals?.transferCount || 0),
              membersWithBalance: Number(payload.customBetSummary?.totals?.membersWithBalance || 0),
            },
            memberSummaries: Array.isArray(payload.customBetSummary?.memberSummaries)
              ? payload.customBetSummary.memberSummaries.map(mapSettlementMemberRow)
              : [],
            paymentInstructions: Array.isArray(payload.customBetSummary?.paymentInstructions)
              ? payload.customBetSummary.paymentInstructions.map(mapPaymentInstructionRow)
              : [],
          }
        : undefined,
    };
  },
  getTransactionReport: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/transaction-report`);
    return response.data?.data || {};
  },
  syncGroupAndSettle: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/sync-settlement`);
    const payload = response.data?.data || {};

    return {
      groupId: payload.groupId || groupId,
      syncedUpcomingMatches: Number(payload.syncedUpcomingMatches || 0),
      refreshedResultCandidates: Number(payload.refreshedResultCandidates || 0),
      refreshedResultMatches: Number(payload.refreshedResultMatches || 0),
      settledGroupSummaries: Number(payload.settledGroupSummaries || 0),
    };
  },
  backfillMatchWinners: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/backfill-winners`);
    const payload = response.data?.data || {};

    return {
      checked: Number(payload.checked || 0),
      updated: Number(payload.updated || 0),
      skipped: Number(payload.skipped || 0),
    };
  },
  getPublicUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/profile`);
    return mapPublicUserProfile(response.data?.data || {});
  },
  getGroup: (id) => get().groups.find((g) => g.id === id),
}));

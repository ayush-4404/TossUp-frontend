import { create } from "zustand";
import type { Group, GroupSettlementSummary, LeaderboardEntry, PublicUserProfile } from "@/lib/types";
import { api } from "@/lib/api";
import { mapGroup, mapLeaderboard, mapPublicUserProfile } from "@/lib/adapters";
import { useUserStore } from "@/store/userStore";

interface GroupState {
  groups: Group[];
  loadGroups: () => Promise<void>;
  createGroup: (name: string, betPrice: number) => Promise<Group | null>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  fetchGroupById: (groupId: string) => Promise<Group | null>;
  getLeaderboard: (groupId: string) => Promise<LeaderboardEntry[]>;
  getSettlementSummary: (groupId: string) => Promise<GroupSettlementSummary>;
  getPublicUserProfile: (userId: string) => Promise<PublicUserProfile>;
  getGroup: (id: string) => Group | undefined;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
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
        ? payload.memberSummaries.map((row: any) => ({
            userId: row.userId,
            name: row.name,
            email: row.email,
            incoming: Number(row.incoming || 0),
            outgoing: Number(row.outgoing || 0),
            net: Number(row.net || 0),
            direction: row.direction,
          }))
        : [],
      paymentInstructions: Array.isArray(payload.paymentInstructions)
        ? payload.paymentInstructions.map((row: any) => ({
            fromUserId: row.fromUserId,
            fromUserName: row.fromUserName,
            toUserId: row.toUserId,
            toUserName: row.toUserName,
            amount: Number(row.amount || 0),
          }))
        : [],
    };
  },
  getPublicUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/profile`);
    return mapPublicUserProfile(response.data?.data || {});
  },
  getGroup: (id) => get().groups.find((g) => g.id === id),
}));

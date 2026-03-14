import { create } from "zustand";
import type { Group, LeaderboardEntry } from "@/lib/types";
import { api } from "@/lib/api";
import { mapGroup, mapLeaderboard } from "@/lib/adapters";
import { useUserStore } from "@/store/userStore";

interface GroupState {
  groups: Group[];
  loadGroups: () => Promise<void>;
  createGroup: (name: string, betPrice: number) => Promise<Group | null>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  getLeaderboard: (groupId: string) => Promise<LeaderboardEntry[]>;
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
  getLeaderboard: async (groupId) => {
    const response = await api.get(`/leaderboard/${groupId}`);
    return mapLeaderboard(response.data?.data?.leaderboard || []);
  },
  getGroup: (id) => get().groups.find((g) => g.id === id),
}));

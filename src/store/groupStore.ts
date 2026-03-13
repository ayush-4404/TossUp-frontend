import { create } from "zustand";
import type { Group } from "@/lib/types";
import { mockGroups } from "@/lib/mockData";

interface GroupState {
  groups: Group[];
  loadGroups: () => void;
  createGroup: (name: string, betPrice: number) => Group;
  joinGroup: (inviteCode: string) => Group | null;
  getGroup: (id: string) => Group | undefined;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  loadGroups: () => set({ groups: mockGroups }),
  createGroup: (name, betPrice) => {
    const newGroup: Group = {
      id: "g_" + Date.now(),
      name,
      betPrice,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdBy: "u1",
      members: [{ userId: "u1", name: "Virat Fan", coins: 5000, wins: 12, losses: 5 }],
    };
    set((state) => ({ groups: [...state.groups, newGroup] }));
    return newGroup;
  },
  joinGroup: (inviteCode) => {
    const group = get().groups.find((g) => g.inviteCode === inviteCode);
    return group || null;
  },
  getGroup: (id) => get().groups.find((g) => g.id === id),
}));

import { create } from "zustand";
import type { User } from "@/lib/types";
import { mockUser } from "@/lib/mockData";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCoins: (amount: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (_email: string, _password: string) => {
    // Mock login
    await new Promise((r) => setTimeout(r, 800));
    set({ user: mockUser, isAuthenticated: true });
    return true;
  },
  signup: async (name: string, email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: { ...mockUser, name, email, id: "u_new_" + Date.now() },
      isAuthenticated: true,
    });
    return true;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  updateCoins: (amount) =>
    set((state) => ({
      user: state.user ? { ...state.user, coins: state.user.coins + amount } : null,
    })),
}));

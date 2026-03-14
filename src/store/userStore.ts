import { create } from "zustand";
import type { User } from "@/lib/types";
import { mapUser } from "@/lib/adapters";
import { api, getAuthToken, getStoredUser, setAuthToken, setStoredUser } from "@/lib/api";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  updateCoins: (amount: number) => void;
}

const initialUser = getStoredUser() as User | null;
const initialToken = getAuthToken();

export const useUserStore = create<UserState>((set) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser && initialToken),
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const user = mapUser(response.data?.data?.user);
      const token = response.data?.data?.token;

      if (!token) {
        return false;
      }

      setAuthToken(token);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
  signup: async (name: string, email: string, password: string) => {
    try {
      await api.post("/auth/signup", { name, email, password });
      return true;
    } catch {
      return false;
    }
  },
  resendVerificationEmail: async (email: string) => {
    try {
      await api.post("/auth/resend-verification", { email });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    setAuthToken(null);
    setStoredUser(null);
    set({ user: null, isAuthenticated: false });
  },
  updateCoins: (amount) =>
    set((state) => ({
      user: state.user
        ? (() => {
            const updated = { ...state.user, coins: state.user.coins + amount };
            setStoredUser(updated);
            return updated;
          })()
        : null,
    })),
}));

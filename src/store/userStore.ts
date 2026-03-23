import { create } from "zustand";
import type { User } from "@/lib/types";
import { mapUser } from "@/lib/adapters";
import { api, getAuthToken, getStoredUser, setAuthToken, setStoredUser } from "@/lib/api";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  bootstrapSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<boolean>;
  updateProfileName: (name: string) => Promise<boolean>;
  updateProfileImage: (file: File) => Promise<boolean>;
  logout: () => void;
  updateCoins: (amount: number) => void;
}

const initialUser = getStoredUser() as User | null;
const initialToken = getAuthToken();

export const useUserStore = create<UserState>((set) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialToken),
  bootstrapSession: async () => {
    const existingToken = getAuthToken();

    if (!existingToken) {
      setAuthToken(null);
      setStoredUser(null);
      set({ user: null, isAuthenticated: false });
      return false;
    }

    try {
      // Prefer restoring session using the stored access token first.
      const profileResponse = await api.get("/users/me");
      const user = mapUser(profileResponse.data?.data);

      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      try {
        const refreshResponse = await api.post("/auth/refresh", {});
        const refreshedToken = refreshResponse.data?.data?.token || refreshResponse.data?.data?.accessToken;

        if (!refreshedToken) {
          throw new Error("No token returned during refresh");
        }

        setAuthToken(refreshedToken);

        const profileResponse = await api.get("/users/me");
        const user = mapUser(profileResponse.data?.data);

        setStoredUser(user);
        set({ user, isAuthenticated: true });
        return true;
      } catch {
        setAuthToken(null);
        setStoredUser(null);
        set({ user: null, isAuthenticated: false });
        return false;
      }
    }
  },
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const user = mapUser(response.data?.data?.user);
      const token = response.data?.data?.token || response.data?.data?.accessToken;

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
  refreshProfile: async () => {
    try {
      const response = await api.get("/users/me");
      const user = mapUser(response.data?.data);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
  updateProfileName: async (name) => {
    try {
      const response = await api.patch("/users/me", { name });
      const user = mapUser(response.data?.data);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
  updateProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.patch("/users/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const user = mapUser(response.data?.data);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    api.post("/auth/logout", {}).catch(() => undefined);
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

import { create } from "zustand";
import type { IplTeam, User } from "@/lib/types";
import { mapUser } from "@/lib/adapters";
import { api, getAuthToken, getStoredUser, setAuthToken, setStoredUser } from "@/lib/api";

type AuthActionResult = {
  success: boolean;
  message?: string;
};

type TeamListResult = {
  success: boolean;
  teams?: IplTeam[];
  message?: string;
};

type SignupOptions = {
  favoriteIplTeam?: string;
  profileImage?: File | null;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: unknown } } }).response;
    const maybeMessage = maybeResponse?.data?.message;
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }

  return fallback;
};

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  bootstrapSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (name: string, email: string, password: string, options?: SignupOptions) => Promise<AuthActionResult>;
  getIplTeams: () => Promise<TeamListResult>;
  verifyEmail: (email: string, otp: string) => Promise<AuthActionResult>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<AuthActionResult>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<AuthActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthActionResult>;
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
        return { success: false, message: "Login failed. Please try again." };
      }

      setAuthToken(token);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Login failed. Please try again."),
      };
    }
  },
  signup: async (name: string, email: string, password: string, options?: SignupOptions) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      if (options?.favoriteIplTeam) {
        formData.append("favoriteIplTeam", options.favoriteIplTeam);
      }

      if (options?.profileImage) {
        formData.append("profileImage", options.profileImage);
      }

      await api.post("/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Signup failed. Please try again."),
      };
    }
  },
  getIplTeams: async () => {
    try {
      const response = await api.get("/auth/ipl-teams");
      const teams = response.data?.data?.teams;

      return {
        success: true,
        teams: Array.isArray(teams) ? teams : [],
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Failed to load IPL teams."),
      };
    }
  },
  verifyEmail: async (email: string, otp: string) => {
    try {
      const response = await api.post("/auth/verify-email", { email, otp });
      const user = mapUser(response.data?.data?.user);
      const token = response.data?.data?.token || response.data?.data?.accessToken;

      if (!token) {
        return { success: false, message: "Verification succeeded but no session was created." };
      }

      setAuthToken(token);
      setStoredUser(user);
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Verification failed. Please try again."),
      };
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
  forgotPassword: async (email: string) => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Failed to send password reset code."),
      };
    }
  },
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Password reset failed. Please try again."),
      };
    }
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Could not change password. Please try again."),
      };
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

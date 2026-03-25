import axios from "axios";
import { useLoadingStore } from "@/store/loadingStore";

const AUTH_TOKEN_KEY = "criccoins_token";
const USER_KEY = "criccoins_user";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user: unknown | null) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

api.interceptors.request.use((config) => {
  useLoadingStore.getState().startRequest();

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshTokenPromise: Promise<string | null> | null = null;

const requestSessionRefresh = async (): Promise<string | null> => {
  try {
    const response = await api.post("/auth/refresh", {});
    const token = response.data?.data?.token ?? null;

    if (!token) {
      setAuthToken(null);
      setStoredUser(null);
      return null;
    }

    setAuthToken(token);
    return token;
  } catch {
    setAuthToken(null);
    setStoredUser(null);
    return null;
  }
};

api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().finishRequest();
    return response;
  },
  async (error) => {
    useLoadingStore.getState().finishRequest();

    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const shouldSkipRefresh = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");

    if (status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshTokenPromise) {
      refreshTokenPromise = requestSessionRefresh().finally(() => {
        refreshTokenPromise = null;
      });
    }

    const refreshedToken = await refreshTokenPromise;

    if (!refreshedToken) {
      return Promise.reject(error);
    }

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    }

    return api(originalRequest);
  }
);

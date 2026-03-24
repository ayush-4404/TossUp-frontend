import type { User } from "@/lib/types";

export type ThemeMode = "basic" | "team";
export type ThemeKey =
  | "basic"
  | "csk"
  | "mi"
  | "rcb"
  | "kkr"
  | "dc"
  | "pbks"
  | "rr"
  | "srh"
  | "gt"
  | "lsg";

export const THEME_MODE_STORAGE_KEY = "tossup_theme_mode";

const FAVORITE_TEAM_TO_THEME: Record<string, ThemeKey> = {
  "chennai super kings": "csk",
  "mumbai indians": "mi",
  "royal challengers bengaluru": "rcb",
  "kolkata knight riders": "kkr",
  "delhi capitals": "dc",
  "punjab kings": "pbks",
  "rajasthan royals": "rr",
  "sunrisers hyderabad": "srh",
  "gujarat titans": "gt",
  "lucknow super giants": "lsg",
};

export const getSavedThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return saved === "basic" || saved === "team" ? saved : "team";
};

export const saveThemeMode = (mode: ThemeMode) => {
  localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
};

export const getThemeForFavoriteTeam = (favoriteIplTeam?: string): ThemeKey => {
  if (!favoriteIplTeam) {
    return "basic";
  }

  const normalized = favoriteIplTeam.trim().toLowerCase();
  return FAVORITE_TEAM_TO_THEME[normalized] || "basic";
};

export const resolveTheme = (user: User | null, isAuthenticated: boolean, mode: ThemeMode): ThemeKey => {
  if (!isAuthenticated || !user) {
    return "basic";
  }

  if (mode === "basic") {
    return "basic";
  }

  return getThemeForFavoriteTeam(user.favoriteIplTeam);
};

export const applyThemeToDocument = (theme: ThemeKey) => {
  document.documentElement.setAttribute("data-theme", theme);
};

import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, User, LogOut, IndianRupee, Menu, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "tossup_theme_variant";
type ThemeVariant = "india" | "classic" | "emerald" | "sunset";
const DEFAULT_THEME_VARIANT: ThemeVariant = "india";

const THEME_VARIANTS: Array<{ value: ThemeVariant; label: string }> = [
  { value: "india", label: "Classic" },
  { value: "classic", label: "Bold" },
  { value: "emerald", label: "Emerald Rush" },
  { value: "sunset", label: "Sunset Pop" },
];

const isThemeVariant = (value: string): value is ThemeVariant => {
  return THEME_VARIANTS.some((variant) => variant.value === value);
};

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Groups", path: "/groups", icon: Users },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(DEFAULT_THEME_VARIANT);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && isThemeVariant(saved)) {
      setThemeVariant(saved);
    } else {
      setThemeVariant(DEFAULT_THEME_VARIANT);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (themeVariant === "india") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", themeVariant);
    }
    localStorage.setItem(THEME_STORAGE_KEY, themeVariant);
  }, [themeVariant]);

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    setThemeVariant((prev) => {
      const currentIndex = THEME_VARIANTS.findIndex((variant) => variant.value === prev);
      const nextIndex = (currentIndex + 1) % THEME_VARIANTS.length;
      return THEME_VARIANTS[nextIndex].value;
    });
  };

  const activeThemeLabel = THEME_VARIANTS.find((variant) => variant.value === themeVariant)?.label || "Classic";

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/TossUp-logo.png" alt="TossUp" className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover" />
          <span className="font-brand text-2xl sm:text-3xl leading-none tracking-wide gradient-text drop-shadow-[0_3px_12px_hsl(var(--primary)/0.45)]">
            TossUp
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleThemeToggle}
            className="hidden md:inline-flex gap-1.5 border-border/60 bg-muted/40 px-2 sm:px-3"
            title={`Switch theme (current: ${activeThemeLabel})`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs font-semibold">
              {activeThemeLabel}
            </span>
          </Button>

          {/* Coin Balance */}
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 sm:px-3 py-1.5 rounded-full">
            <IndianRupee className="h-4 w-4 text-secondary" />
            <span className="hidden sm:inline font-bold text-sm text-foreground">{user?.coins?.toLocaleString() ?? 0}</span>
          </div>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/10">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Profile"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl pb-4 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={handleThemeToggle}
            className="mt-2 w-full justify-start gap-2 border-border/60 bg-muted/40 px-4"
            title={`Switch theme (current: ${activeThemeLabel})`}
          >
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">
              Theme: {activeThemeLabel}
            </span>
          </Button>
        </nav>
      )}

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;

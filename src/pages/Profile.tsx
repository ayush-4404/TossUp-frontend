import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PencilLine } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/userStore";

const Profile = () => {
  const {
    user,
    isAuthenticated,
    refreshProfile,
    changePassword,
  } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    };

    if (isAuthenticated) {
      load().catch(() => {
        setLoading(false);
      });
    }
  }, [isAuthenticated, refreshProfile]);

  const initials = useMemo(() => {
    const raw = (user?.name || "").trim();
    if (!raw) {
      return "U";
    }

    const letters = raw
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

    return letters || "U";
  }, [user?.name]);

  const levelProgress = Math.max(0, Math.min(100, user?.levelProgressPercent || 0));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Missing fields",
        description: "Fill current password and new password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      return;
    }

    toast({
      title: "Change failed",
      description: result.message || "Could not change password.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-3xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-display font-bold text-3xl text-foreground">Your Profile</h1>
            {!loading ? (
              <Button type="button" onClick={() => navigate("/profile/edit")} className="gradient-primary text-primary-foreground">
                <PencilLine className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-5">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="space-y-3">
                  <div className="relative h-28 w-28 rounded-full overflow-hidden border border-border/60 bg-muted/50 flex items-center justify-center shadow-[0_0_0_4px_hsl(var(--background)/0.6)]">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/15 text-primary font-display text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="w-full min-w-[260px] rounded-xl border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-3 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Player Level</p>
                      <span className="rounded-full border border-primary/30 bg-background/50 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        Lv. {user?.level || 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all"
                          style={{ width: `${levelProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{user?.levelStart || 0} bets</span>
                        <span>{Math.round(levelProgress)}% progress</span>
                        <span>{user?.nextLevelTarget || 1} bets</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={user?.name || ""}
                    readOnly
                    className="bg-muted/30 border-border/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} readOnly className="bg-muted/30 border-border/40" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favorite-team">Favourite IPL Team</Label>
                  <select
                    id="favorite-team"
                    value={user?.favoriteIplTeam || ""}
                    className="w-full h-10 rounded-md border border-border/50 bg-muted/40 px-3 text-sm text-foreground"
                    disabled
                  >
                    <option value="" disabled>
                      Select your favourite IPL team
                    </option>
                    {user?.favoriteIplTeam ? <option value={user.favoriteIplTeam}>{user.favoriteIplTeam}</option> : null}
                  </select>
                  {user?.favoriteIplTeamLogo ? (
                    <div className="flex items-center gap-2 pt-1">
                      <img src={user.favoriteIplTeamLogo} alt={user.favoriteIplTeam || "Team"} className="h-5 w-5 object-contain" />
                      <span className="text-xs text-muted-foreground">Current: {user.favoriteIplTeam}</span>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-xl font-bold text-foreground">{user?.coins?.toLocaleString() || 0}</p>
                  </div>

                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Groups Joined</p>
                    <p className="text-xl font-bold text-foreground">{user?.totalGroups || 0}</p>
                  </div>

                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Total Bets</p>
                    <p className="text-xl font-bold text-foreground">{user?.totalBets || 0}</p>
                  </div>
                </div>

              </div>

              <section className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                  <p className="text-xs text-muted-foreground">Update your password using your current password.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="bg-muted/40 border-border/50"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="bg-muted/40 border-border/50"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                      className="bg-muted/40 border-border/50"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button type="submit" disabled={changingPassword} className="gradient-primary text-primary-foreground">
                    {changingPassword ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </section>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Profile;

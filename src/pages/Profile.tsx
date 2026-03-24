import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save } from "lucide-react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/userStore";
import type { IplTeam } from "@/lib/types";

const Profile = () => {
  const {
    user,
    isAuthenticated,
    refreshProfile,
    updateProfileName,
    updateProfileImage,
    changePassword,
    getIplTeams,
  } = useUserStore();
  const [name, setName] = useState(user?.name || "");
  const [favoriteIplTeam, setFavoriteIplTeam] = useState(user?.favoriteIplTeam || "");
  const [iplTeams, setIplTeams] = useState<IplTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setFavoriteIplTeam(user?.favoriteIplTeam || "");
  }, [user?.name, user?.favoriteIplTeam]);

  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      const result = await getIplTeams();
      setLoadingTeams(false);

      if (!result.success) {
        toast({
          title: "Could not load IPL teams",
          description: result.message || "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      setIplTeams(result.teams || []);
    };

    loadTeams().catch(() => {
      setLoadingTeams(false);
    });
  }, [getIplTeams]);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!favoriteIplTeam) {
      toast({
        title: "Favourite team required",
        description: "Please select your favourite IPL team.",
        variant: "destructive",
      });
      return;
    }

    setSavingName(true);
    const ok = await updateProfileName(trimmed, favoriteIplTeam);
    setSavingName(false);

    if (ok) {
      toast({
        title: "Profile updated",
        description: "Your name has been updated.",
      });
      return;
    }

    toast({
      title: "Update failed",
      description: "Could not update your name. Please try again.",
      variant: "destructive",
    });
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    const ok = await updateProfileImage(file);
    setUploadingImage(false);
    event.target.value = "";

    if (ok) {
      toast({
        title: "Photo updated",
        description: "Your profile picture has been saved.",
      });
      return;
    }

    toast({
      title: "Upload failed",
      description: "Could not upload profile image. Please try again.",
      variant: "destructive",
    });
  };

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
          <h1 className="font-display font-bold text-3xl text-foreground mb-6">Your Profile</h1>

          {loading ? (
            <div className="space-y-5">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative h-28 w-28 rounded-full overflow-hidden border border-border/60 bg-muted/50 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/15 text-primary font-display text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChooseImage}
                    disabled={uploadingImage}
                  >
                    <Camera className="h-4 w-4" />
                    {uploadingImage ? "Uploading..." : user?.avatar ? "Change Photo" : "Add Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB.</p>
                </div>
              </div>

              <form onSubmit={handleSaveName} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="bg-muted/40 border-border/50"
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
                    value={favoriteIplTeam}
                    onChange={(event) => setFavoriteIplTeam(event.target.value)}
                    className="w-full h-10 rounded-md border border-border/50 bg-muted/40 px-3 text-sm text-foreground"
                    disabled={loadingTeams}
                  >
                    <option value="" disabled>
                      Select your favourite IPL team
                    </option>
                    {iplTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
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

                <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Player Level</p>
                      <p className="text-xl font-bold text-foreground">Level {user?.level || 1}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user?.betsToNextLevel || 0} bet{(user?.betsToNextLevel || 0) === 1 ? "" : "s"} to next level
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, user?.levelProgressPercent || 0))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{user?.levelStart || 0} bets</span>
                      <span>{user?.nextLevelTarget || 1} bets</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={savingName} className="gradient-primary text-primary-foreground">
                  <Save className="h-4 w-4" />
                  {savingName ? "Saving..." : "Save Changes"}
                </Button>
              </form>

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

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/userStore";
import type { IplTeam } from "@/lib/types";

const EditProfile = () => {
  const {
    user,
    isAuthenticated,
    refreshProfile,
    updateProfileName,
    updateProfileImage,
    getIplTeams,
  } = useUserStore();

  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [favoriteIplTeam, setFavoriteIplTeam] = useState(user?.favoriteIplTeam || "");
  const [iplTeams, setIplTeams] = useState<IplTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  const handleSaveProfile = async (event: React.FormEvent) => {
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

    setSavingProfile(true);
    const ok = await updateProfileName(trimmed, favoriteIplTeam);
    setSavingProfile(false);

    if (!ok) {
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile updated",
      description: "Your profile details have been saved.",
    });
    navigate("/profile");
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
            <h1 className="font-display font-bold text-3xl text-foreground">Edit Profile</h1>
            <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {loading ? (
            <div className="space-y-5">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
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

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingProfile} className="gradient-primary text-primary-foreground">
                  <Save className="h-4 w-4" />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default EditProfile;

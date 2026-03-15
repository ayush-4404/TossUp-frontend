import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save, UserRound } from "lucide-react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/userStore";

const Profile = () => {
  const { user, isAuthenticated, refreshProfile, updateProfileName, updateProfileImage } = useUserStore();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

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

    setSavingName(true);
    const ok = await updateProfileName(trimmed);
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-xl font-bold text-foreground">{user?.coins?.toLocaleString() || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="text-xl font-bold text-foreground flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Player
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={savingName} className="gradient-primary text-primary-foreground">
                  <Save className="h-4 w-4" />
                  {savingName ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Profile;

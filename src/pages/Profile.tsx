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

const Profile = () => {
  const {
    user,
    isAuthenticated,
    refreshProfile,
    updateProfileName,
    updateProfileImage,
    forgotPassword,
    resetPassword,
    changePassword,
  } = useUserStore();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [sendingResetCode, setSendingResetCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
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

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast({
        title: "Email missing",
        description: "Could not find your email address.",
        variant: "destructive",
      });
      return;
    }

    setSendingResetCode(true);
    const result = await forgotPassword(user.email);
    setSendingResetCode(false);

    if (result.success) {
      toast({
        title: "Reset code sent",
        description: "A 6-digit password reset code has been sent to your email.",
      });
      return;
    }

    toast({
      title: "Failed to send code",
      description: result.message || "Could not send reset code.",
      variant: "destructive",
    });
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user?.email || !resetOtp || !resetNewPassword || !resetConfirmPassword) {
      toast({
        title: "Missing fields",
        description: "Enter OTP and new password details.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(resetOtp)) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be exactly 6 digits.",
        variant: "destructive",
      });
      return;
    }

    if (resetNewPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setResettingPassword(true);
    const result = await resetPassword(user.email, resetOtp, resetNewPassword);
    setResettingPassword(false);

    if (result.success) {
      setResetOtp("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully.",
      });
      return;
    }

    toast({
      title: "Reset failed",
      description: result.message || "Could not reset password.",
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

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-xl font-bold text-foreground">{user?.coins?.toLocaleString() || 0}</p>
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

              <section className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Forgot Password</h2>
                  <p className="text-xs text-muted-foreground">Send a reset code to your email and set a new password.</p>
                </div>

                <Button type="button" variant="outline" onClick={handleForgotPassword} disabled={sendingResetCode}>
                  {sendingResetCode ? "Sending code..." : "Send Reset Code"}
                </Button>

                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reset-otp">Reset OTP</Label>
                    <Input
                      id="reset-otp"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-muted/40 border-border/50"
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-new-password">New Password</Label>
                    <Input
                      id="reset-new-password"
                      type="password"
                      value={resetNewPassword}
                      onChange={(event) => setResetNewPassword(event.target.value)}
                      className="bg-muted/40 border-border/50"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                    <Input
                      id="reset-confirm-password"
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(event) => setResetConfirmPassword(event.target.value)}
                      className="bg-muted/40 border-border/50"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button type="submit" disabled={resettingPassword} className="gradient-primary text-primary-foreground">
                    {resettingPassword ? "Resetting..." : "Reset Password"}
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

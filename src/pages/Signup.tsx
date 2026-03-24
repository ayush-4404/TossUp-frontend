import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ImagePlus, Lock, Eye, EyeOff, Mail, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/hooks/use-toast";
import type { IplTeam } from "@/lib/types";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteIplTeam, setFavoriteIplTeam] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [teams, setTeams] = useState<IplTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const signup = useUserStore((s) => s.signup);
  const getIplTeams = useUserStore((s) => s.getIplTeams);
  const resendVerificationEmail = useUserStore((s) => s.resendVerificationEmail);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      const result = await getIplTeams();
      setLoadingTeams(false);

      if (result.success) {
        setTeams(result.teams || []);
        return;
      }

      toast({
        title: "Could not load IPL teams",
        description: result.message || "Please try again in a moment.",
        variant: "destructive",
      });
    };

    loadTeams().catch(() => {
      setLoadingTeams(false);
    });
  }, [getIplTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (!favoriteIplTeam) {
      toast({ title: "Error", description: "Please select your favourite IPL team.", variant: "destructive" });
      return;
    }

    if (profileImage && !profileImage.type.startsWith("image/")) {
      toast({ title: "Error", description: "Profile picture must be an image file.", variant: "destructive" });
      return;
    }

    if (profileImage && profileImage.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Profile picture must be up to 5MB.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await signup(name, email, password, {
      favoriteIplTeam,
      profileImage,
    });
    setLoading(false);
    if (result.success) {
      toast({ title: "Account created", description: "An OTP has been sent to your email." });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      toast({ title: "Error", description: result.message || "Signup failed. Please try again.", variant: "destructive" });
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Enter your email first.", variant: "destructive" });
      return;
    }

    setResending(true);
    const ok = await resendVerificationEmail(email);
    setResending(false);

    if (ok) {
      toast({ title: "OTP sent", description: "Check your inbox for a new verification OTP." });
    } else {
      toast({ title: "Error", description: "Could not resend verification OTP.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/5" />
      <div className="absolute top-1/3 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <img src="/TossUp-logo.png" alt="TossUp" className="h-14 w-14 object-contain mx-auto mb-3" />
            <h1 className="font-brand text-4xl gradient-text tracking-wide">Join TossUp</h1>
            <p className="text-muted-foreground mt-2 text-sm">Start predicting & winning coins!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-muted/50 border-border/50 text-foreground" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-muted/50 border-border/50 text-foreground" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Profile Picture (Optional)</label>
              <label className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/50 px-3 py-2 cursor-pointer hover:bg-muted/70 transition-colors">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {profileImage ? profileImage.name : "Upload an image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Favourite IPL Team *</label>
              {loadingTeams ? (
                <div className="text-xs text-muted-foreground">Loading teams...</div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-2 space-y-2">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setFavoriteIplTeam(team.name)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 border transition-colors ${
                        favoriteIplTeam === team.name
                          ? "border-primary bg-primary/10"
                          : "border-border/40 hover:bg-muted/40"
                      }`}
                    >
                      <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain" />
                      <span className="text-sm text-foreground text-left">{team.name}</span>
                    </button>
                  ))}
                  {teams.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-2">No teams available right now.</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-muted/50 border-border/50 text-foreground"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50 text-foreground"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-secondary text-secondary-foreground font-display font-bold text-lg h-12">
              {loading ? "Creating..." : "Create Account"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={resending}
              onClick={handleResendVerification}
              className="w-full border-border/50"
            >
              {resending ? "Sending OTP..." : "Resend Verification OTP"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

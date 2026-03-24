import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/userStore";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const forgotPassword = useUserStore((s) => s.forgotPassword);
  const resetPassword = useUserStore((s) => s.resetPassword);

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast({ title: "Email required", description: "Enter your email.", variant: "destructive" });
      return;
    }

    setSendingCode(true);
    const result = await forgotPassword(email);
    setSendingCode(false);

    if (!result.success) {
      const isEmailNotFound = (result.message || "").toLowerCase().includes("no account");
      toast({
        title: isEmailNotFound ? "Account not found" : "Unable to continue",
        description: isEmailNotFound
          ? "No TossUp account is linked to this email. Check for typos or sign up first."
          : result.message || "We could not process your request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setOtpSent(true);
    toast({ title: "OTP sent", description: "We sent a 6-digit OTP to your email." });
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !otp || !newPassword || !confirmPassword) {
      toast({ title: "Missing details", description: "Fill all fields.", variant: "destructive" });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({ title: "Invalid OTP", description: "OTP must be 6 digits.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setResetting(true);
    const result = await resetPassword(email, otp, newPassword);
    setResetting(false);

    if (!result.success) {
      toast({
        title: "Reset failed",
        description: result.message || "Could not reset password.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Password reset", description: "Login with your new password." });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <img src="/TossUp-logo.png" alt="TossUp" className="h-14 w-14 object-contain mx-auto mb-3" />
            <h1 className="font-brand text-4xl gradient-text tracking-wide">Forgot Password</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your email to verify account and receive a reset OTP.
            </p>
          </div>

          <form onSubmit={otpSent ? handleResetPassword : handleSendCode} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50 text-foreground"
              />
            </div>

            {otpSent ? (
              <>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="bg-muted/50 border-border/50 text-foreground"
                />

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-muted/50 border-border/50 text-foreground"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-muted/50 border-border/50 text-foreground"
                  />
                </div>
              </>
            ) : null}

            <Button
              type="submit"
              disabled={otpSent ? resetting : sendingCode}
              className="w-full gradient-primary text-primary-foreground font-display font-bold text-lg h-12"
            >
              {otpSent
                ? resetting
                  ? "Resetting..."
                  : "Set New Password"
                : sendingCode
                ? "Checking account..."
                : "Send OTP"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Back to{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

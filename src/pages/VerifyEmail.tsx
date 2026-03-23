import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, setAuthToken, setStoredUser } from "@/lib/api";
import { mapUser } from "@/lib/adapters";
import { toast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefilledEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp) {
      toast({ title: "Missing details", description: "Enter email and OTP.", variant: "destructive" });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({ title: "Invalid OTP", description: "OTP must be 6 digits.", variant: "destructive" });
      return;
    }

    setVerifying(true);
    try {
      const response = await api.post("/auth/verify-email", { email, otp });
      const tokenJwt = response.data?.data?.token;
      const user = mapUser(response.data?.data?.user);

      if (tokenJwt) {
        setAuthToken(tokenJwt);
        setStoredUser(user);
      }

      toast({ title: "Email verified", description: "Your account is now active." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error?.response?.data?.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Enter your email first.", variant: "destructive" });
      return;
    }

    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast({ title: "OTP sent", description: "Check your email for a new OTP." });
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error?.response?.data?.message || "Could not send OTP right now.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <MailCheck className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Verify Email</h1>
          <p className="text-muted-foreground text-sm">Enter the 6-digit OTP sent to your email.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/50 border-border/50"
          />

          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="bg-muted/50 border-border/50 tracking-[0.3em] text-center font-semibold"
          />

          <Button type="submit" disabled={verifying} className="w-full">
            {verifying ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button type="button" variant="outline" disabled={resending} onClick={handleResend} className="w-full">
            {resending ? "Sending OTP..." : "Resend OTP"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Back to{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;

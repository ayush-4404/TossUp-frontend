import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api, setAuthToken, setStoredUser } from "@/lib/api";
import { mapUser } from "@/lib/adapters";

type VerifyState = "loading" | "success" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    const verify = async () => {
      if (!email || !token) {
        setState("error");
        setMessage("Verification link is invalid. Missing email or token.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", { email, token });
        const tokenJwt = response.data?.data?.token;
        const user = mapUser(response.data?.data?.user);

        if (tokenJwt) {
          setAuthToken(tokenJwt);
          setStoredUser(user);
        }

        setState("success");
        setMessage("Email verified successfully. Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 1200);
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message || "Email verification failed. Link may be expired.";
        setState("error");
        setMessage(backendMessage);
      }
    };

    verify();
  }, [email, token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-3">{state === "success" ? "✅" : state === "error" ? "⚠️" : "⏳"}</div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Email Verification</h1>
        <p className="text-muted-foreground mb-6">{message}</p>

        {state === "error" ? (
          <div className="space-y-2">
            <Link to="/login" className="block">
              <Button className="w-full">Go to Login</Button>
            </Link>
            <p className="text-xs text-muted-foreground">You can request a new verification link from signup/login flow.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VerifyEmail;

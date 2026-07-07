import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import finzeeLogo from "@/assets/finzee-logo.png";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { appConfig } from "@/config/app";

function emailForPersona(p: string): string | null {
  const s = p.toLowerCase();
  if (s === "jason") return "jason@finzee.demo";
  if (s === "maya") return "maya@finzee.demo";
  if (s === "ava") return "ava@finzee.demo";
  return null;
}

function ViewerGate({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-viewer", {
        body: { code: code.trim() },
      });

      if (fnError || !data?.ok) {
        setError("Wrong code. Try again.");
        return;
      }

      localStorage.setItem("share_vc", "ok");
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={finzeeLogo} alt={appConfig.brandName} className="h-10 mx-auto mb-4" />
          <CardTitle>Enter viewer code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="code"
              type="password"
              placeholder="Viewer code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "View demo"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Investor preview · full app access (demo data)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SharePersona() {
  const { persona } = useParams<{ persona: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setDemoMode } = useDemoMode();
  const token = searchParams.get("token");
  const urlCode = searchParams.get("code");

  const [isVerified, setIsVerified] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(!!token || !!urlCode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Check for signed token, ?code= param, or localStorage viewer code
  useEffect(() => {
    const verifyAccess = async () => {
      // 1. Check for ?code= parameter (auto-submit)
      if (urlCode) {
        setTokenVerifying(true);
        try {
          const { data, error: fnError } = await supabase.functions.invoke("verify-viewer", {
            body: { code: urlCode.trim() },
          });

          if (!fnError && data?.ok) {
            localStorage.setItem("share_vc", "ok");
            setIsVerified(true);
            setTokenVerifying(false);
            setLoading(false);
            return;
          }
        } catch {
          // Code invalid, fall through
        }
        setTokenVerifying(false);
      }

      // 2. Check for signed token
      if (token) {
        setTokenVerifying(true);
        try {
          const { data: result } = await supabase.functions.invoke("share-token", {
            body: { action: "verify", token },
          });

          if (result?.valid && (result?.persona === "all" || result?.persona?.toLowerCase() === persona?.toLowerCase())) {
            setIsVerified(true);
            setTokenVerifying(false);
            setLoading(false);
            return;
          }
        } catch {
          // Token invalid, fall through to viewer code check
        }
        setTokenVerifying(false);
      }

      const verified = localStorage.getItem("share_vc") === "ok";
      setIsVerified(verified);
      setLoading(false);
    };

    verifyAccess();
  }, [token, urlCode, persona]);

  // Auto-login after verification
  useEffect(() => {
    if (!isVerified || !persona || signingIn) return;

    const signInAndRedirect = async () => {
      const email = emailForPersona(persona);
      if (!email) {
        setError("Unknown persona");
        return;
      }

      setSigningIn(true);

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: "Demo123!$",
        });

        if (signInError) {
          setError(signInError.message);
          setSigningIn(false);
          return;
        }

        setDemoMode(true);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        setSigningIn(false);
      }
    };

    signInAndRedirect();
  }, [isVerified, persona, navigate, setDemoMode, signingIn]);

  if (tokenVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!isVerified && !loading) {
    return <ViewerGate onSuccess={() => setIsVerified(true)} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate("/share/jason")}>
              Try Jason
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading or signing in
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Preparing your demo...</span>
      </div>
    </div>
  );
}

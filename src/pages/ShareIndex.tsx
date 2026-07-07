import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import finzeeLogo from "@/assets/finzee-logo.png";
import { appConfig } from "@/config/app";

const PERSONAS = [
  {
    key: "jason",
    name: "Jason",
    title: "New Dad",
    subtitle: "Stable salary, budget rebalancing, baby prep",
    avatarUrl: "/demo/jason-avatar.png",
    color: "bg-blue-500",
  },
  {
    key: "maya",
    name: "Maya",
    title: "Freelancer",
    subtitle: "Irregular income, tax set-asides, buffer savings",
    avatarUrl: "/demo/maya-avatar.png",
    color: "bg-emerald-500",
  },
  {
    key: "ava",
    name: "Ava",
    title: "Gen Z Student",
    subtitle: "Overdraft guardrails, credit hygiene, micro-nudges",
    avatarUrl: "/demo/ava-avatar.png",
    color: "bg-violet-500",
  },
] as const;

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
        setError("Wrong code");
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
            Investor preview · read-only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShareIndex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isVerified, setIsVerified] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(!!token);

  useEffect(() => {
    const verifyAccess = async () => {
      if (token) {
        setTokenVerifying(true);
        try {
          const { data: result } = await supabase.functions.invoke("share-token", {
            body: { action: "verify", token },
          });

          if (result?.valid) {
            // Store token for use when navigating to persona pages
            sessionStorage.setItem("share_token", token);
            setIsVerified(true);
            setTokenVerifying(false);
            return;
          }
        } catch {
          // Token invalid, fall through
        }
        setTokenVerifying(false);
      }

      const verified = localStorage.getItem("share_vc") === "ok";
      setIsVerified(verified);
    };

    verifyAccess();
  }, [token]);

  const handlePersonaClick = (personaKey: string) => {
    const storedToken = sessionStorage.getItem("share_token");
    if (storedToken) {
      navigate(`/share/${personaKey}?token=${storedToken}`);
    } else {
      navigate(`/share/${personaKey}`);
    }
  };

  if (tokenVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  if (!isVerified) {
    return <ViewerGate onSuccess={() => setIsVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* Header */}
        <div className="text-center py-8">
          <img src={finzeeLogo} alt={appConfig.brandName} className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{appConfig.brandName} Demo</h1>
          <p className="text-muted-foreground mt-2">
            Choose a persona to explore their financial journey
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Investor preview · read-only
          </p>
        </div>

        {/* Persona Cards */}
        <div className="space-y-4">
          {PERSONAS.map((persona) => (
            <button
              key={persona.key}
              onClick={() => handlePersonaClick(persona.key)}
              className="group w-full text-left p-5 rounded-2xl border border-border bg-card shadow-card transition-all duration-300 ease-out hover:shadow-card-hover hover:border-primary/40 hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <Avatar className={`h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-${persona.color.replace('bg-', '')} transition-all duration-300 group-hover:ring-primary`}>
                    <AvatarImage src={persona.avatarUrl} alt={persona.name} />
                    <AvatarFallback className={`${persona.color} text-white text-lg font-semibold`}>
                      {persona.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {persona.name} — {persona.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed transition-colors duration-300 group-hover:text-foreground/70">
                    {persona.subtitle}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          No bank links. No writes. View-only access.
        </p>
      </div>
    </div>
  );
}

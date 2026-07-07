import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareLinkGenerator } from "@/components/share/ShareLinkGenerator";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app";
import finzeeLogo from "@/assets/finzee-logo.png";

const PERSONAS = [
  {
    key: "ava",
    name: "Ava",
    title: "Ava — Gen Z Student",
    subtitle: "Overdraft guardrails · credit hygiene · micro-nudges",
    email: "ava@finzee.demo",
    seedFunction: "seed-demo-ava",
    avatarUrl: "/demo/ava-avatar.png",
    color: "bg-violet-500",
  },
  {
    key: "maya",
    name: "Maya",
    title: "Maya — Freelancer",
    subtitle: "Irregular income · tax set-asides · buffer savings",
    email: "maya@finzee.demo",
    seedFunction: "seed-demo-maya",
    avatarUrl: "/demo/maya-avatar.png",
    color: "bg-emerald-500",
  },
  {
    key: "jason",
    name: "Jason",
    title: "Jason — New Dad",
    subtitle: "Stable salary · budget rebalancing · baby prep",
    email: "jason@finzee.demo",
    seedFunction: "seed-demo",
    avatarUrl: "/demo/jason-avatar.png",
    color: "bg-blue-500",
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const getShareLink = (persona: string) => 
  `/share/${persona}?code=${encodeURIComponent(appConfig.viewerCode)}`;

interface PersonaCardProps {
  title: string;
  subtitle: string;
  name: string;
  avatarUrl: string;
  color: string;
  personaKey: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

function PersonaCard({ title, subtitle, name, avatarUrl, color, personaKey, onClick, disabled, loading }: PersonaCardProps) {
  // In personaOnly mode, link directly to share page (no seeding needed)
  if (appConfig.personaOnly) {
    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link 
          to={getShareLink(personaKey)}
          className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4 hover:shadow-lg hover:border-primary/30 transition-shadow"
        >
          <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 ring-2 ring-background shadow-md">
            <AvatarImage src={avatarUrl} alt={title} />
            <AvatarFallback className={`${color} text-white`}>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</div>
            <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">{subtitle}</div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Full demo mode with seeding
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      variants={cardVariants}
      whileHover={!disabled ? { scale: 1.02, y: -4 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className="group relative w-full text-left p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-card transition-shadow duration-300 ease-out hover:shadow-card-hover hover:border-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative transition-transform duration-300 group-hover:scale-110">
          <Avatar className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 ring-2 ring-offset-2 ring-offset-background transition-all duration-300 ${loading ? 'ring-muted' : `ring-${color.replace('bg-', '')} group-hover:ring-primary`}`}>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className={`${color} text-white text-lg font-semibold`}>
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
            {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed transition-colors duration-300 group-hover:text-foreground/70 line-clamp-2 sm:line-clamp-none">
            {subtitle}
          </p>
        </div>
      </div>
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Preparing demo...</span>
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

export default function Demo() {
  const [busy, setBusy] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setDemoMode } = useDemoMode();

  async function startDemo(email: string, seedFunction: string, name: string) {
    if (busy) return;
    setBusy(email);

    try {
      // Step 1: Seed demo data
      const { data, error: seedError } = await supabase.functions.invoke(seedFunction, {
        method: "POST",
      });

      if (seedError) {
        console.error("Seed error:", seedError);
        toast.error(`Failed to set up demo: ${seedError.message}`);
        setBusy(null);
        return;
      }

      if (!data?.pass) {
        console.log("Seed report:", data);
        toast.error("Demo setup incomplete. Check console for details.");
        setBusy(null);
        return;
      }

      // Step 2: Log in as demo user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: "Demo123!$",
      });

      if (loginError) {
        toast.error(`Login failed: ${loginError.message}`);
        setBusy(null);
        return;
      }

      // Step 3: Enable demo mode
      setDemoMode(true);

      toast.success(`Welcome, ${name}! 🎉`);
      navigate("/tour?step=1");
    } catch (err) {
      console.error("Demo start error:", err);
      toast.error("Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-6 sm:py-8">
      {/* Header with logo */}
      <motion.header 
        className="mx-auto max-w-3xl mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src={finzeeLogo} alt={appConfig.brandName} className="h-10 w-auto" />
        </Link>
      </motion.header>

      <motion.h1 
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Start {appConfig.brandName} Demo
      </motion.h1>
      <motion.p 
        className="text-center text-sm sm:text-base text-muted-foreground mt-2 px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Pick a persona to explore a pre-wired prototype.{appConfig.personaOnly ? " No login needed." : ""}
      </motion.p>

      {/* Investor link - hidden in personaOnly mode */}
      {!appConfig.personaOnly && (
        <motion.div 
          className="flex justify-center mt-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ShareLinkGenerator
            trigger={
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Generate Investor Link
              </Button>
            }
          />
        </motion.div>
      )}

      {/* Persona Cards */}
      <motion.div 
        className="mx-auto mt-6 grid max-w-3xl gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {PERSONAS.map((persona) => (
          <PersonaCard
            key={persona.key}
            title={persona.title}
            subtitle={persona.subtitle}
            name={persona.name}
            avatarUrl={persona.avatarUrl}
            color={persona.color}
            personaKey={persona.key}
            onClick={() => startDemo(persona.email, persona.seedFunction, persona.name)}
            disabled={!!busy}
            loading={busy === persona.email}
          />
        ))}
      </motion.div>

      {/* Back link - hidden in personaOnly mode */}
      {!appConfig.personaOnly && (
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </motion.div>
      )}

      {/* Footer note */}
      <motion.p 
        className="text-xs text-muted-foreground text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        {appConfig.personaOnly 
          ? "These links open the full demo experience (read-only data). No signup required."
          : busy ? "Preparing demo..." : "Choose a persona to experience your AI finance coach."}
      </motion.p>
    </main>
  );
}

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  LayoutDashboard,
  Target,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { appConfig } from "@/config/app";

type PersonaKey = "jason" | "maya" | "ava" | "default";

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route: string;
  tips: Record<PersonaKey, string>;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Meet Your AI Coach",
    description: `Chat with ${appConfig.brandName} — your personal finance coach. Ask questions, get advice tailored to your situation, and build better money habits through conversation.`,
    icon: MessageSquare,
    color: "bg-primary",
    route: "/chat",
    tips: {
      jason: "Try asking: 'How should I adjust my budget for the new baby?'",
      maya: "Try asking: 'How much should I set aside for taxes this month?'",
      ava: "Try asking: 'Am I on track with my spending this week?'",
      default: "Try asking: 'How am I doing on my goals?'",
    },
  },
  {
    id: 2,
    title: "Your Financial Dashboard",
    description:
      "See your complete financial picture at a glance. Track spending, monitor accounts, and spot trends before they become problems.",
    icon: LayoutDashboard,
    color: "bg-emerald-500",
    route: "/dashboard",
    tips: {
      jason: "Check how your Baby Fund savings are progressing.",
      maya: "See your income flow and when your next project payment is due.",
      ava: "Monitor your balance to avoid overdraft surprises.",
      default: "Check your spending breakdown by category.",
    },
  },
  {
    id: 3,
    title: "Set & Track Goals",
    description:
      "Create savings goals for what matters most — emergency fund, vacation, or that new gadget. Watch your progress grow over time.",
    icon: Target,
    color: "bg-violet-500",
    route: "/goals",
    tips: {
      jason: "Your Baby Fund and 529 Plan goals are already set up.",
      maya: "Your Tax Reserve and Emergency Buffer goals are tracking.",
      ava: "Your Overdraft Buffer goal helps you stay in the green.",
      default: "Your demo account has pre-set goals to explore.",
    },
  },
  {
    id: 4,
    title: "Smart Insights",
    description: `Get personalized tips and alerts based on your spending patterns. ${appConfig.brandName.split(' ')[0]} spots opportunities you might miss.`,
    icon: TrendingUp,
    color: "bg-amber-500",
    route: "/insights",
    tips: {
      jason: "Get alerts when your grocery or baby supply budget needs attention.",
      maya: "Get notified when income arrives to sweep into savings.",
      ava: "Get nudges about delivery app spending during busy weeks.",
      default: "Insights update as your spending changes.",
    },
  },
  {
    id: 5,
    title: "Customize Your Experience",
    description:
      "Adjust your AI coach's tone, enable voice replies, and fine-tune notifications to match your preferences.",
    icon: Settings,
    color: "bg-slate-500",
    route: "/settings",
    tips: {
      jason: "Enable nudges to get bill reminders before due dates.",
      maya: "Set up weekly cash-flow summaries for project planning.",
      ava: "Try Gen-Z friendly mode for more casual vibes. 💅",
      default: "Try enabling voice mode for audio responses.",
    },
  },
];

export default function Tour() {
  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") || "1", 10);
  const [currentStep, setCurrentStep] = useState(
    Math.min(Math.max(initialStep, 1), TOUR_STEPS.length)
  );
  const navigate = useNavigate();
  const { user } = useAuth();

  const step = TOUR_STEPS[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOUR_STEPS.length;

  // Detect persona from email
  const email = user?.email || "";
  const personaKey: PersonaKey = email.includes("jason")
    ? "jason"
    : email.includes("maya")
    ? "maya"
    : email.includes("ava")
    ? "ava"
    : "default";

  // Get display name
  const personaNames: Record<PersonaKey, string> = {
    jason: "Jason",
    maya: "Maya",
    ava: "Ava",
    default: "there",
  };
  const displayName = personaNames[personaKey];

  // Get the tip for current persona
  const currentTip = step.tips[personaKey];

  function goNext() {
    if (isLastStep) {
      navigate("/chat");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function goPrev() {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  }

  function skipTour() {
    navigate("/chat");
  }

  function goToFeature() {
    navigate(step.route);
  }

  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">Quick Tour</span>
          </div>
          <button
            onClick={skipTour}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Welcome message on first step */}
          {isFirstStep && (
            <p className="text-center text-muted-foreground mb-6">
              Welcome, {displayName}! Let's show you around. 👋
            </p>
          )}

          {/* Step card */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            {/* Icon header */}
            <div className={`${step.color} p-8 flex justify-center`}>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <Icon className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h2 className="font-display text-2xl font-bold text-foreground text-center">
                {step.title}
              </h2>
              <p className="mt-3 text-muted-foreground text-center leading-relaxed">
                {step.description}
              </p>

              {/* Tip */}
              <div className="mt-4 bg-accent/50 rounded-lg px-4 py-3">
                <p className="text-sm text-accent-foreground text-center">
                  💡 <span className="font-medium">Tip:</span> {currentTip}
                </p>
              </div>

              {/* Try it button */}
              <Button
                variant="outline"
                onClick={goToFeature}
                className="w-full mt-4"
              >
                Try it now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {TOUR_STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`h-2 rounded-full transition-all ${
                  s.id === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to step ${s.id}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep} of {TOUR_STEPS.length}
            </span>

            <Button onClick={goNext} className="gap-1">
              {isLastStep ? "Start Exploring" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

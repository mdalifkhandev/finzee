import { useState, useEffect } from "react";
import { AlertTriangle, X, Brain, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStressAlerts } from "@/hooks/use-stress-alerts";
import { cn } from "@/lib/utils";

interface StressAlertBannerProps {
  className?: string;
}

export function StressAlertBanner({ className }: StressAlertBannerProps) {
  const { currentStress, isHighStress } = useStressAlerts();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (isHighStress && !isDismissed) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighStress, isDismissed]);

  if (!isHighStress || isDismissed) {
    return null;
  }

  const getStressLevel = () => {
    if (currentStress >= 80) return { label: "Very High", color: "text-red-500" };
    if (currentStress >= 65) return { label: "High", color: "text-orange-500" };
    return { label: "Elevated", color: "text-yellow-500" };
  };

  const stressInfo = getStressLevel();

  return (
    <Card
      className={cn(
        "border-destructive/50 bg-destructive/5 transition-all duration-300",
        showPulse && "animate-pulse",
        className
      )}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">
                  Spending Protection Active
                </h4>
                <span className={cn("text-sm font-medium", stressInfo.color)}>
                  Stress: {stressInfo.label} ({currentStress}%)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your wearable detected elevated stress levels. Finzee will alert you
                before purchases to help prevent emotional spending.
              </p>
              <Progress 
                value={currentStress} 
                className="mt-2 h-1.5 w-48"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

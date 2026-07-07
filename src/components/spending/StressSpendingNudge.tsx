import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, X, Lightbulb } from "lucide-react";
import { useState } from "react";

interface StressSpendingNudgeProps {
  recentSpend: number;
  topMerchant: string;
  spikePercentage: number;
  isExamPeriod: boolean;
  periodName: string;
  onDismiss?: () => void;
}

export function StressSpendingNudge({
  recentSpend,
  topMerchant,
  spikePercentage,
  isExamPeriod,
  periodName,
  onDismiss,
}: StressSpendingNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="border-warning/50 bg-warning/5 relative">
      <UtensilsCrossed className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning flex items-center gap-2">
        {isExamPeriod ? `${periodName} stress-spending check-in` : "Delivery spending heads-up"}
        <span className="text-xs font-normal text-muted-foreground">
          📚 No judgment, just awareness
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-foreground">
          You've spent <span className="font-semibold">${recentSpend.toFixed(0)}</span> on{" "}
          <span className="font-medium">{topMerchant}</span> this week
          {spikePercentage > 0 && (
            <span className="text-muted-foreground"> ({spikePercentage}% more than usual)</span>
          )}
          .
        </p>
        
        <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Quick win:</span> Swapping just 2 delivery orders 
            for meal prep could save ~$30 toward your goals. Check HEB for that 10% student discount! 🛒
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            Got it, thanks!
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={handleDismiss}>
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

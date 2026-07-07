import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Brain, Clock, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PurchaseWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  category?: string;
  stressLevel: number;
  onProceed: () => void;
  onCancel: () => void;
}

export function PurchaseWarningDialog({
  open,
  onOpenChange,
  amount,
  category,
  stressLevel,
  onProceed,
  onCancel,
}: PurchaseWarningDialogProps) {
  const [countdown, setCountdown] = useState(5);

  const handleProceed = () => {
    onProceed();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Brain className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            High Stress Spending Alert
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-lg font-semibold text-foreground">
                  ${amount.toFixed(2)}
                  {category && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      • {category}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Current Stress Level</span>
                  <span className="font-medium text-destructive">{stressLevel}%</span>
                </div>
                <Progress value={stressLevel} className="h-2" />
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4 text-left">
                <div className="flex items-start gap-3">
                  <TrendingDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    High-stress purchases are <strong>23% more likely</strong> to be
                    regretted within 24 hours.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    Consider waiting <strong>30 minutes</strong> before deciding.
                    Your stress may decrease.
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <AlertDialogCancel
            onClick={handleCancel}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Wait & Save Money
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleProceed}
            className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
          >
            I Understand, Proceed Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

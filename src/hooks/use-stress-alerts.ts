import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { getWearableSummary } from "@/lib/mock-wearables";

export interface StressAlertConfig {
  stressThreshold: number; // Default 65
  enabled: boolean;
  cooldownMinutes: number; // Prevent spam
}

const DEFAULT_CONFIG: StressAlertConfig = {
  stressThreshold: 65,
  enabled: true,
  cooldownMinutes: 5,
};

export function useStressAlerts(config: Partial<StressAlertConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [currentStress, setCurrentStress] = useState(0);
  const [isHighStress, setIsHighStress] = useState(false);
  const lastAlertTime = useRef<number>(0);

  // Simulate real-time stress monitoring
  useEffect(() => {
    const updateStress = () => {
      const summary = getWearableSummary();
      // Add some variance to simulate real-time changes
      const variance = (Math.random() - 0.5) * 15;
      const newStress = Math.max(0, Math.min(100, summary.stressLevel + variance));
      setCurrentStress(Math.round(newStress));
      setIsHighStress(newStress >= finalConfig.stressThreshold);
    };

    updateStress();
    const interval = setInterval(updateStress, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [finalConfig.stressThreshold]);

  const checkPurchaseIntent = useCallback((
    amount: number,
    category?: string
  ): { shouldWarn: boolean; message: string } => {
    if (!finalConfig.enabled) {
      return { shouldWarn: false, message: "" };
    }

    const now = Date.now();
    const cooldownMs = finalConfig.cooldownMinutes * 60 * 1000;
    
    if (now - lastAlertTime.current < cooldownMs) {
      return { shouldWarn: false, message: "" };
    }

    if (isHighStress) {
      lastAlertTime.current = now;
      
      const categoryMessage = category 
        ? ` on ${category}` 
        : "";
      
      return {
        shouldWarn: true,
        message: `Your stress level is at ${currentStress}%. Consider waiting before spending $${amount.toFixed(2)}${categoryMessage}. Research shows high-stress purchases are 23% more likely to be regretted.`,
      };
    }

    return { shouldWarn: false, message: "" };
  }, [isHighStress, currentStress, finalConfig.enabled, finalConfig.cooldownMinutes]);

  const triggerPurchaseWarning = useCallback((
    amount: number,
    category?: string,
    onProceed?: () => void,
    onCancel?: () => void
  ) => {
    const { shouldWarn, message } = checkPurchaseIntent(amount, category);
    
    if (shouldWarn) {
      toast({
        variant: "destructive",
        title: "⚠️ High Stress Alert",
        description: message,
        duration: 8000,
      });
      
      // Return true to indicate warning was shown
      return true;
    }
    
    return false;
  }, [checkPurchaseIntent]);

  return {
    currentStress,
    isHighStress,
    checkPurchaseIntent,
    triggerPurchaseWarning,
    config: finalConfig,
  };
}

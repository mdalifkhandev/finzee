import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSkimSettings } from './use-skim-settings';
import { useToast } from './use-toast';

interface SkimResult {
  message: string;
  totalSkimmed: number;
  skimmed: Array<{
    sourceId: string;
    skimId: string;
    amount: number;
    sourceMerchant: string;
  }>;
  goalProgress?: {
    name: string;
    current: number;
    target: number;
  };
}

export function useSkimProcessor() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSkimSettings();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<SkimResult | null>(null);

  const processSkims = useCallback(async () => {
    if (!user || !settings.enabled || processing) return null;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('skim-process', {
        body: {
          percentage: settings.percentage,
          targetGoalKind: settings.targetGoalKind,
          lastProcessedTransactionId: settings.lastProcessedTransactionId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as SkimResult;
      setLastResult(result);

      // Update the last processed transaction ID
      if (result.skimmed?.length > 0) {
        const lastId = result.skimmed[result.skimmed.length - 1].sourceId;
        updateSettings({ lastProcessedTransactionId: lastId });

        toast({
          title: '💰 Auto-Saved!',
          description: `Skimmed $${result.totalSkimmed.toFixed(2)} to your ${result.goalProgress?.name || 'savings'}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Skim processing error:', error);
      return null;
    } finally {
      setProcessing(false);
    }
  }, [user, settings, processing, updateSettings, toast]);

  return {
    processSkims,
    processing,
    lastResult,
    isEnabled: settings.enabled,
  };
}

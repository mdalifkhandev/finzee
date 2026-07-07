import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface SpendingAnalysis {
  recentDeliverySpend: number;
  baselineDeliverySpend: number;
  spikePercentage: number;
  isSpike: boolean;
  recentOrders: number;
  topMerchant: string;
}

interface StressSpendingResult {
  success: boolean;
  analysis: SpendingAnalysis;
  examPeriod: { isExamPeriod: boolean; periodName: string };
  nudgeCreated: boolean;
  userName: string;
}

export function useStressSpendingDetect() {
  const { user } = useAuth();
  const [hasRun, setHasRun] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stress-spending", user?.id],
    queryFn: async (): Promise<StressSpendingResult | null> => {
      if (!user) return null;

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stress-spending-detect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Stress spending detection failed:", response.status);
        return null;
      }

      return response.json();
    },
    enabled: !!user && !hasRun,
    staleTime: 1000 * 60 * 60, // 1 hour - don't spam the check
    refetchOnWindowFocus: false,
  });

  // Mark as run after first successful fetch
  useEffect(() => {
    if (data?.success) {
      setHasRun(true);
    }
  }, [data]);

  return {
    analysis: data?.analysis || null,
    examPeriod: data?.examPeriod || null,
    nudgeCreated: data?.nudgeCreated || false,
    isLoading,
    refetch,
  };
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Delivery apps to track for stress spending
const DELIVERY_MERCHANTS = [
  "doordash", "uber eats", "grubhub", "postmates", "instacart", 
  "seamless", "caviar", "gopuff", "favor", "delivery"
];

// Exam period detection (rough heuristics - mid-terms and finals)
function isLikelyExamPeriod(): { isExamPeriod: boolean; periodName: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  
  // Mid-terms: late Feb/early March, late October
  // Finals: early/mid December, early/mid May
  if ((month === 2 && day <= 15) || (month === 1 && day >= 20)) {
    return { isExamPeriod: true, periodName: "midterms" };
  }
  if ((month === 9 && day >= 20) || (month === 10 && day <= 10)) {
    return { isExamPeriod: true, periodName: "midterms" };
  }
  if ((month === 11 && day <= 20) || (month === 4 && day <= 15)) {
    return { isExamPeriod: true, periodName: "finals" };
  }
  
  // For demo purposes, also trigger on weekends (simulating stress periods)
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isExamPeriod: true, periodName: "weekend study session" };
  }
  
  return { isExamPeriod: false, periodName: "" };
}

interface SpendingAnalysis {
  recentDeliverySpend: number;
  baselineDeliverySpend: number;
  spikePercentage: number;
  isSpike: boolean;
  recentOrders: number;
  topMerchant: string;
}

async function analyzeDeliverySpending(
  supabase: any,
  userId: string
): Promise<SpendingAnalysis> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get recent transactions (last 7 days)
  const { data: recentTx = [] } = await supabase
    .from("transactions")
    .select("merchant, amount, ts")
    .eq("user_id", userId)
    .gte("ts", sevenDaysAgo.toISOString())
    .lt("amount", 0); // Only expenses

  // Get baseline transactions (8-30 days ago)
  const { data: baselineTx = [] } = await supabase
    .from("transactions")
    .select("merchant, amount, ts")
    .eq("user_id", userId)
    .gte("ts", thirtyDaysAgo.toISOString())
    .lt("ts", sevenDaysAgo.toISOString())
    .lt("amount", 0);

  // Filter for delivery merchants
  const isDelivery = (merchant: string) =>
    DELIVERY_MERCHANTS.some((d) => merchant.toLowerCase().includes(d));

  const recentDelivery = recentTx.filter((tx: any) => isDelivery(tx.merchant || ""));
  const baselineDelivery = baselineTx.filter((tx: any) => isDelivery(tx.merchant || ""));

  const recentDeliverySpend = recentDelivery.reduce(
    (sum: number, tx: any) => sum + Math.abs(tx.amount),
    0
  );
  
  // Normalize baseline to 7-day equivalent (it's ~23 days of data)
  const baselineDays = 23;
  const baselineTotal = baselineDelivery.reduce(
    (sum: number, tx: any) => sum + Math.abs(tx.amount),
    0
  );
  const baselineDeliverySpend = (baselineTotal / baselineDays) * 7;

  // Calculate spike
  const spikePercentage = baselineDeliverySpend > 0
    ? ((recentDeliverySpend - baselineDeliverySpend) / baselineDeliverySpend) * 100
    : recentDeliverySpend > 0 ? 100 : 0;

  // Find top merchant
  const merchantCounts: Record<string, number> = {};
  recentDelivery.forEach((tx: any) => {
    const m = tx.merchant || "Unknown";
    merchantCounts[m] = (merchantCounts[m] || 0) + Math.abs(tx.amount);
  });
  const topMerchant = Object.entries(merchantCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "delivery apps";

  return {
    recentDeliverySpend: Math.round(recentDeliverySpend * 100) / 100,
    baselineDeliverySpend: Math.round(baselineDeliverySpend * 100) / 100,
    spikePercentage: Math.round(spikePercentage),
    isSpike: spikePercentage >= 30 || recentDeliverySpend >= 50,
    recentOrders: recentDelivery.length,
    topMerchant,
  };
}

function generateNudgeMessage(
  analysis: SpendingAnalysis,
  examPeriod: { isExamPeriod: boolean; periodName: string },
  userName: string
): { title: string; description: string; severity: string } {
  const { recentDeliverySpend, spikePercentage, topMerchant, recentOrders } = analysis;

  // Gentle, no-shame messaging for Ava
  if (examPeriod.isExamPeriod && analysis.isSpike) {
    return {
      title: `${examPeriod.periodName.charAt(0).toUpperCase() + examPeriod.periodName.slice(1)} stress-spending check-in 📚`,
      description: `Hey ${userName}! Noticed you've spent $${recentDeliverySpend.toFixed(0)} on ${topMerchant} this week (${recentOrders} orders). Totally get it during ${examPeriod.periodName}—but swapping just 2 orders for meal prep could save ~$30 toward your goals. You've got this! 💪`,
      severity: "tip",
    };
  }

  if (analysis.isSpike) {
    return {
      title: "Delivery spending heads-up 🍕",
      description: `You've spent $${recentDeliverySpend.toFixed(0)} on delivery this week—that's ${spikePercentage}% more than usual. No judgment! Just a gentle nudge: even cutting 1-2 orders could free up cash for your emergency fund.`,
      severity: "tip",
    };
  }

  // Positive reinforcement when spending is normal
  return {
    title: "Nice work on delivery spending! 🎉",
    description: `Only $${recentDeliverySpend.toFixed(0)} on delivery this week—you're keeping it balanced. That self-control is building your future!`,
    severity: "achievement",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Analyzing stress spending for user ${user.id}...`);

    // Get user profile for name and pain points
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, pain_points")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.first_name || "there";
    const painPoints = profile?.pain_points || [];

    // Only run detailed analysis if user has relevant pain points
    const hasImpulseDelivery = painPoints.includes("impulse-delivery");
    
    // Analyze spending patterns
    const analysis = await analyzeDeliverySpending(supabase, user.id);
    const examPeriod = isLikelyExamPeriod();

    console.log("Spending analysis:", analysis);
    console.log("Exam period:", examPeriod);

    // Generate nudge if there's a spike or it's exam period with delivery spending
    const shouldNudge = analysis.isSpike || (examPeriod.isExamPeriod && analysis.recentDeliverySpend > 20);

    if (shouldNudge && hasImpulseDelivery) {
      const nudge = generateNudgeMessage(analysis, examPeriod, userName);

      // Check if we already have a similar recent insight (avoid spam)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: existingInsight } = await supabase
        .from("insights")
        .select("id")
        .eq("user_id", user.id)
        .ilike("title", "%delivery%")
        .gte("created_at", oneDayAgo)
        .limit(1);

      if (!existingInsight || existingInsight.length === 0) {
        // Create new insight/nudge
        const { error: insertError } = await supabase.from("insights").insert({
          user_id: user.id,
          type: nudge.severity,
          title: nudge.title,
          description: nudge.description,
          category: "Spending",
          is_read: false,
          is_dismissed: false,
        });

        if (insertError) {
          console.error("Failed to insert insight:", insertError);
        } else {
          console.log("Created stress-spending nudge");
        }
      } else {
        console.log("Skipping duplicate nudge (recent one exists)");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        examPeriod,
        nudgeCreated: shouldNudge && hasImpulseDelivery,
        userName,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in stress-spending-detect:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

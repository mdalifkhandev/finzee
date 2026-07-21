import { jsonResponse, optionsResponse } from "../_shared.ts";
import { dispatchBudgetAlerts } from "../_budget_alerts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch users with push notifications enabled
    const { data: users, error } = await supabase
      .from('consent_logs')
      .select('user_id')
      .eq('push_reminders', true);

    if (error) {
      throw error;
    }

    let sent = 0;
    for (const row of (users ?? [])) {
      const res = await dispatchBudgetAlerts(supabase, row.user_id);
      if (res.sent) sent += res.sent;
    }

    return jsonResponse({ success: true, alertsSent: sent });
  } catch (err) {
    console.error("[budget-alerts-cron] Error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

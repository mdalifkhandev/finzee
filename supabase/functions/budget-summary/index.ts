// GET /budget-summary — per-category budgets with real-time spend from
// transactions, plus overall totals.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { dispatchBudgetAlerts, loadBudgetSummary } from "../_budget_alerts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const summary = await loadBudgetSummary(supabase, user.id);
    void dispatchBudgetAlerts(supabase, user.id, summary);

    return jsonResponse({
      categories: summary.categories.map((item) => ({
        id: item.id,
        category: item.category,
        amount: item.limit_amount,
        spent: item.spent_amount,
        remaining: item.remaining,
        percent_used: item.percent_used,
        over_budget: item.over_budget,
        period: item.period,
        color: item.color,
        icon: item.icon,
      })),
      totals: {
        budget: summary.totals.budget,
        spent: summary.totals.spent,
        remaining: summary.totals.remaining,
        percent_used: summary.totals.percent_used,
      },
      period_start: summary.period_start,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

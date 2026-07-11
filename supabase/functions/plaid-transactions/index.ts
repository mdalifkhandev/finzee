// GET /plaid-transactions — returns the user's transactions from the DB.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { dispatchBudgetAlerts, loadBudgetSummary } from "../_budget_alerts.ts";

const DISCRETIONARY = ["shopping", "entertainment", "dining", "food and drink", "travel", "recreation"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, merchant, description, type, ts, categories")
      .eq("user_id", user.id)
      .order("ts", { ascending: false })
      .limit(limit);

    if (error) return jsonResponse({ error: error.message }, 500);

    const transactions = data.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      merchant: t.merchant ?? t.description ?? "Unknown",
      category: Array.isArray(t.categories) ? (t.categories[0] ?? "Uncategorized") : "Uncategorized",
      date: t.ts ? new Date(t.ts).toISOString().slice(0, 10) : null,
      is_discretionary: DISCRETIONARY.includes(((Array.isArray(t.categories) ? (t.categories[0] ?? "") : "") ?? "").toLowerCase()),
    }));

    const summary = await loadBudgetSummary(supabase, user.id, data ?? []);
    void dispatchBudgetAlerts(supabase, user.id, summary);

    return jsonResponse({ transactions, source: "db" });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

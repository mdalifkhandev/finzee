// POST /budget-set — create or update a category budget limit.
// Body: { category, amount, period?, color?, icon? }
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { dispatchBudgetAlerts, loadBudgetSummary } from "../_budget_alerts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST" && req.method !== "PUT") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await req.json();
    const { category, amount, period, color, icon, month } = body ?? {};

    if (!category || amount === undefined || amount === null) {
      return jsonResponse({ error: "category and amount are required" }, 400);
    }
    if (Number(amount) < 0) return jsonResponse({ error: "amount must be >= 0" }, 400);

    // Upsert by (user_id, category): update if the category budget exists.
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", category)
      .eq("month", monthStart)
      .maybeSingle();

    const now = new Date();
    const monthStart = month ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

    const basePayload = {
      user_id: user.id,
      category,
      limit_amount: Number(amount),
      month: monthStart,
      period: period ?? "monthly",
      color: color ?? null,
      icon: icon ?? null,
    };

    const insertPayload = {
      ...basePayload,
      spent_amount: 0,
    };

    const query = existing
      ? supabase.from("budgets").update(basePayload).eq("id", existing.id).select().single()
      : supabase.from("budgets").insert(insertPayload).select().single();

    const { data, error } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);

    const summary = await loadBudgetSummary(supabase, user.id);
    void dispatchBudgetAlerts(supabase, user.id, summary);

    return jsonResponse({ budget: data });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

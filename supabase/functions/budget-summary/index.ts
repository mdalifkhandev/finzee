// GET /budget-summary — per-category budgets with real-time spend from
// transactions, plus overall totals.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    // Start of the current month for spend aggregation.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);

    const [budgetsRes, txRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase
        .from("transactions")
        .select("category, amount, type, date")
        .eq("user_id", user.id)
        .gte("date", monthStart),
    ]);

    if (budgetsRes.error) return jsonResponse({ error: budgetsRes.error.message }, 500);

    // Sum spend per category (expenses only).
    const spentByCat = new Map<string, number>();
    for (const t of txRes.data ?? []) {
      if (t.type === "income") continue;
      const cat = (t.category ?? "Uncategorized").toLowerCase();
      spentByCat.set(cat, (spentByCat.get(cat) ?? 0) + Math.abs(Number(t.amount)));
    }

    const categories = (budgetsRes.data ?? []).map((b) => {
      const spent = spentByCat.get((b.category ?? "").toLowerCase()) ?? Number(b.spent) ?? 0;
      const amount = Number(b.amount);
      return {
        id: b.id,
        category: b.category,
        amount,
        spent,
        remaining: Math.max(amount - spent, 0),
        percent_used: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        over_budget: spent > amount,
        period: b.period,
        color: b.color,
        icon: b.icon,
      };
    });

    const totalBudget = categories.reduce((s, c) => s + c.amount, 0);
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);

    return jsonResponse({
      categories,
      totals: {
        budget: totalBudget,
        spent: totalSpent,
        remaining: Math.max(totalBudget - totalSpent, 0),
        percent_used: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      },
      period_start: monthStart,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

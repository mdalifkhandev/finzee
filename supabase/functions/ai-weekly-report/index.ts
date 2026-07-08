// GET /ai-weekly-report — aggregates the last 7 days of activity and asks Claude
// for a weekly financial summary. Analysis only, nothing stored.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { runAI } from "../_ai.ts";

const SYSTEM = `You are FinZee, a money coach writing a short weekly financial summary.
Structure your reply with:
1. A one-line headline for the week.
2. 2-3 concise wins or concerns tied to the numbers.
3. One clear focus for next week.
Keep it warm and under 150 words. At most one emoji.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [txRes, goalsRes, pauseRes, profileRes] = await Promise.all([
      supabase.from("transactions").select("amount, category, type, date").eq("user_id", user.id).gte("date", weekAgo),
      supabase.from("goals").select("name, target_amount, current_amount").eq("user_id", user.id),
      supabase.from("pause_list_items").select("status, price, created_at").eq("user_id", user.id).gte("created_at", weekAgo),
      supabase.from("profiles").select("first_name").eq("user_id", user.id).maybeSingle(),
    ]);

    const tx = txRes.data ?? [];
    const spent = tx.filter((t) => t.type !== "income").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    const byCat: Record<string, number> = {};
    for (const t of tx) {
      if (t.type === "income") continue;
      const c = t.category ?? "Other";
      byCat[c] = (byCat[c] ?? 0) + Math.abs(Number(t.amount));
    }
    const topCategories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const pause = pauseRes.data ?? [];
    const skipped = pause.filter((p) => p.status === "skipped");
    const savedByPausing = skipped.reduce((s, p) => s + Number(p.price), 0);

    const stats = {
      first_name: profileRes.data?.first_name ?? "there",
      week_start: weekAgo,
      total_spent: Math.round(spent),
      total_income: Math.round(income),
      transaction_count: tx.length,
      top_categories: topCategories.map(([c, v]) => ({ category: c, amount: Math.round(v) })),
      goals: (goalsRes.data ?? []).map((g) => ({
        name: g.name,
        percent: Number(g.target_amount) > 0
          ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
          : 0,
      })),
      impulse_paused: pause.length,
      impulse_skipped: skipped.length,
      saved_by_pausing: Math.round(savedByPausing),
    };

    const result = await runAI({
      system: SYSTEM,
      user: `Here is the user's week as JSON. Write their weekly report.\n${JSON.stringify(stats)}`,
      maxTokens: 400,
    });

    return jsonResponse({ report: result.text, stats, model: result.model, provider: result.provider });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

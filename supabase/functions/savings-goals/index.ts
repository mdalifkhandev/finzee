// /savings-goals
//   GET  — list the user's savings goals with progress.
//   POST — create a goal, or contribute to one when { id, add_amount } is sent.
// Backed by the existing `goals` table.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

function withProgress(g: Record<string, unknown>) {
  const target = Number(g.target_amount) || 0;
  const current = Number(g.current_amount) || 0;
  return {
    ...g,
    percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0,
    remaining: Math.max(target - current, 0),
    is_completed: current >= target && target > 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return jsonResponse({ error: error.message }, 500);
      const goals = (data ?? []).map(withProgress);
      const total_saved = goals.reduce((s, g) => s + (Number(g.current_amount) || 0), 0);
      return jsonResponse({ goals, total_saved, count: goals.length });
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Contribution to an existing goal.
      if (body?.id && body?.add_amount !== undefined) {
        const { data: goal, error: getErr } = await supabase
          .from("goals")
          .select("*")
          .eq("id", body.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (getErr) return jsonResponse({ error: getErr.message }, 500);
        if (!goal) return jsonResponse({ error: "Goal not found" }, 404);

        const newAmount = Number(goal.current_amount) + Number(body.add_amount);
        const { data, error } = await supabase
          .from("goals")
          .update({
            current_amount: newAmount,
            is_completed: newAmount >= Number(goal.target_amount),
          })
          .eq("id", body.id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ goal: withProgress(data) });
      }

      // Create a new goal.
      const { name, target_amount, current_amount, target_date, category, color, icon } = body ?? {};
      if (!name || target_amount === undefined) {
        return jsonResponse({ error: "name and target_amount are required" }, 400);
      }

      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          name,
          target_amount: Number(target_amount),
          current_amount: Number(current_amount) || 0,
          target_date: target_date ?? null,
          category: category ?? null,
          color: color ?? null,
          icon: icon ?? null,
        })
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ goal: withProgress(data) });
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

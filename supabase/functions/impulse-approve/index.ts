// PUT /impulse-approve — resolve a flagged purchase after the cooldown.
// Body: { id, decision: "approved" | "bought" | "skipped" }
// Enforces the 24hr cooldown before a purchase can be approved/bought.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "PUT" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { id, decision } = await req.json().catch(() => ({}));
    if (!id) return jsonResponse({ error: "id is required" }, 400);

    const status = decision ?? "approved";
    if (!["approved", "bought", "skipped"].includes(status)) {
      return jsonResponse({ error: "decision must be approved, bought, or skipped" }, 400);
    }

    const { data: item, error: getErr } = await supabase
      .from("pause_list_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (getErr) return jsonResponse({ error: getErr.message }, 500);
    if (!item) return jsonResponse({ error: "Item not found" }, 404);

    // Cooldown only applies to approving/buying — skipping is always allowed.
    if (status !== "skipped" && new Date(item.reminder_due_at).getTime() > Date.now()) {
      return jsonResponse({
        error: "Cooldown still active",
        reminder_due_at: item.reminder_due_at,
        cooldown_active: true,
      }, 409);
    }

    const { data, error } = await supabase
      .from("pause_list_items")
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ item: data });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /impulse-history — all flagged purchases, optionally filtered by status.
// Query: ?status=pending|bought|skipped|approved  (default: all)
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const status = new URL(req.url).searchParams.get("status");

    let query = supabase
      .from("pause_list_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);

    const items = data ?? [];
    const skipped = items.filter((i) => i.status === "skipped");
    const totalSaved = skipped.reduce((s, i) => s + Number(i.price), 0);
    const heldPending = items
      .filter((i) => i.status === "pending")
      .reduce((s, i) => s + Number(i.price), 0);

    return jsonResponse({
      items,
      summary: {
        total: items.length,
        pending: items.filter((i) => i.status === "pending").length,
        skipped: skipped.length,
        bought: items.filter((i) => i.status === "bought").length,
        total_saved: totalSaved,
        currently_held: heldPending,
      },
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

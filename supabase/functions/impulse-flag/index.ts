// POST /impulse-flag — flag a purchase for the 24hr reflection (Pause List).
// Body: { itemName, price, category?, sourceUrl?, reason? }
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const b = await req.json().catch(() => ({}));
    const itemName = b.itemName ?? b.item_name;
    const price = b.price;
    if (!itemName || price === undefined) {
      return jsonResponse({ error: "itemName and price are required" }, 400);
    }

    const reminderDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("pause_list_items")
      .insert({
        user_id: user.id,
        item_name: itemName,
        price: Number(price),
        category: b.category ?? null,
        source_url: b.sourceUrl ?? b.source_url ?? null,
        reason: b.reason ?? null,
        status: "pending",
        reminder_due_at: reminderDueAt,
      })
      .select()
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ item: data });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

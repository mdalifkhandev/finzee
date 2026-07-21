// GET /impulse-streak — days without an impulse purchase.
// A "buy" (status = 'bought') resets the streak; the streak is the number of
// days since the most recent impulse buy (or since the first flag if none).
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

const DAY = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("pause_list_items")
      .select("status, price, created_at, decided_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return jsonResponse({ error: error.message }, 500);

    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const items = data ?? [];
    const bought = items.filter((i) => i.status === "bought");
    const skipped = items.filter((i) => i.status === "skipped");

    // Most recent impulse buy resets the clock.
    const lastBuyTs = bought.length
      ? Math.max(...bought.map((i) => new Date(i.decided_at ?? i.created_at).getTime()))
      : items.length
      ? new Date(items[0].created_at).getTime()
      : profile?.created_at
      ? new Date(profile.created_at).getTime()
      : Date.now();

    const currentStreakDays = Math.max(0, Math.floor((Date.now() - lastBuyTs) / DAY));
    const totalSaved = skipped.reduce((s, i) => s + Number(i.price), 0);

    return jsonResponse({
      current_streak_days: currentStreakDays,
      last_impulse_purchase_at: bought.length ? new Date(lastBuyTs).toISOString() : null,
      total_skipped: skipped.length,
      total_bought: bought.length,
      total_saved: totalSaved,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

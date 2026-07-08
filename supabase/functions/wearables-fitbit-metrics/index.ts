// GET /wearables-fitbit-metrics — returns the user's Fitbit daily metrics.
// Uses the stored Fitbit access token to call the Fitbit API when available,
// otherwise returns realistic mock data in a normalized shape.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

function normalize(steps: number, restingHr: number, minutesAsleep: number, calories: number, activeMinutes: number, source: string) {
  return {
    source,
    steps,
    sleep_hours: Math.round((minutesAsleep / 60) * 10) / 10,
    heart_rate: restingHr + 12,
    resting_heart_rate: restingHr,
    calories_burned: calories,
    active_minutes: activeMinutes,
    stress_indicator: "moderate" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? "today";

    const { data: tokenRow } = await supabase
      .from("wearable_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "fitbit")
      .maybeSingle();

    if (!tokenRow?.access_token) {
      return jsonResponse({
        metrics: normalize(7100, 59, 370, 1950, 28, "mock"),
        date,
        source: "mock",
      });
    }

    const headers = { Authorization: `Bearer ${tokenRow.access_token}` };
    const [actRes, sleepRes] = await Promise.all([
      fetch(`https://api.fitbit.com/1/user/-/activities/date/${date}.json`, { headers }),
      fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`, { headers }),
    ]);

    if (!actRes.ok) return jsonResponse({ error: "Fitbit API error", status: actRes.status }, 502);

    const act = await actRes.json();
    const sleep = sleepRes.ok ? await sleepRes.json() : { summary: {} };
    const s = act.summary ?? {};

    return jsonResponse({
      metrics: normalize(
        s.steps ?? 0,
        s.restingHeartRate ?? 60,
        sleep.summary?.totalMinutesAsleep ?? 0,
        s.caloriesOut ?? 0,
        s.fairlyActiveMinutes ?? 0,
        "fitbit",
      ),
      date,
      source: "fitbit",
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

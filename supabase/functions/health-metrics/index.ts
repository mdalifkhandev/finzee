// /health-metrics
//   GET  — latest stored daily health metrics for the user.
//   POST — upsert a day's metrics (used by the app after reading from HealthKit /
//          Health Connect / a wearable sync). Body matches health_metrics columns.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    if (req.method === "GET") {
      const url = new URL(req.url);
      const date = url.searchParams.get("date");
      const days = Math.min(Number(url.searchParams.get("days")) || 7, 90);

      let query = supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (date) query = query.eq("date", date);
      else query = query.limit(days);

      const { data, error } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);

      if (!data || data.length === 0) {
        return jsonResponse({ metrics: date ? null : [], source: "db" });
      }

      return jsonResponse({ metrics: date ? data[0] : data, source: "db" });
    }

    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const payload = {
        user_id: user.id,
        date: b.date ?? new Date().toISOString().slice(0, 10),
        source: b.source ?? "manual",
        sleep_hours: b.sleep_hours ?? b.sleepHours ?? null,
        steps: b.steps ?? null,
        heart_rate: b.heart_rate ?? b.heartRate ?? null,
        resting_heart_rate: b.resting_heart_rate ?? b.restingHeartRate ?? null,
        hrv_ms: b.hrv_ms ?? b.hrvMs ?? null,
        stress_indicator: b.stress_indicator ?? b.stressIndicator ?? null,
        readiness_score: b.readiness_score ?? b.readinessScore ?? null,
        raw_data: b.raw_data ?? b.rawData ?? null,
      };

      const { data, error } = await supabase
        .from("health_metrics")
        .upsert(payload, { onConflict: "user_id,date,source" })
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ metric: data });
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

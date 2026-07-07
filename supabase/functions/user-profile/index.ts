import { createAuthedServiceClient, jsonResponse } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createAuthedServiceClient(authHeader);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    if (req.method === "GET") {
      const [profileRes, prefsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_prefs").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        },
        profile: profileRes.data,
        prefs: prefsRes.data,
      });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { first_name, last_name, age, bio, avatar_url, tags, income_pattern, pain_points, goals, preferred_language, tone, emoji, voice, nudges } = body ?? {};

      const profilePayload = {
        user_id: user.id,
        first_name,
        last_name,
        age,
        bio,
        avatar_url,
        tags,
        income_pattern,
        pain_points,
        goals,
        preferred_language,
      };

      const prefsPayload = {
        user_id: user.id,
        tone,
        emoji,
        voice,
        nudges,
      };

      const [profileRes, prefsRes] = await Promise.all([
        supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" }).select().single(),
        supabase.from("user_prefs").upsert(prefsPayload, { onConflict: "user_id" }).select().single(),
      ]);

      return jsonResponse({
        profile: profileRes.data,
        prefs: prefsRes.data,
      });
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

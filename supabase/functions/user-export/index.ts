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

    const [
      profileRes,
      prefsRes,
      accountsRes,
      txRes,
      budgetsRes,
      goalsRes,
      insightsRes,
      messagesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_prefs").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    const exportPayload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profileRes.data,
      prefs: prefsRes.data,
      accounts: accountsRes.data ?? [],
      transactions: txRes.data ?? [],
      budgets: budgetsRes.data ?? [],
      goals: goalsRes.data ?? [],
      insights: insightsRes.data ?? [],
      messages: messagesRes.data ?? [],
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      headers: {
        ...{
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="finzee-export-${user.id}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

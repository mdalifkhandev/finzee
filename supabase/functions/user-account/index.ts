import { createAuthedServiceClient, jsonResponse } from "../_shared.ts";

async function deleteUserData(supabase: ReturnType<typeof createAuthedServiceClient>, userId: string) {
  await Promise.all([
    supabase.from("messages").delete().eq("user_id", userId),
    supabase.from("insights").delete().eq("user_id", userId),
    supabase.from("goals").delete().eq("user_id", userId),
    supabase.from("budgets").delete().eq("user_id", userId),
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("accounts").delete().eq("user_id", userId),
    supabase.from("user_prefs").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("user_id", userId),
  ]);
}

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

    if (req.method !== "DELETE") return jsonResponse({ error: "Method not allowed" }, 405);

    await deleteUserData(supabase, user.id);
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (authDeleteError) return jsonResponse({ error: authDeleteError.message }, 500);

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

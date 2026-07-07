import { createAnonClient, jsonResponse } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { email, redirect_to } = await req.json();
    if (!email) return jsonResponse({ error: "Email is required" }, 400);

    const supabase = createAnonClient(req.headers.get("Authorization"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirect_to || `${Deno.env.get("APP_SCHEME") || "finzeeai"}://reset-password`,
    });

    if (error) return jsonResponse({ error: error.message, code: error.code, status: error.status }, 400);
    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

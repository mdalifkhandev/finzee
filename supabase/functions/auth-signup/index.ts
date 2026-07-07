import { createAnonClient, jsonResponse } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { email, password, full_name } = await req.json();
    if (!email || !password) return jsonResponse({ error: "Email and password are required" }, 400);

    const supabase = createAnonClient(req.headers.get("Authorization"));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (error) return jsonResponse({ error: error.message, code: error.code, status: error.status }, 400);
    return jsonResponse({ user: data.user, session: data.session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

// POST /wearables-oura-token — exchanges an Oura OAuth authorization code for
// tokens and stores them server-side (never returned to the client).
// Body: { code, redirectUri }
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

const OURA_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID");
const OURA_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { code, redirectUri } = await req.json().catch(() => ({}));
    if (!code || !redirectUri) {
      return jsonResponse({ error: "code and redirectUri are required" }, 400);
    }

    if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
      return jsonResponse({
        connected: false,
        source: "stub",
        note: "Set OURA_CLIENT_ID and OURA_CLIENT_SECRET to enable Oura token exchange.",
      });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: OURA_CLIENT_ID,
      client_secret: OURA_CLIENT_SECRET,
    });

    const res = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) return jsonResponse({ error: data.error_description || "Oura token exchange failed" }, 502);

    // Store tokens with the service role; RLS blocks client writes.
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null;
    await supabase.from("wearable_tokens").upsert(
      {
        user_id: user.id,
        provider: "oura",
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        expires_at: expiresAt,
        scope: data.scope ?? null,
      },
      { onConflict: "user_id,provider" },
    );

    return jsonResponse({ connected: true, source: "oura", expires_at: expiresAt });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

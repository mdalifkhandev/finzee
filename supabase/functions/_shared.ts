import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function createAuthedServiceClient(authHeader: string | null) {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });

  return supabase;
}

// Resolves the authenticated user from the request. Returns { supabase, user }
// on success, or { response } holding a 401 to return directly.
export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { response: jsonResponse({ error: "Unauthorized" }, 401) };

  const supabase = createAuthedServiceClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { response: jsonResponse({ error: "Unauthorized" }, 401) };

  return { supabase, user };
}

export const optionsResponse = () =>
  new Response(null, { headers: corsHeaders });

export function createAnonClient(authHeader: string | null) {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });
}

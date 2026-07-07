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

export function createAnonClient(authHeader: string | null) {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });
}

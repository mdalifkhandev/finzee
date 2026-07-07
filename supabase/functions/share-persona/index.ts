import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const personaEmail = (p: string): string | null =>
  p === "jason" ? "jason@finzee.demo" :
  p === "maya" ? "maya@finzee.demo" :
  p === "ava" ? "ava@finzee.demo" : null;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { persona } = await req.json();

    const email = personaEmail(persona?.toLowerCase());
    if (!email) {
      return new Response(JSON.stringify({ error: "Unknown persona" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list?.users?.find((x) => x.email === email);
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Persona not seeded yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = user.id;

    // Fetch snapshot data (read-only)
    const [profile, budgets, goals, transactions] = await Promise.all([
      admin.from("profiles").select("first_name, age, bio, avatar_url").eq("user_id", user_id).maybeSingle(),
      admin.from("budgets").select("category, limit_amount, spent_amount, month").eq("user_id", user_id).order("category"),
      admin.from("goals").select("kind, name, target_amount, current_amount, progress, due_date, status").eq("user_id", user_id).order("due_date"),
      admin.from("transactions").select("ts, merchant, amount, categories, type").eq("user_id", user_id).order("ts", { ascending: false }).limit(8),
    ]);

    return new Response(
      JSON.stringify({
        profile: profile.data,
        budgets: budgets.data || [],
        goals: goals.data || [],
        transactions: transactions.data || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("share-persona error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

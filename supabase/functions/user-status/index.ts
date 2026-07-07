import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ authed: false }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ authed: false }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [acc, tx, bud, goals] = await Promise.all([
      supabase.from("accounts").select("id").eq("user_id", user.id),
      supabase.from("transactions").select("id, ts").eq("user_id", user.id).gte("ts", monthStart.toISOString()),
      supabase.from("budgets").select("id, month, category").eq("user_id", user.id).eq("month", monthStart.toISOString().slice(0, 10)),
      supabase.from("goals").select("id, name, is_completed").eq("user_id", user.id),
    ]);

    console.log(`User status for ${user.id}: ${acc.data?.length ?? 0} accounts, ${tx.data?.length ?? 0} tx MTD`);

    return new Response(JSON.stringify({
      user_id: user.id,
      counts: {
        accounts: acc.data?.length ?? 0,
        tx_mtd: tx.data?.length ?? 0,
        budgets_this_month: bud.data?.length ?? 0,
        goals: goals.data?.length ?? 0
      },
      sample_tx: tx.data?.slice(0, 3) ?? [],
      errors: { 
        acc: acc.error?.message, 
        tx: tx.error?.message, 
        bud: bud.error?.message, 
        goals: goals.error?.message 
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('User status error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

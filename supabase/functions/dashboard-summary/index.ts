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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, age, bio, tags, income_pattern, pain_points, goals")
      .eq("user_id", user.id)
      .single();

    // Fetch user preferences (tone, emoji, voice, nudges)
    const { data: prefs } = await supabase
      .from("user_prefs")
      .select("tone, emoji, voice, nudges")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.first_name || user.email?.split('@')[0] || 'there';

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    // 1) Balance (sum of accounts)
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("balance, name")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const accounts = accountsData || [];
    const total_balance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

    // 2) Income & Spending (MTD)
    const { data: txData } = await supabase
      .from("transactions")
      .select("amount, ts, merchant, categories")
      .eq("user_id", user.id)
      .gte("ts", monthStart.toISOString())
      .order("ts", { ascending: false });

    const transactions = txData || [];
    
    const income_mtd = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    
    const spending_mtd = transactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    // 3) Savings MTD
    const saved_mtd = Math.max(0, income_mtd - spending_mtd);

    // 4) Recent transactions (top 5)
    const recent = transactions.slice(0, 5).map((t) => ({
      merchant: t.merchant || "Unknown",
      amount: Number(t.amount),
      ts: t.ts,
      category: t.categories?.[0] || "Uncategorized"
    }));

    // 5) Budgets (current month)
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("category, limit_amount, spent_amount, month")
      .eq("user_id", user.id)
      .eq("month", monthStartStr);

    const budgets = budgetsData || [];

    // 6) Goals - using schema fields
    const { data: goalsData } = await supabase
      .from("goals")
      .select("name, target_amount, current_amount, target_date, is_completed, icon, color")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .order("target_date", { ascending: true });

    const goals = goalsData || [];

    // 7) AI insights - using schema fields
    const { data: insightsData } = await supabase
      .from("insights")
      .select("title, description, type, category, created_at")
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(5);

    const insights = insightsData || [];

    console.log(`Dashboard summary for user ${user.id}: ${accounts.length} accounts, ${transactions.length} transactions MTD`);

    return new Response(JSON.stringify({
      user_id: user.id,
      user_name: userName,
      profile,    // rich profile data for AI personalization
      prefs,      // tone/emoji/voice preferences
      summary: {
        total_balance: +total_balance.toFixed(2),
        income_mtd: +income_mtd.toFixed(2),
        spending_mtd: +spending_mtd.toFixed(2),
        saved_mtd: +saved_mtd.toFixed(2)
      },
      recent,
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: Number(b.limit_amount),
        spent: Number(b.spent_amount),
        variance: Number(b.spent_amount) - Number(b.limit_amount)
      })),
      goals: goals.map((g) => ({
        name: g.name,
        target: Number(g.target_amount),
        current: Number(g.current_amount),
        progress: g.target_amount > 0 ? +(Number(g.current_amount) / Number(g.target_amount) * 100).toFixed(1) : 0,
        due_date: g.target_date,
        icon: g.icon,
        color: g.color
      })),
      insights: insights.map((i) => ({
        title: i.title,
        description: i.description,
        type: i.type,
        category: i.category,
        created_at: i.created_at
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('Dashboard summary error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

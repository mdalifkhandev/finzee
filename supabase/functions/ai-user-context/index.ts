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
      console.log('ai-user-context: Unauthorized request');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`ai-user-context: Fetching context for user ${user.id}`);

    // Parallel fetch: profile, prefs, accounts, goals, budgets
    const [profileRes, prefsRes, accountsRes, goalsRes, budgetsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, age, bio, tags, income_pattern, pain_points, goals, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_prefs")
        .select("tone, emoji, voice, nudges")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id, name, balance, type")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("goals")
        .select("id, name, kind, target_amount, current_amount, due_date, target_date, is_completed, status, progress, category")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("due_date", { ascending: true }),
      supabase
        .from("budgets")
        .select("category, limit_amount, spent_amount, month")
        .eq("user_id", user.id)
        .order("month", { ascending: false })
        .limit(10),
    ]);

    const profile = profileRes.data;
    const prefs = prefsRes.data;
    const accounts = accountsRes.data || [];
    const goals = goalsRes.data || [];
    const budgets = budgetsRes.data || [];

    // Compute quick financial summary
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const activeGoalsCount = goals.length;
    const totalGoalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0);
    const totalGoalProgress = goals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0);

    // Get current month budgets
    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString().slice(0, 10);
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    const totalBudgetLimit = currentBudgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
    const totalBudgetSpent = currentBudgets.reduce((sum, b) => sum + Number(b.spent_amount || 0), 0);

    const context = {
      user_id: user.id,
      user_email: user.email,
      profile: profile ? {
        first_name: profile.first_name,
        age: profile.age,
        income_pattern: profile.income_pattern,
        pain_points: profile.pain_points,
        goals: profile.goals,
        preferred_language: profile.preferred_language,
      } : null,
      prefs: prefs ? {
        tone: prefs.tone || 'calm',
        emoji: prefs.emoji || 'low',
        nudges: prefs.nudges ?? true,
      } : { tone: 'calm', emoji: 'low', nudges: true },
      financial_summary: {
        total_balance: +totalBalance.toFixed(2),
        accounts_count: accounts.length,
        active_goals_count: activeGoalsCount,
        goals_progress_pct: totalGoalTarget > 0 
          ? +((totalGoalProgress / totalGoalTarget) * 100).toFixed(1) 
          : 0,
        budget_utilization_pct: totalBudgetLimit > 0 
          ? +((totalBudgetSpent / totalBudgetLimit) * 100).toFixed(1) 
          : 0,
      },
      goals: goals.map(g => ({
        name: g.name,
        kind: g.kind,
        category: g.category,
        current_amount: Number(g.current_amount),
        target_amount: Number(g.target_amount),
        progress_pct: g.target_amount > 0 
          ? +((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1) 
          : 0,
        due_date: g.due_date || g.target_date,
        status: g.status,
      })),
      budgets: currentBudgets.slice(0, 5).map(b => ({
        category: b.category,
        spent: Number(b.spent_amount),
        limit: Number(b.limit_amount),
        pct: b.limit_amount > 0 
          ? +((Number(b.spent_amount) / Number(b.limit_amount)) * 100).toFixed(1) 
          : 0,
      })),
    };

    console.log(`ai-user-context: Returning context for ${profile?.first_name || user.email}`);

    return new Response(JSON.stringify(context), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('ai-user-context error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

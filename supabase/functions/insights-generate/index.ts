import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type Tx = { amount: number; ts: string; merchant: string | null; categories: string[] | null; };

function aggregate(transactions: Tx[]) {
  const byCat = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const merchants = new Map<string, number>();

  for (const t of transactions) {
    const cat = (t.categories?.[0] || "Uncategorized").toLowerCase();
    byCat.set(cat, (byCat.get(cat) || 0) + Math.abs(t.amount));
    const ym = t.ts.slice(0, 10).slice(0, 7);
    byMonth.set(ym, (byMonth.get(ym) || 0) + Math.abs(t.amount));
    if (t.merchant) {
      const m = t.merchant.toLowerCase();
      merchants.set(m, (merchants.get(m) || 0) + Math.abs(t.amount));
    }
  }

  const topCats = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total: +total.toFixed(2) }));

  const topMerchants = [...merchants.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total: +total.toFixed(2) }));

  const months = [...byMonth.keys()].sort();
  const last = months.at(-1), prev = months.at(-2);
  const trend = {
    current_month: last || null,
    current_total: last ? +(byMonth.get(last) || 0).toFixed(2) : 0,
    prev_month: prev || null,
    prev_total: prev ? +(byMonth.get(prev) || 0).toFixed(2) : 0,
    delta: last && prev
      ? +(((byMonth.get(last)! - byMonth.get(prev)!) / Math.max(1, byMonth.get(prev)!)) * 100).toFixed(1)
      : 0
  };

  return { topCats, topMerchants, trend };
}

const SYSTEM_PROMPT = `You are "FinZee", a supportive, emotionally intelligent personal finance coach.
Use the JSON context to give specific guidance about THIS user.
Tone: calm, respectful, encouraging; avoid shaming; offer 1–3 concrete actions.
Always reflect their goals first, then budgets vs spend, then quick wins.
Structure:
- 1 sentence empathic summary
- 3 bullet insights (with numbers)
- 2 bullet action items (next 7 days)
- optional: "Try this in the app" line with exact button/page names
Limit to ~150–200 words.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body for optional question
    let question = '';
    try {
      const body = await req.json();
      question = body.question || '';
    } catch {
      // No body or invalid JSON, continue without question
    }

    console.log(`Generating insights for user ${user.id}${question ? `: ${question.substring(0, 50)}...` : ''}`);

    // Fetch transactions from last 90 days
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const { data: tx = [], error: txError } = await supabase
      .from('transactions')
      .select('amount, ts, merchant, categories')
      .eq('user_id', user.id)
      .gte('ts', since.toISOString())
      .order('ts', { ascending: false })
      .limit(2000);

    if (txError) {
      console.error('Error fetching transactions:', txError);
    }

    if (!tx || tx.length === 0) {
      return new Response(JSON.stringify({
        text: "I don't see any transactions yet—connect a bank in **Settings → Accounts** or add transactions in **Transactions**."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current month key
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthKey = thisMonth.toISOString().slice(0, 7);

    // Fetch current budgets
    const { data: budgets = [], error: budgetError } = await supabase
      .from('budgets')
      .select('category, limit_amount, spent_amount')
      .eq('user_id', user.id);

    if (budgetError) {
      console.error('Error fetching budgets:', budgetError);
    }

    // Fetch goals
    const { data: goals = [], error: goalsError } = await supabase
      .from('goals')
      .select('name, target_amount, current_amount, target_date, is_completed')
      .eq('user_id', user.id)
      .order('target_date', { ascending: true });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
    }

    const totals = aggregate(tx as Tx[]);

    // Calculate budget variance
    const budgetVariance = (budgets || []).map(b => ({
      category: b.category,
      limit: Number(b.limit_amount),
      spent: Number(b.spent_amount),
      variance: Number(b.spent_amount) - Number(b.limit_amount)
    })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);

    // Adapt goals to expected format
    const formattedGoals = (goals || []).map(g => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      due_date: g.target_date,
      progress: g.target_amount > 0 ? +(g.current_amount / g.target_amount * 100).toFixed(1) : 0,
      is_completed: g.is_completed
    }));

    const context = { month: monthKey, totals, budgetVariance, goals: formattedGoals };

    console.log(`Context prepared: ${tx.length} transactions, ${budgets?.length || 0} budgets, ${goals?.length || 0} goals`);

    // Build user message with optional question
    const userContent = question
      ? `User question: ${question}\n\nUser finance context (JSON): ${JSON.stringify(context)}`
      : `User finance context (JSON): ${JSON.stringify(context)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate insights' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate the analysis.";

    console.log(`Insights generated successfully, tokens: ${data.usage?.total_tokens}`);

    return new Response(JSON.stringify({ text, usage: data.usage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in insights-generate function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

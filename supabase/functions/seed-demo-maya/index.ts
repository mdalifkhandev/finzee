import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL = "maya@finzee.demo";
const PASSWORD = "Demo123!$";

// Helper: first day of month (UTC)
function monthStartUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// Helper: random number in range
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 0) Ensure demo user exists
    const { data: userLookup } = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = userLookup?.users?.find(u => u.email === EMAIL) || null;

    if (!user) {
      const created = await sbAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true
      });
      if (created.error) {
        console.error('Failed to create user:', created.error);
        return new Response(JSON.stringify({ error: created.error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      user = created.data.user!;
      console.log('Created demo user Maya:', user.id);
    } else {
      console.log('Found existing demo user Maya:', user.id);
    }

    const user_id = user!.id;

    // 1) Profile tuned for Maya (27, freelancer) with testimonial
    const { error: profileErr } = await sbAdmin.from("profiles").upsert({
      user_id,
      first_name: "Maya",
      last_name: "Brooks",
      age: 27,
      bio: "Freelance creative with multiple income streams. Wants proactive, personalized cash-flow and tax guidance that adapts as she grows.",
      tags: {
        persona: ["freelancer", "tax-questions", "irregular-income", "personalized-coaching"],
        testimonial: {
          tag: "maya-case",
          loves: [
            "Cash flow forecasting that adapts to her irregular income patterns",
            "Automated tax set-asides that save 20% from each payment",
            "Personalized insights like 'Great pacing on groceries this month!'"
          ]
        }
      },
      income_pattern: "irregular_freelance",
      pain_points: ["generic-apps", "tax-deductions", "cash-flow"],
      goals: ["build-cash-buffer", "automate-taxes", "simple-budget"],
      avatar_url: "/demo/maya-avatar.png"
    }, { onConflict: "user_id" });
    if (profileErr) console.error('Profile upsert error:', profileErr);

    // User preferences
    const { error: prefsErr } = await sbAdmin.from("user_prefs").upsert({
      user_id,
      tone: "calm",
      emoji: "low",
      voice: "alloy",
      nudges: true
    }, { onConflict: "user_id" });
    if (prefsErr) console.error('User prefs upsert error:', prefsErr);

    // 2) Accounts with provider and external_id - Maya has multiple accounts
    const accounts = [
      { 
        name: "Primary Checking", 
        type: "checking", 
        institution: "Coastal Credit Union", 
        balance: 4850.00, 
        provider: "Coastal Credit Union", 
        external_id: "ccu_chk_maya_001",
        mask: "3847",
        currency: "USD",
        is_active: true
      },
      { 
        name: "Business Checking", 
        type: "checking", 
        institution: "Coastal Credit Union", 
        balance: 12420.00, 
        provider: "Coastal Credit Union", 
        external_id: "ccu_biz_maya_002",
        mask: "9156",
        currency: "USD",
        is_active: true
      },
      { 
        name: "Tax Savings", 
        type: "savings", 
        institution: "Ally Bank", 
        balance: 3280.00, 
        provider: "Ally Bank", 
        external_id: "ally_tax_maya_003",
        mask: "7294",
        currency: "USD",
        is_active: true
      },
      { 
        name: "Emergency Fund", 
        type: "savings", 
        institution: "Ally Bank", 
        balance: 6300.00, 
        provider: "Ally Bank", 
        external_id: "ally_emerg_maya_004",
        mask: "1583",
        currency: "USD",
        is_active: true
      }
    ];

    // Upsert accounts and get the Business Checking ID for transactions
    let businessCheckingId: string | null = null;
    
    for (const acc of accounts) {
      const { data: upsertedAcc, error: accErr } = await sbAdmin.from("accounts").upsert(
        { user_id, ...acc },
        { onConflict: "user_id,provider,external_id" }
      ).select("id").single();
      
      if (accErr) {
        console.error('Account upsert error:', accErr);
      } else if (acc.name === "Business Checking") {
        businessCheckingId = upsertedAcc?.id;
      }
    }

    // Fallback: query for the business checking account if upsert didn't return it
    if (!businessCheckingId) {
      const { data: bizAcc } = await sbAdmin.from("accounts")
        .select("id")
        .eq("user_id", user_id)
        .eq("external_id", "ccu_biz_maya_002")
        .single();
      businessCheckingId = bizAcc?.id;
    }

    // Use Business Checking for transactions
    const accountId = businessCheckingId || "00000000-0000-0000-0000-000000000000"; // Fallback UUID (should never happen)

    // 3) Generate 90 days of transactions reflecting irregular freelance income
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    start.setUTCMonth(start.getUTCMonth() - 2); // 2 months back

    const txRows: Array<{
      id: string;
      user_id: string;
      account_id: string;
      ts: string;
      amount: number;
      merchant: string;
      categories: string[];
      type: string;
      is_recurring: boolean;
      description?: string;
    }> = [];

    const merchants = {
      groceries: ["Safeway", "Whole Foods", "Trader Joe's", "Costco"],
      transport: ["Uber", "Lyft", "Costco Gas", "Shell Gas Station"],
      dining: ["Local Cafe", "Chipotle", "Sushi Go", "Pizza Palace"],
      subscriptions: ["Spotify", "Notion", "Figma"],
      software: ["Adobe", "Canva Pro", "Domain Registrar"],
      shopping: ["Target", "Amazon", "Etsy"],
      education: ["Coursera", "Udemy", "Skillshare"],
      utilities: ["T-Mobile", "Comcast"]
    };

    function addTx(id: string, ts: string, amount: number, merchant: string, categories: string[], isRecurring = false, description?: string) {
      txRows.push({
        id,
        user_id,
        account_id: accountId,
        ts,
        amount: +amount.toFixed(2),
        merchant,
        categories,
        type: amount > 0 ? "income" : "expense",
        is_recurring: isRecurring,
        description
      });
    }

    // Iterate days, create purchases and income bursts
    const dayMs = 24 * 60 * 60 * 1000;
    for (let t = start.getTime(); t <= today.getTime(); t += dayMs) {
      const d = new Date(t);
      const hour = Math.floor(rnd(8, 18));
      const minute = Math.floor(rnd(0, 59));
      const dateIso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute)).toISOString();

      // Income bursts roughly every 7–12 days (3–6 per month)
      if (Math.random() < 0.12) {
        const sources = ["Client A – Project", "Client B – Retainer", "Marketplace Payout"];
        const src = sources[Math.floor(Math.random() * sources.length)];
        const amt = rnd(450, 2200);
        addTx(`m-inc-${t}`, dateIso, +amt.toFixed(2), src, ["income"], false, "Freelance income");

        // Tax set-aside transfer (20%)
        const taxTs = new Date(t + 60 * 60 * 1000).toISOString();
        addTx(`m-tax-${t}`, taxTs, -Math.round(amt * 0.2 * 100) / 100, "Tax Set-Aside Transfer", ["taxes"], false, "Quarterly tax savings");
      }

      // Subscriptions (once a month on ~9th)
      if (d.getUTCDate() === 9) {
        addTx(`m-sub-${t}-0`, dateIso, -14.99, "Spotify", ["subscriptions"], true, "Music subscription");
        addTx(`m-sub-${t}-1`, dateIso, -10.00, "Notion", ["subscriptions"], true, "Productivity tool");
        addTx(`m-sub-${t}-2`, dateIso, -15.00, "Figma", ["subscriptions"], true, "Design tool");
      }

      // Utilities (monthly on 15th)
      if (d.getUTCDate() === 15) {
        addTx(`m-util-${t}-1`, dateIso, -75.00, "T-Mobile", ["utilities"], true, "Phone bill");
        addTx(`m-util-${t}-2`, dateIso, -89.00, "Comcast", ["utilities"], true, "Internet");
      }

      // Daily spend patterns
      if (Math.random() < 0.45) {
        const m = merchants.groceries[Math.floor(Math.random() * merchants.groceries.length)];
        addTx(`m-gr-${t}`, dateIso, -rnd(35, 120), m, ["groceries"], false, "Groceries");
      }
      if (Math.random() < 0.32) {
        const m = merchants.transport[Math.floor(Math.random() * merchants.transport.length)];
        addTx(`m-tr-${t}`, dateIso, -rnd(12, 58), m, ["transportation"], false, "Transportation");
      }
      if (Math.random() < 0.22) {
        const m = merchants.dining[Math.floor(Math.random() * merchants.dining.length)];
        addTx(`m-di-${t}`, dateIso, -rnd(12, 42), m, ["dining"], false, "Dining out");
      }
      if (Math.random() < 0.07) {
        const m = merchants.education[Math.floor(Math.random() * merchants.education.length)];
        addTx(`m-ed-${t}`, dateIso, -rnd(20, 59), m, ["education"], false, "Online course");
      }
      if (Math.random() < 0.05) {
        const m = merchants.software[Math.floor(Math.random() * merchants.software.length)];
        addTx(`m-sw-${t}`, dateIso, -rnd(8, 29), m, ["software"], false, "Software tool");
      }
      if (Math.random() < 0.12) {
        const m = merchants.shopping[Math.floor(Math.random() * merchants.shopping.length)];
        addTx(`m-sh-${t}`, dateIso, -rnd(18, 95), m, ["shopping"], false, "Shopping");
      }
    }

    // Upsert transactions
    if (txRows.length) {
      const { error: txErr } = await sbAdmin.from("transactions").upsert(txRows, { onConflict: "id" });
      if (txErr) console.error('Transaction upsert error:', txErr);
    }

    // 4) Budgets tuned to freelancer pattern
    const currMonth = monthStartUTC();
    const monthDate = currMonth.toISOString().slice(0, 10);

    // Calculate actual spending from transactions
    const { data: txMTD = [] } = await sbAdmin
      .from("transactions")
      .select("amount, categories")
      .eq("user_id", user_id)
      .gte("ts", currMonth.toISOString());

    const spentByCat: Record<string, number> = {};
    for (const t of txMTD as Array<{ amount: number; categories: string[] }>) {
      if (t.amount < 0) {
        const c = (t.categories?.[0] || "uncategorized").toLowerCase();
        spentByCat[c] = (spentByCat[c] || 0) + Math.abs(t.amount);
      }
    }

    const budgets = [
      { user_id, month: monthDate, category: "Groceries", limit_amount: 700, spent_amount: Math.round((spentByCat["groceries"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Dining", limit_amount: 300, spent_amount: Math.round((spentByCat["dining"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Transportation", limit_amount: 350, spent_amount: Math.round((spentByCat["transportation"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Subscriptions", limit_amount: 120, spent_amount: Math.round((spentByCat["subscriptions"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Education", limit_amount: 120, spent_amount: Math.round((spentByCat["education"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Software", limit_amount: 80, spent_amount: Math.round((spentByCat["software"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Shopping", limit_amount: 200, spent_amount: Math.round((spentByCat["shopping"] || 0) * 100) / 100, period: "monthly" },
      { user_id, month: monthDate, category: "Utilities", limit_amount: 180, spent_amount: Math.round((spentByCat["utilities"] || 0) * 100) / 100, period: "monthly" }
    ];
    
    // Upsert budgets one by one using the unique constraint
    for (const budget of budgets) {
      const { error: budgetErr } = await sbAdmin.from("budgets").upsert(budget, { onConflict: "user_id,month,category" });
      if (budgetErr) console.error('Budget upsert error:', budgetErr);
    }

    // 5) Goals aligned with freelancer needs (using kind for upsert)
    const dueJ = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 5, 28)).toISOString().slice(0, 10);
    await sbAdmin.from("goals").upsert([
      { user_id, kind: "Emergency Fund", target_amount: 10000, due_date: dueJ, status: "active", progress: 0.63, name: "Emergency Fund", target_date: dueJ, current_amount: 6300, is_completed: false, category: "savings" },
      { user_id, kind: "Vacation to Japan", target_amount: 5000, due_date: dueJ, status: "active", progress: 0.42, name: "Vacation to Japan", target_date: dueJ, current_amount: 2100, is_completed: false, category: "travel" },
      { user_id, kind: "New MacBook", target_amount: 2500, due_date: dueJ, status: "active", progress: 0.32, name: "New MacBook", target_date: dueJ, current_amount: 800, is_completed: false, category: "tech" }
    ], { onConflict: "user_id,kind" });

    // 6) Insights reflecting Maya's profile
    const insights = [
      { id: "m-i-cashflow", user_id, type: "tip", title: "Cash flow volatility detected", description: "Create an income 'floor' of $2,500 and sweep excess to your buffer weekly.", category: "cash-flow", is_read: false, is_dismissed: false },
      { id: "m-i-taxes", user_id, type: "warning", title: "Quarterly taxes reminder", description: "You've set aside $528 for Q2 taxes. Target is $2,400—consider increasing your 20% set-aside.", category: "taxes", is_read: false, is_dismissed: false },
      { id: "m-i-subs", user_id, type: "recommendation", title: "Subscription review", description: "You're spending ~$40/mo on subscriptions. Consider if all 3 tools are essential.", category: "subscriptions", is_read: false, is_dismissed: false },
      { id: "m-i-groceries", user_id, type: "achievement", title: "Groceries on track!", description: `You've spent $${Math.round(spentByCat["groceries"] || 0)} of your $700 grocery budget. Great pacing!`, category: "groceries", is_read: false, is_dismissed: false }
    ];
    await sbAdmin.from("insights").upsert(insights, { onConflict: "id" });

    // 7) Verification
    const [txCount, budgetCount, goalsCount, insightsCount] = await Promise.all([
      sbAdmin.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      sbAdmin.from("budgets").select("id", { count: "exact", head: true }).eq("user_id", user_id).eq("month", monthDate),
      sbAdmin.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      sbAdmin.from("insights").select("id", { count: "exact", head: true }).eq("user_id", user_id),
    ]);

    const seededDays = Math.round((today.getTime() - start.getTime()) / dayMs) + 1;

    const report = {
      email: EMAIL,
      password: PASSWORD,
      user_id,
      seeded_days: seededDays,
      counts: {
        transactions: txCount.count || 0,
        budgets: budgetCount.count || 0,
        goals: goalsCount.count || 0,
        insights: insightsCount.count || 0
      },
      pass: (txCount.count || 0) > 50 && (budgetCount.count || 0) >= 5 && (goalsCount.count || 0) >= 3
    };

    console.log('Seed Maya complete:', report);

    return new Response(JSON.stringify(report), {
      status: report.pass ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('Seed Maya error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
